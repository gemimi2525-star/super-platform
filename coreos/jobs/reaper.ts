/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CORE OS — Stuck Job Reaper (Phase 31.6)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Detects and recovers jobs stuck in PROCESSING state whose lease has expired.
 * For each stuck job: retry if attempts remain, dead-letter otherwise.
 *
 * @module coreos/jobs/reaper
 * @version 1.0.0 (Phase 31)
 */

import { getAdminFirestore } from '@/lib/firebase-admin';
import type { JobQueueRecord } from './types';
import { COLLECTION_JOB_QUEUE, DEFAULT_MAX_ATTEMPTS } from './types';
import { retryJob, deadLetterJob } from './queue';
import { jobLogger } from './job-logger';
import { AUDIT_EVENTS } from '../audit/taxonomy';

// ═══════════════════════════════════════════════════════════════════════════
// REAPER RESULT
// ═══════════════════════════════════════════════════════════════════════════

export interface ReaperResult {
    /** Number of stuck jobs found */
    found: number;
    /** Number of jobs retried */
    retried: number;
    /** Number of jobs dead-lettered */
    deadLettered: number;
    /** Individual job dispositions */
    jobs: Array<{
        jobId: string;
        disposition: 'retried' | 'dead_lettered';
        attempt: number;
        maxAttempts: number;
        stuckDurationMs: number;
        workerId: string | null;
    }>;
}

// ═══════════════════════════════════════════════════════════════════════════
// REAPER LOGIC
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Find and recover jobs stuck in PROCESSING with expired leases.
 *
 * A job is "stuck" when:
 * - status = PROCESSING
 * - lease.leaseUntil < now (lease expired)
 *
 * Recovery strategy:
 * - If attempts < maxAttempts → retryJob() (FAILED_RETRYABLE)
 * - If attempts >= maxAttempts → deadLetterJob() (DEAD)
 */
export async function reapStuckJobs(): Promise<ReaperResult> {
    const db = getAdminFirestore();
    const now = Date.now();
    const reaperTraceId = `reaper-${crypto.randomUUID()}`;

    const result: ReaperResult = {
        found: 0,
        retried: 0,
        deadLettered: 0,
        jobs: [],
    };

    // Query all PROCESSING jobs with expired leases
    const query = db
        .collection(COLLECTION_JOB_QUEUE)
        .where('status', '==', 'PROCESSING')
        .where('lease.leaseUntil', '<', now)
        .limit(50); // Process in batches

    const snapshot = await query.get();
    if (snapshot.empty) {
        jobLogger.log(AUDIT_EVENTS.JOB_REAPER_RUN, {
            note: 'No stuck jobs found',
        });
        return result;
    }

    result.found = snapshot.size;

    for (const doc of snapshot.docs) {
        const record = doc.data() as JobQueueRecord;
        const jobId = doc.id;
        const attempts = record.attempts ?? 1;
        const maxAttempts = record.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
        const leaseUntil = record.lease?.leaseUntil ?? 0;
        const stuckDurationMs = now - leaseUntil;

        const lastError = {
            code: 'JOB_STUCK',
            message: `Job stuck in PROCESSING — lease expired ${stuckDurationMs}ms ago (worker: ${record.workerId ?? 'unknown'})`,
            at: now,
        };

        // Log stuck detection
        const jobTraceId = record.ticket?.traceId ?? reaperTraceId;
        jobLogger.warn(AUDIT_EVENTS.JOB_STUCK, {
            jobId,
            traceId: jobTraceId,
            workerId: record.workerId ?? undefined,
            jobType: record.ticket?.jobType,
            attempt: attempts,
            maxAttempts,
            durationMs: stuckDurationMs,
        });

        // Write audit entry
        await db.collection('platform_audit_logs').add({
            type: 'job.stuck',
            jobId,
            traceId: record.ticket?.traceId ?? null,
            workerId: record.workerId ?? null,
            jobType: record.ticket?.jobType ?? null,
            stuckDurationMs,
            attempts,
            maxAttempts,
            timestamp: now,
        });

        if (attempts < maxAttempts) {
            // Retry
            await retryJob(jobId, lastError, attempts, jobTraceId);
            result.retried++;
            result.jobs.push({
                jobId,
                disposition: 'retried',
                attempt: attempts,
                maxAttempts,
                stuckDurationMs,
                workerId: record.workerId,
            });

            jobLogger.log(AUDIT_EVENTS.JOB_REAPED, {
                jobId,
                traceId: jobTraceId,
                note: `Retried (attempt ${attempts}/${maxAttempts})`,
            });
        } else {
            // Dead-letter
            await deadLetterJob(jobId, lastError);
            result.deadLettered++;
            result.jobs.push({
                jobId,
                disposition: 'dead_lettered',
                attempt: attempts,
                maxAttempts,
                stuckDurationMs,
                workerId: record.workerId,
            });

            jobLogger.log(AUDIT_EVENTS.JOB_REAPED, {
                jobId,
                traceId: jobTraceId,
                note: `Dead-lettered (attempt ${attempts}/${maxAttempts} exhausted)`,
            });
        }
    }

    jobLogger.log(AUDIT_EVENTS.JOB_REAPER_RUN, {
        traceId: reaperTraceId,
        note: `Reaped ${result.found} stuck jobs: ${result.retried} retried, ${result.deadLettered} dead-lettered`,
    });

    return result;
}
