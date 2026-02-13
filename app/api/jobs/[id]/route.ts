/**
 * ═══════════════════════════════════════════════════════════════════════════
 * API — GET /api/jobs/[id] (Phase 21C)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Returns job status and details by jobId.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getJobStatus } from '@/coreos/jobs/queue';

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json(
                { error: 'Job ID is required' },
                { status: 400 },
            );
        }

        const job = await getJobStatus(id);

        if (!job) {
            return NextResponse.json(
                { error: `Job not found: ${id}` },
                { status: 404 },
            );
        }

        return NextResponse.json({
            jobId: id,
            status: job.status,
            jobType: job.ticket.jobType,
            traceId: job.ticket.traceId,
            workerId: job.workerId,
            claimedAt: job.claimedAt,
            createdAt: job.createdAt,
            attempts: job.attempts,
            maxAttempts: job.maxAttempts,
            lastError: job.lastError,
            result: job.result ? {
                status: job.result.status,
                metrics: job.result.metrics,
                errorCode: job.result.errorCode,
                errorMessage: job.result.errorMessage,
            } : undefined,
        });

    } catch (error: any) {
        console.error('[API/jobs/[id]] Error:', error.message);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 },
        );
    }
}
