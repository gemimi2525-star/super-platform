/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CORE OS — Firestore Job Queue (Phase 31)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Firestore-based job queue with lease, heartbeat, retry, and dead-letter.
 * Supports: enqueue, claim (lease-based), heartbeat, retry, dead-letter.
 *
 * Phase 31 additions:
 * - Deterministic retry backoff (no random jitter)
 * - Enhanced DLQ with full context
 * - Structured lifecycle logging
 *
 * @module coreos/jobs/queue
 * @version 3.0.0 (Phase 31)
 */

import { getAdminFirestore } from '@/lib/firebase-admin';
import { createHash } from 'crypto';
import type {
    JobTicket, JobEnvelope, JobQueueRecord, JobStatus,
    JobResult, JobLastError,
} from './types';
import {
    COLLECTION_JOB_QUEUE, COLLECTION_JOB_RESULTS,
    COLLECTION_JOB_DEAD_LETTERS,
    DEFAULT_MAX_ATTEMPTS, LEASE_DURATION_MS,
    RETRY_BASE_DELAY_MS, RETRY_MAX_DELAY_MS,
} from './types';
import { jobLogger } from './job-logger';

// ═══════════════════════════════════════════════════════════════════════════
// ENQUEUE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Enqueue a job into the Firestore queue.
 * Uses jobId as document ID (natural dedup).
 */
