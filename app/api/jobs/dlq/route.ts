/**
 * ═══════════════════════════════════════════════════════════════════════════
 * API — GET /api/jobs/dlq (Phase 31.4)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Lists dead-lettered jobs for Ops Center visibility.
 * Returns most recent dead jobs with full context.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTION_JOB_QUEUE } from '@/coreos/jobs/types';

export async function GET(request: NextRequest) {
    try {
        const db = getAdminFirestore();
        const url = new URL(request.url);
        const limit = Math.min(Number(url.searchParams.get('limit') ?? '20'), 100);

        const snapshot = await db
            .collection(COLLECTION_JOB_QUEUE)
            .where('status', '==', 'DEAD')
            .orderBy('updatedAt', 'desc')
            .limit(limit)
            .get();

        const jobs = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                jobId: doc.id,
                jobType: data.ticket?.jobType ?? 'unknown',
                actorId: data.ticket?.actorId ?? 'unknown',
                traceId: data.ticket?.traceId ?? null,
                attempts: data.attempts ?? 0,
                maxAttempts: data.maxAttempts ?? 3,
                lastError: data.lastError ?? null,
                workerId: data.workerId ?? null,
                createdAt: data.createdAt ?? null,
                updatedAt: data.updatedAt ?? null,
            };
        });

        return NextResponse.json({
            dlq: jobs,
            count: jobs.length,
            timestamp: Date.now(),
        });
    } catch (error: any) {
        console.error('[API/jobs/dlq] Error:', error.message);
        return NextResponse.json(
            { error: 'Failed to query DLQ' },
            { status: 500 },
        );
    }
}
