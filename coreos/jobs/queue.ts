/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CORE OS — Firestore Job Queue (Phase 22A)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Firestore-based job queue with lease, heartbeat, retry, and dead-letter.
 * Supports: enqueue, claim (lease-based), heartbeat, retry, dead-letter.
 *
 * @module coreos/jobs/queue
 * @version 2.0.0 (Phase 22A)
 */

import { getAdminFirestore } from '@/lib/firebase-admin';
import type {
    JobTicket, JobEnvelope, JobQueueRecord, JobStatus,
    JobResult, JobLastError,
} from './types';
import {
    COLLECTION_JOB_QUEUE, COLLECTION_JOB_RESULTS,
    DEFAULT_MAX_ATTEMPTS, LEASE_DURATION_MS,
} from './types';

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

    console.log(`[JobQueue] Enqueued: ${envelope.ticket.jobId} (${envelope.ticket.jobType}) maxAttempts=${record.maxAttempts}`);
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
// RETRY (FAILED_RETRYABLE)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Mark job for retry with exponential backoff.
 * Sets status to FAILED_RETRYABLE and computes nextRunAt.
 */
export async function retryJob(
    jobId: string,
    lastError: JobLastError,
    attempts: number,
): Promise<void> {
    const db = getAdminFirestore();
    const now = Date.now();

    // Backoff: min(2^attempts, 60) seconds + jitter 0-3s
    const backoffSec = Math.min(Math.pow(2, attempts), 60);
    const jitterMs = Math.floor(Math.random() * 3000);
    const nextRunAt = now + (backoffSec * 1000) + jitterMs;

    await db.collection(COLLECTION_JOB_QUEUE).doc(jobId).update({
        status: 'FAILED_RETRYABLE' as JobStatus,
        lastError,
        nextRunAt,
        updatedAt: now,
        // Clear lease
        lease: null,
        workerId: null,
    });

    console.log(`[JobQueue] ${jobId} → FAILED_RETRYABLE (attempt ${attempts}, nextRun in ${backoffSec}s + ${jitterMs}ms jitter)`);
}

// ═══════════════════════════════════════════════════════════════════════════
// DEAD LETTER
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Mark job as permanently failed (dead-letter).
 */
export async function deadLetterJob(
    jobId: string,
    lastError: JobLastError,
): Promise<void> {
    const db = getAdminFirestore();
    const now = Date.now();

    await db.collection(COLLECTION_JOB_QUEUE).doc(jobId).update({
        status: 'DEAD' as JobStatus,
        lastError,
        updatedAt: now,
        lease: null,
    });

    console.log(`[JobQueue] ${jobId} → DEAD (permanent failure)`);
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
