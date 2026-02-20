/**
 * ═══════════════════════════════════════════════════════════════════════════
 * API — POST /api/jobs/[id]/resume (Phase 15B.2 + 15C + 15D)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Resume a suspended job — returns it to PENDING (claimable).
 * Idempotent: resuming a non-SUSPENDED job returns 200 with no-op.
 *
 * 15D: Rejects stale updates (409 CONFLICT) if body.lastUpdatedAt < server updatedAt.
 *
 * Body: { reason?: string, lastUpdatedAt?: number }
 * Headers: X-Device-Id, X-Idempotency-Key, X-Offline-Queued
 */

import { NextRequest, NextResponse } from 'next/server';
import { resumeJob } from '@/coreos/jobs/queue';
import { getAdminFirestore } from '@/lib/firebase-admin';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id: jobId } = await params;
        const body = await request.json().catch(() => ({}));
        const { reason, lastUpdatedAt } = body;

        // 15C: Log offline replay traceability
        const idempotencyKey = request.headers.get('X-Idempotency-Key');
        const offlineQueued = request.headers.get('X-Offline-Queued');
        const deviceId = request.headers.get('X-Device-Id') ?? undefined;
        if (idempotencyKey) {
            console.log(`[Jobs/resume] idempotencyKey=${idempotencyKey} offline=${offlineQueued ?? 'false'} device=${deviceId ?? 'unknown'}`);
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

        const result = await resumeJob(jobId, actorId, reason, deviceId);

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
