/**
 * ═══════════════════════════════════════════════════════════════════════════
 * API — POST /api/jobs/[id]/suspend (Phase 15B.2)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Suspend a job — removes it from the claiming pool.
 * Only PENDING or FAILED_RETRYABLE jobs can be suspended.
 * Idempotent: suspending a SUSPENDED job returns 200 with no-op.
 *
 * Body: { reason?: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { suspendJob } from '@/coreos/jobs/queue';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id: jobId } = await params;
        const body = await request.json().catch(() => ({}));
        const { reason } = body;

        const actorId = 'system'; // TODO: extract from session

        const result = await suspendJob(jobId, actorId, reason);

        return NextResponse.json({
            jobId,
            status: result.status,
            changed: result.changed,
            ...(reason && { reason }),
        });
    } catch (error: any) {
        const status = error.message?.includes('not found') ? 404
            : error.message?.includes('Cannot suspend') ? 409
                : 500;
        return NextResponse.json(
            { error: error.message },
            { status },
        );
    }
}
