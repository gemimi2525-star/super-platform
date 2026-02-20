/**
 * ═══════════════════════════════════════════════════════════════════════════
 * API — POST /api/jobs/[id]/suspend (Phase 15B.2 + 15C + 15D)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Suspend a job — removes it from the claiming pool.
 * Only PENDING or FAILED_RETRYABLE jobs can be suspended.
 * Idempotent: suspending a SUSPENDED job returns 200 with no-op.
 *
 * 15D: Rejects stale updates (409 CONFLICT) if body.lastUpdatedAt < server updatedAt.
 *
 * Body: { reason?: string, lastUpdatedAt?: number }
 * Headers: X-Device-Id, X-Idempotency-Key, X-Offline-Queued
 */

import { NextRequest, NextResponse } from 'next/server';
import { suspendJob } from '@/coreos/jobs/queue';
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
            console.log(`[Jobs/suspend] idempotencyKey=${idempotencyKey} offline=${offlineQueued ?? 'false'} device=${deviceId ?? 'unknown'}`);
        }

        // 15C.2E: Fail-once debug hook (dev only)
        const debugFailOnce = request.headers.get('X-Debug-Fail-Once');
        if (debugFailOnce === '1' && process.env.NODE_ENV !== 'production' && idempotencyKey) {
            const failKey = `debug:fail:${idempotencyKey}`;
            const already = (globalThis as Record<string, unknown>)[failKey];
            if (!already) {
                (globalThis as Record<string, unknown>)[failKey] = true;
                console.log(`[Jobs/suspend] DEBUG fail-once triggered for key=${idempotencyKey}`);
                return NextResponse.json({ error: 'Debug fail-once' }, { status: 503 });
            }
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

        const result = await suspendJob(jobId, actorId, reason, deviceId);

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
