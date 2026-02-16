/**
 * ═══════════════════════════════════════════════════════════════════════════
 * API — POST /api/jobs/result (Phase 31)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Accepts a signed JobResult from Go worker.
 * Verifies HMAC signature, then decides: COMPLETED / retry / dead-letter.
 *
 * Phase 31 additions:
 * - JOB_WORKER_DEV_MODE bypass with audit trail
 * - Idempotency guard (duplicate result → 200 with existing)
 * - Diagnostic logging on signature failure
 * - Structured lifecycle logging
 *
 * Body: JobResult (signed with HMAC-SHA256)
 */

import { NextRequest, NextResponse } from 'next/server';
import type { JobResult, JobQueueRecord } from '@/coreos/jobs/types';
import { COLLECTION_JOB_QUEUE, COLLECTION_JOB_RESULTS } from '@/coreos/jobs/types';
import { validateResult, validateJobExists } from '@/coreos/jobs/validator';
import { computeResultHMAC } from '@/coreos/jobs/signer';
import { updateJobStatus, retryJob, deadLetterJob } from '@/coreos/jobs/queue';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { incrementCounter, recordTimeseries } from '@/coreos/ops/metrics';
import { jobLogger } from '@/coreos/jobs/job-logger';

export async function POST(request: NextRequest) {
    try {
        const result: JobResult = await request.json();
        const db = getAdminFirestore();
        const devMode = process.env.JOB_WORKER_DEV_MODE === 'true';

        // ─── PRODUCTION GUARD (Phase 31.8) ───
        // Fatal misconfig: dev-mode MUST NOT be active in production
        if (process.env.NODE_ENV === 'production' && devMode) {
            jobLogger.error('job.failed', {
                jobId: result.jobId ?? 'unknown',
                error: {
                    code: 'FATAL_MISCONFIG',
                    message: 'JOB_WORKER_DEV_MODE=true is forbidden in production. This is a critical security violation.',
                },
                severity: 'CRITICAL',
            } as any);
            console.error(
                '[API/jobs/result] 🚨 CRITICAL: JOB_WORKER_DEV_MODE=true detected in production! ' +
                'HMAC bypass is FORBIDDEN in production. Failing fast.',
            );
            return NextResponse.json(
                {
                    error: 'Fatal server misconfiguration: dev-mode is active in production',
                    code: 'FATAL_MISCONFIG',
                },
                { status: 500 },
            );
        }

        // ─── Idempotency Guard (Phase 31.2) ───
        // If a COMPLETED result already exists for this jobId, return it
        const existingResult = await db.collection(COLLECTION_JOB_RESULTS).doc(result.jobId).get();
        if (existingResult.exists) {
            const existing = existingResult.data();
            if (existing?.status === 'COMPLETED' || existing?.status === 'SUCCEEDED') {
                jobLogger.log('job.result_idempotent', {
                    jobId: result.jobId,
                    traceId: result.traceId,
                    workerId: result.workerId,
                    note: 'Duplicate result submission — returning existing',
                });
                return NextResponse.json({
                    jobId: result.jobId,
                    status: 'COMPLETED',
                    traceId: result.traceId,
                    idempotent: true,
                });
            }
        }

        // ─── Get HMAC secret ───
        const hmacSecret = process.env.JOB_WORKER_HMAC_SECRET;
        if (!hmacSecret && !devMode) {
            console.error('[API/jobs/result] JOB_WORKER_HMAC_SECRET not configured');
            return NextResponse.json(
                { error: 'Server configuration error' },
                { status: 500 },
            );
        }

        // ─── Validate result fields + HMAC ───
        let signatureBypass = false;
        if (hmacSecret) {
            const resultValidation = validateResult(result, hmacSecret);
            if (!resultValidation.valid) {
                if (devMode) {
                    // Dev-mode: bypass but log warning + audit
                    signatureBypass = true;
                    const { signature: _sig, ...resultWithoutSig } = result;
                    const expectedHMAC = computeResultHMAC(resultWithoutSig, hmacSecret);
                    // Dedicated audit event (Phase 31.8)
                    jobLogger.warn('worker_signature_bypassed_dev_mode', {
                        jobId: result.jobId,
                        traceId: result.traceId,
                        workerId: result.workerId,
                        receivedSigPrefix: result.signature?.substring(0, 16) ?? 'MISSING',
                        expectedSigPrefix: expectedHMAC.substring(0, 16),
                    });
                    console.warn(
                        `[API/jobs/result] ⚠️ DEV-MODE: Signature bypass for ${result.jobId} ` +
                        `(expected=${expectedHMAC.substring(0, 16)}… received=${result.signature?.substring(0, 16) ?? 'MISSING'}…)`
                    );
                } else {
                    // Production: reject with diagnostics
                    const { signature: _sig, ...resultWithoutSig } = result;
                    const expectedHMAC = computeResultHMAC(resultWithoutSig, hmacSecret);
                    console.warn(
                        `[API/jobs/result] Rejected: ${resultValidation.error} (${resultValidation.code}) ` +
                        `jobId=${result.jobId} expected=${expectedHMAC.substring(0, 16)}… received=${result.signature?.substring(0, 16) ?? 'MISSING'}…`
                    );
                    return NextResponse.json(
                        { error: resultValidation.error, code: resultValidation.code },
                        { status: 403 },
                    );
                }
            }
        } else if (devMode) {
            // No HMAC secret + dev mode = bypass entirely
            signatureBypass = true;
            // Dedicated audit event (Phase 31.8)
            jobLogger.warn('worker_signature_bypassed_dev_mode', {
                jobId: result.jobId,
                traceId: result.traceId,
                workerId: result.workerId,
                receivedSigPrefix: 'N/A',
                expectedSigPrefix: 'N/A (no HMAC secret configured)',
            });
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

        const jobType = jobRecord.ticket?.jobType ?? 'unknown';

        if (result.status === 'SUCCEEDED') {
            // ── SUCCESS ──
            newStatus = 'COMPLETED';
            await updateJobStatus(result.jobId, 'COMPLETED', result);
            incrementCounter('jobs_completed', { jobType });
            recordTimeseries('job_latency', result.metrics.latencyMs, { jobType });
            jobLogger.log('job.completed', {
                jobId: result.jobId,
                traceId: result.traceId,
                workerId: result.workerId,
                jobType,
                attempt: attempts,
                maxAttempts,
                durationMs: result.metrics.latencyMs,
                signatureBypass,
            });
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
                incrementCounter('jobs_failed_retryable', { jobType });
                jobLogger.log('job.retried', {
                    jobId: result.jobId,
                    traceId: result.traceId,
                    workerId: result.workerId,
                    jobType,
                    attempt: attempts,
                    maxAttempts,
                    error: lastError,
                });

                // Also store the result for audit (strip undefined values for Firestore)
                await db.collection(COLLECTION_JOB_RESULTS).doc(`${result.jobId}_attempt_${attempts}`).set(
                    JSON.parse(JSON.stringify({ ...result, receivedAt: Date.now() })),
                );
            } else {
                // Dead-letter: max attempts exhausted
                newStatus = 'DEAD';
                await deadLetterJob(result.jobId, lastError);
                await updateJobStatus(result.jobId, 'DEAD', result);
                incrementCounter('jobs_dead', { jobType });
                jobLogger.log('job.dead', {
                    jobId: result.jobId,
                    traceId: result.traceId,
                    workerId: result.workerId,
                    jobType,
                    attempt: attempts,
                    maxAttempts,
                    error: lastError,
                });
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
            errorCode: result.errorCode ?? null,
            signatureBypass,
            timestamp: Date.now(),
        };

        await db.collection('platform_audit_logs').add(auditEntry);

        console.log(
            `[API/jobs/result] ${result.jobId} → ${newStatus} ` +
            `(worker=${result.workerId}, attempt=${attempts}/${maxAttempts}, latency=${result.metrics.latencyMs}ms` +
            `${signatureBypass ? ', SIG_BYPASS' : ''})`,
        );

        return NextResponse.json({
            jobId: result.jobId,
            status: newStatus,
            traceId: result.traceId,
            attempts,
            maxAttempts,
            signatureBypass,
        });

    } catch (error: any) {
        console.error('[API/jobs/result] Error:', error.message);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 },
        );
    }
}
