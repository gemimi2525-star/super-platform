/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CORE OS — Firestore Job Queue (Phase 21C)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Minimal Firestore-based job queue.
 * Supports: enqueue, claim (atomic), status update, and lookup.
 *
 * @module coreos/jobs/queue
 * @version 1.0.0 (Phase 21C)
 */

import { getAdminFirestore } from '@/lib/firebase-admin';
import type { JobTicket, JobEnvelope, JobQueueRecord, JobStatus, JobResult } from './types';
import { COLLECTION_JOB_QUEUE, COLLECTION_JOB_RESULTS } from './types';

// ═══════════════════════════════════════════════════════════════════════════
// ENQUEUE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Enqueue a job into the Firestore queue.
 * Uses jobId as document ID (natural dedup).
 */
export async function enqueueJob(envelope: JobEnvelope): Promise<void> {
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
    };

    await db.collection(COLLECTION_JOB_QUEUE).doc(envelope.ticket.jobId).set(record);

    console.log(`[JobQueue] Enqueued: ${envelope.ticket.jobId} (${envelope.ticket.jobType})`);
}

// ═══════════════════════════════════════════════════════════════════════════
// CLAIM (Atomic via Transaction)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Claim the next available PENDING job atomically.
 * Returns the claimed JobEnvelope or null if none available.
 */
export async function claimNextJob(workerId: string): Promise<JobEnvelope | null> {
    const db = getAdminFirestore();
    const now = Date.now();

    // Find oldest PENDING job that hasn't expired
    const query = db
        .collection(COLLECTION_JOB_QUEUE)
        .where('status', '==', 'PENDING')
        .orderBy('createdAt', 'asc')
        .limit(1);

    const snapshot = await query.get();
    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    const record = doc.data() as JobQueueRecord;

    // Check if ticket has expired
    if (record.ticket.expiresAt <= now) {
        // Mark as failed due to expiry
        await doc.ref.update({
            status: 'FAILED' as JobStatus,
            updatedAt: now,
        });
        return null;
    }

    // Atomic claim via transaction
    try {
        await db.runTransaction(async (tx) => {
            const freshDoc = await tx.get(doc.ref);
            const freshData = freshDoc.data() as JobQueueRecord;

            // Double-check status (another worker may have claimed it)
            if (freshData.status !== 'PENDING') {
                throw new Error('Job already claimed');
            }

            tx.update(doc.ref, {
                status: 'PROCESSING' as JobStatus,
                workerId,
                claimedAt: now,
                updatedAt: now,
            });
        });

        console.log(`[JobQueue] Claimed: ${record.ticket.jobId} by ${workerId}`);

        return {
            ticket: record.ticket,
            payload: record.payload,
            version: record.version,
        };
    } catch {
        // Another worker claimed it — return null
        return null;
    }
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
    await db.collection(COLLECTION_JOB_QUEUE).doc(jobId).update({
        status,
        updatedAt: now,
    });

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
    result?: JobResult;
} | null> {
    const db = getAdminFirestore();

    const doc = await db.collection(COLLECTION_JOB_QUEUE).doc(jobId).get();
    if (!doc.exists) return null;

    const record = doc.data() as JobQueueRecord;

    // Fetch result if completed
    let result: JobResult | undefined;
    if (record.status === 'COMPLETED' || record.status === 'FAILED') {
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
        result,
    };
}
