/**
 * ═══════════════════════════════════════════════════════════════════════════
 * API — POST /api/jobs/result (Phase 22A)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Accepts a signed JobResult from Go worker.
 * Verifies HMAC signature, then decides: COMPLETED / retry / dead-letter.
 *
 * Body: JobResult (signed with HMAC-SHA256)
 */

import { NextRequest, NextResponse } from 'next/server';
import type { JobResult, JobQueueRecord } from '@/coreos/jobs/types';
import { COLLECTION_JOB_QUEUE } from '@/coreos/jobs/types';
import { validateResult, validateJobExists } from '@/coreos/jobs/validator';
import { updateJobStatus, retryJob, deadLetterJob } from '@/coreos/jobs/queue';
import { getAdminFirestore } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
    try {
        const result: JobResult = await request.json();
        const db = getAdminFirestore();

        // ─── Get HMAC secret ───
        const hmacSecret = process.env.JOB_WORKER_HMAC_SECRET;
        if (!hmacSecret) {
            console.error('[API/jobs/result] JOB_WORKER_HMAC_SECRET not configured');
            return NextResponse.json(
                { error: 'Server configuration error' },
                { status: 500 },
            );
        }

        // ─── Validate result fields + HMAC ───
        const resultValidation = validateResult(result, hmacSecret);
        if (!resultValidation.valid) {
            console.warn(`[API/jobs/result] Rejected: ${resultValidation.error} (${resultValidation.code})`);
            return NextResponse.json(
                { error: resultValidation.error, code: resultValidation.code },
                { status: 403 },
            );
        }

        // ─── Validate job exists and is PROCESSING ───
        const jobValidation = await validateJobExists(result.jobId, db);
        if (!jobValidation.valid) {
            console.warn(`[API/jobs/result] Job check failed: ${jobValidation.error}`);
            return NextResponse.json(
                { error: jobValidation.error, code: jobValidation.code },
                { status: 404 },
            );
        }

        // ─── Read job record for retry decision ───
        const jobDoc = await db.collection(COLLECTION_JOB_QUEUE).doc(result.jobId).get();
        const jobRecord = jobDoc.data() as JobQueueRecord;
        const attempts = jobRecord.attempts ?? 1;
        const maxAttempts = jobRecord.maxAttempts ?? 3;

        let newStatus: string;

        if (result.status === 'SUCCEEDED') {
            // ── SUCCESS ──
            newStatus = 'COMPLETED';
            await updateJobStatus(result.jobId, 'COMPLETED', result);
        } else {
            // ── FAILED — decide retry vs dead-letter ──
            const lastError = {
                code: result.errorCode ?? 'UNKNOWN',
                message: result.errorMessage ?? 'Unknown error',
                at: Date.now(),
            };

            if (attempts < maxAttempts) {
                // Retry: set FAILED_RETRYABLE + backoff
                newStatus = 'FAILED_RETRYABLE';
                await retryJob(result.jobId, lastError, attempts);

                // Also store the result for audit
                await db.collection('job_results').doc(`${result.jobId}_attempt_${attempts}`).set({
                    ...result,
                    receivedAt: Date.now(),
                });
            } else {
                // Dead-letter: max attempts exhausted
                newStatus = 'DEAD';
                await deadLetterJob(result.jobId, lastError);
                await updateJobStatus(result.jobId, 'DEAD', result);
            }
        }

        // ─── Audit append (append-only) ───
        const auditEntry = {
            type: newStatus === 'COMPLETED' ? 'job.complete'
                : newStatus === 'DEAD' ? 'job.dead'
                    : newStatus === 'FAILED_RETRYABLE' ? 'job.retry'
                        : 'job.failed',
            jobId: result.jobId,
            traceId: result.traceId,
            workerId: result.workerId,
            status: newStatus,
            attempts,
            maxAttempts,
            resultHash: result.resultHash,
            metrics: result.metrics,
            errorCode: result.errorCode,
            timestamp: Date.now(),
        };

        await db.collection('platform_audit_logs').add(auditEntry);

        console.log(
            `[API/jobs/result] ${result.jobId} → ${newStatus} ` +
            `(worker=${result.workerId}, attempt=${attempts}/${maxAttempts}, latency=${result.metrics.latencyMs}ms)`,
        );

        return NextResponse.json({
            jobId: result.jobId,
            status: newStatus,
            traceId: result.traceId,
            attempts,
            maxAttempts,
        });

    } catch (error: any) {
        console.error('[API/jobs/result] Error:', error.message);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 },
        );
    }
}
