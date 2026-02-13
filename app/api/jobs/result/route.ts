/**
 * ═══════════════════════════════════════════════════════════════════════════
 * API — POST /api/jobs/result (Phase 21C)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Accepts a signed JobResult from Go worker.
 * Verifies HMAC signature, payloadHash, policyDecisionId.
 * Updates job status and appends audit entry.
 *
 * Body: JobResult (signed with HMAC-SHA256)
 */

import { NextRequest, NextResponse } from 'next/server';
import type { JobResult } from '@/coreos/jobs/types';
import { validateResult, validateJobExists } from '@/coreos/jobs/validator';
import { updateJobStatus } from '@/coreos/jobs/queue';
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

        // ─── Update job status ───
        const newStatus = result.status === 'SUCCEEDED' ? 'COMPLETED' : 'FAILED';
        await updateJobStatus(result.jobId, newStatus, result);

        // ─── Audit append (append-only) ───
        const auditEntry = {
            type: result.status === 'SUCCEEDED' ? 'job.complete' : 'job.failed',
            jobId: result.jobId,
            traceId: result.traceId,
            workerId: result.workerId,
            status: result.status,
            resultHash: result.resultHash,
            metrics: result.metrics,
            timestamp: Date.now(),
        };

        await db.collection('platform_audit_logs').add(auditEntry);

        console.log(
            `[API/jobs/result] ${result.jobId} → ${newStatus} ` +
            `(worker=${result.workerId}, latency=${result.metrics.latencyMs}ms)`,
        );

        return NextResponse.json({
            jobId: result.jobId,
            status: newStatus,
            traceId: result.traceId,
        });

    } catch (error: any) {
        console.error('[API/jobs/result] Error:', error.message);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 },
        );
    }
}
