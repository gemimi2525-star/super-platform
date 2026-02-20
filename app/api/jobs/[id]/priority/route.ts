/**
 * ═══════════════════════════════════════════════════════════════════════════
 * API — POST /api/jobs/[id]/priority (Phase 15B.2 + 15C + 15D)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Update job priority. Value must be integer 0-100.
 * Allowed on non-terminal statuses (PENDING, PROCESSING, FAILED_RETRYABLE, SUSPENDED).
 * Idempotent: setting the same priority returns 200 with no-op.
 *
 * 15D: Rejects stale updates (409 CONFLICT) if body.lastUpdatedAt < server updatedAt.
 *
 * Body: { value: number, lastUpdatedAt?: number }
 * Headers: X-Device-Id, X-Idempotency-Key, X-Offline-Queued
 */

import { NextRequest, NextResponse } from 'next/server';
import { updateJobPriority } from '@/coreos/jobs/queue';
import { getAdminFirestore } from '@/lib/firebase-admin';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id: jobId } = await params;
        const body = await request.json();
        const { value, lastUpdatedAt } = body;

        if (value === undefined || value === null) {
            return NextResponse.json(
                { error: 'value is required (integer 0-100)' },
                { status: 400 },
            );
        }

        // 15C: Log offline replay traceability
        const idempotencyKey = request.headers.get('X-Idempotency-Key');
        const offlineQueued = request.headers.get('X-Offline-Queued');
        const deviceId = request.headers.get('X-Device-Id') ?? undefined;
        if (idempotencyKey) {
            console.log(`[Jobs/priority] idempotencyKey=${idempotencyKey} offline=${offlineQueued ?? 'false'} device=${deviceId ?? 'unknown'} value=${value}`);
        }

        // 15D.D: Server merge guard — reject stale updates
        if (lastUpdatedAt !== undefined) {
            const db = getAdminFirestore();
            const doc = await db.collection('job_queue').doc(jobId).get();
            if (doc.exists) {
                const serverUpdatedAt = doc.data()?.updatedAt ?? 0;
                if (lastUpdatedAt < serverUpdatedAt) {
                    return NextResponse.json({
                        conflict: true,
                        error: 'Stale update rejected — server state is newer',
                        serverState: {
                            status: doc.data()?.status,
                            priority: doc.data()?.priority,
                            updatedAt: serverUpdatedAt,
                            lastUpdatedByDevice: doc.data()?.lastUpdatedByDevice,
                        },
                    }, { status: 409 });
                }
            }
        }

        const actorId = 'system'; // TODO: extract from session

        const result = await updateJobPriority(jobId, Number(value), actorId, deviceId);

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