export async function enqueueJob(envelope: JobEnvelope, maxAttempts?: number): Promise<void> {
    const db = getAdminFirestore();
    const now = Date.now();

    const record: JobQueueRecord = {
        ticket: envelope.ticket,
        payload: envelope.payload,
        version: envelope.version,
        status: 'PENDING',
        workerId: null,
        claimedAt: null,
        createdAt: now,
        updatedAt: now,
        nonce: envelope.ticket.nonce,
        // Phase 22A fields
        attempts: 0,
        maxAttempts: maxAttempts ?? DEFAULT_MAX_ATTEMPTS,
        nextRunAt: now,
    };

    await db.collection(COLLECTION_JOB_QUEUE).doc(envelope.ticket.jobId).set(record);

    jobLogger.log('job.enqueued', {
        jobId: envelope.ticket.jobId,
        traceId: envelope.ticket.traceId,
        jobType: envelope.ticket.jobType,
        maxAttempts: record.maxAttempts,
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// CLAIM (Lease-based Atomic via Transaction)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Claim the next available job atomically with lease.
 * Queries PENDING or FAILED_RETRYABLE jobs where nextRunAt <= now.
 * Returns the claimed JobEnvelope (with attempts/maxAttempts) or null.
 */
export async function claimNextJob(workerId: string): Promise<(JobEnvelope & { attempts: number; maxAttempts: number }) | null> {
    const db = getAdminFirestore();
    const now = Date.now();

    // Query jobs eligible for claiming
    const query = db
        .collection(COLLECTION_JOB_QUEUE)
        .where('status', 'in', ['PENDING', 'FAILED_RETRYABLE'])
        .where('nextRunAt', '<=', now)
        .orderBy('nextRunAt', 'asc')
        .limit(1);

    const snapshot = await query.get();
    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    const record = doc.data() as JobQueueRecord;

    // Check if ticket has expired
    if (record.ticket.expiresAt <= now) {
        await doc.ref.update({
            status: 'FAILED' as JobStatus,
            updatedAt: now,
            lastError: { code: 'TICKET_EXPIRED', message: 'Ticket expired before claim', at: now },
        });
        return null;
    }

    // Atomic claim via transaction
    try {
        const newAttempts = record.attempts + 1;

        await db.runTransaction(async (tx) => {
            const freshDoc = await tx.get(doc.ref);
            const freshData = freshDoc.data() as JobQueueRecord;

            // Double-check status (another worker may have claimed it)
            if (freshData.status !== 'PENDING' && freshData.status !== 'FAILED_RETRYABLE') {
                throw new Error('Job already claimed');
            }

            tx.update(doc.ref, {
                status: 'PROCESSING' as JobStatus,
                workerId,
                claimedAt: now,
                updatedAt: now,
                attempts: newAttempts,
                lease: {
                    workerId,
                    leaseUntil: now + LEASE_DURATION_MS,
                },
            });
        });

        console.log(`[JobQueue] Claimed: ${record.ticket.jobId} by ${workerId} (attempt ${record.attempts + 1}/${record.maxAttempts})`);

        return {
            ticket: record.ticket,
            payload: record.payload,
            version: record.version,
            attempts: record.attempts + 1,
            maxAttempts: record.maxAttempts,
        };
    } catch {
        // Another worker claimed it — return null
        return null;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// HEARTBEAT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Extend lease and record heartbeat for a running job.
 */
export async function heartbeatJob(jobId: string, workerId: string): Promise<void> {
    const db = getAdminFirestore();
    const now = Date.now();

    await db.collection(COLLECTION_JOB_QUEUE).doc(jobId).update({
        'lease.workerId': workerId,
        'lease.leaseUntil': now + LEASE_DURATION_MS,
        'heartbeat.workerId': workerId,
        'heartbeat.at': now,
        updatedAt: now,
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// DETERMINISTIC BACKOFF (Phase 31.3)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Compute deterministic backoff delay for retry.
 * Same jobId + same attempt = same delay (no randomness).
 *
 * Uses hash(jobId + attempt) to produce a deterministic "jitter"
 * that varies per-job but is reproducible.
 */
export function computeBackoff(jobId: string, attempt: number): number {
    // Exponential base: min(2^attempt, 60) seconds
    const backoffSec = Math.min(Math.pow(2, attempt), RETRY_MAX_DELAY_MS / 1000);
    const baseMs = backoffSec * 1000;

    // Deterministic jitter: 0–3000ms based on hash
    const hash = createHash('sha256').update(`${jobId}:${attempt}`).digest();
    const jitterMs = (hash.readUInt16BE(0) % 3000);

    return Math.min(baseMs + jitterMs, RETRY_MAX_DELAY_MS);
}

// ═══════════════════════════════════════════════════════════════════════════
// RETRY (FAILED_RETRYABLE) — Phase 31.3 Updated
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Mark job for retry with deterministic exponential backoff.
 * Sets status to FAILED_RETRYABLE and computes deterministic nextRunAt.
 */
export async function retryJob(
    jobId: string,
    lastError: JobLastError,
    attempts: number,
): Promise<void> {
    const db = getAdminFirestore();
    const now = Date.now();

    // Deterministic backoff (Phase 31.3)
    const delayMs = computeBackoff(jobId, attempts);
    const nextRunAt = now + delayMs;

    await db.collection(COLLECTION_JOB_QUEUE).doc(jobId).update({
        status: 'FAILED_RETRYABLE' as JobStatus,
        lastError,
        nextRunAt,
        updatedAt: now,
        // Clear lease
        lease: null,
        workerId: null,
    });

    jobLogger.log('job.retried', {
        jobId,
        attempt: attempts,
        note: `Retry scheduled in ${Math.round(delayMs / 1000)}s (deterministic)`,
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// DEAD LETTER
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Mark job as permanently failed (dead-letter).
 * Writes full context to job_dead_letters collection for Ops visibility.
 */
export async function deadLetterJob(
    jobId: string,
    lastError: JobLastError,
): Promise<void> {
    const db = getAdminFirestore();
    const now = Date.now();

    // Read full job record for DLQ context
    const jobDoc = await db.collection(COLLECTION_JOB_QUEUE).doc(jobId).get();
    const jobRecord = jobDoc.exists ? jobDoc.data() as JobQueueRecord : null;

    await db.collection(COLLECTION_JOB_QUEUE).doc(jobId).update({
        status: 'DEAD' as JobStatus,
        lastError,
        updatedAt: now,
        lease: null,
    });

    // Write full context to DLQ collection (Phase 31.4)
    await db.collection(COLLECTION_JOB_DEAD_LETTERS).doc(jobId).set({
        jobId,
        originalTicket: jobRecord?.ticket ?? null,
        payload: jobRecord?.payload ?? null,
        lastError,
        totalAttempts: jobRecord?.attempts ?? 0,
        maxAttempts: jobRecord?.maxAttempts ?? 3,
        lastWorkerId: jobRecord?.workerId ?? null,
        deadAt: now,
        createdAt: jobRecord?.createdAt ?? null,
        jobType: jobRecord?.ticket?.jobType ?? 'unknown',
        traceId: jobRecord?.ticket?.traceId ?? null,
    });

    jobLogger.log('job.dead', {
        jobId,
        traceId: jobRecord?.ticket?.traceId,
        jobType: jobRecord?.ticket?.jobType,
        attempt: jobRecord?.attempts ?? 0,
        maxAttempts: jobRecord?.maxAttempts ?? 3,
        error: lastError,
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// STATUS UPDATE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Update job status after result callback.
 */
export async function updateJobStatus(
    jobId: string,
    status: JobStatus,
    result?: JobResult,
): Promise<void> {
    const db = getAdminFirestore();
    const now = Date.now();

    // Update queue record
    const updateData: Record<string, unknown> = {
        status,
        updatedAt: now,
    };

    // Clear lease on completion
    if (status === 'COMPLETED' || status === 'DEAD') {
        updateData.lease = null;
    }

    await db.collection(COLLECTION_JOB_QUEUE).doc(jobId).update(updateData);

    // Store result if provided
    if (result) {
        await db.collection(COLLECTION_JOB_RESULTS).doc(jobId).set({
            ...result,
            receivedAt: now,
        });
    }

    console.log(`[JobQueue] ${jobId} → ${status}`);
}

// ═══════════════════════════════════════════════════════════════════════════
// LOOKUP
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get job status and details by jobId.
 */
export async function getJobStatus(jobId: string): Promise<{
    status: JobStatus;
    ticket: JobTicket;
    workerId: string | null;
    claimedAt: number | null;
    createdAt: number;
    attempts: number;
    maxAttempts: number;
    lastError?: JobLastError;
    result?: JobResult;
} | null> {
    const db = getAdminFirestore();

    const doc = await db.collection(COLLECTION_JOB_QUEUE).doc(jobId).get();
    if (!doc.exists) return null;

    const record = doc.data() as JobQueueRecord;

    // Fetch result if completed or failed
    let result: JobResult | undefined;
    if (record.status === 'COMPLETED' || record.status === 'FAILED' || record.status === 'DEAD') {
        const resultDoc = await db.collection(COLLECTION_JOB_RESULTS).doc(jobId).get();
        if (resultDoc.exists) {
            result = resultDoc.data() as JobResult;
        }
    }

    return {
        status: record.status,
        ticket: record.ticket,
        workerId: record.workerId,
        claimedAt: record.claimedAt,
        createdAt: record.createdAt,
        attempts: record.attempts ?? 0,
        maxAttempts: record.maxAttempts ?? DEFAULT_MAX_ATTEMPTS,
        lastError: record.lastError,
        result,
    };
}
