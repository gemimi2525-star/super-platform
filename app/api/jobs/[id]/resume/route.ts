/**
 * ═══════════════════════════════════════════════════════════════════════════
 * API — POST /api/jobs/[id]/resume (Phase 15B.2)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Resume a suspended job — returns it to PENDING (claimable).
 * Idempotent: resuming a non-SUSPENDED job returns 200 with no-op.
 *
 * Body: { reason?: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { resumeJob } from '@/coreos/jobs/queue';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id: jobId } = await params;
        const body = await request.json().catch(() => ({}));
        const { reason } = body;

        const actorId = 'system'; // TODO: extract from session

        const result = await resumeJob(jobId, actorId, reason);

        return NextResponse.json({
            jobId,
            status: result.status,
            changed: result.changed,
            ...(reason && { reason }),
        });
    } catch (error: any) {
        const status = error.message?.includes('not found') ? 404 : 500;
        return NextResponse.json(
            { error: error.message },
            { status },
        );
    }
}
