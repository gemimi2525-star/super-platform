/**
 * ═══════════════════════════════════════════════════════════════════════════
 * API — POST /api/jobs/[id]/priority (Phase 15B.2)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Update job priority. Value must be integer 0-100.
 * Allowed on non-terminal statuses (PENDING, PROCESSING, FAILED_RETRYABLE, SUSPENDED).
 * Idempotent: setting the same priority returns 200 with no-op.
 *
 * Body: { value: number }
 */

import { NextRequest, NextResponse } from 'next/server';
import { updateJobPriority } from '@/coreos/jobs/queue';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id: jobId } = await params;
        const body = await request.json();
        const { value } = body;

        if (value === undefined || value === null) {
            return NextResponse.json(
                { error: 'value is required (integer 0-100)' },
                { status: 400 },
            );
        }

        // 15C: Log offline replay traceability
        const idempotencyKey = request.headers.get('X-Idempotency-Key');
        const offlineQueued = request.headers.get('X-Offline-Queued');
        if (idempotencyKey) {
            console.log(`[Jobs/priority] idempotencyKey=${idempotencyKey} offline=${offlineQueued ?? 'false'} value=${value}`);
        }

        const actorId = 'system'; // TODO: extract from session

        const result = await updateJobPriority(jobId, Number(value), actorId);

        return NextResponse.json({
            jobId,
            changed: result.changed,
            previousPriority: result.previousPriority,
            newPriority: result.newPriority,
        });
    } catch (error: any) {
        const status = error.message?.includes('not found') ? 404
            : error.message?.includes('Priority must be') ? 400
                : error.message?.includes('terminal status') ? 409
                    : 500;
        return NextResponse.json(
            { error: error.message },
            { status },
        );
    }
}
