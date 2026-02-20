/**
 * ═══════════════════════════════════════════════════════════════════════════
 * API — GET /api/ops/jobs/list (Phase 15B.2E)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Returns recent jobs from the job_queue collection for Ops Center display.
 * Supports optional status filter via query param.
 *
 * Query params:
 *   ?status=PENDING,SUSPENDED  (optional, comma-separated)
 *   ?limit=20                  (optional, default 50)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTION_JOB_QUEUE, DEFAULT_PRIORITY } from '@/coreos/jobs/types';
import type { JobQueueRecord } from '@/coreos/jobs/types';

export async function GET(request: NextRequest) {
    try {
        const db = getAdminFirestore();
        const url = new URL(request.url);
        const statusFilter = url.searchParams.get('status');
        const limit = Math.min(Number(url.searchParams.get('limit') || '50'), 100);

        let query = db.collection(COLLECTION_JOB_QUEUE)
            .orderBy('updatedAt', 'desc')
            .limit(limit);

        if (statusFilter) {
            const statuses = statusFilter.split(',').map(s => s.trim());
            if (statuses.length === 1) {
                query = query.where('status', '==', statuses[0]);
            } else if (statuses.length <= 10) {
                query = query.where('status', 'in', statuses);
            }
        }

        const snapshot = await query.get();
        const jobs = snapshot.docs.map(doc => {
            const data = doc.data() as JobQueueRecord;
            return {
                jobId: doc.id,
                jobType: data.ticket?.jobType ?? 'unknown',
                status: data.status,
                priority: data.priority ?? DEFAULT_PRIORITY,
                workerId: data.workerId ?? null,
                attempts: data.attempts ?? 0,
                maxAttempts: data.maxAttempts ?? 3,
                createdAt: data.createdAt,
                updatedAt: data.updatedAt,
                suspendedAt: data.suspendedAt ?? null,
                suspendedBy: data.suspendedBy ?? null,
            };
        });

        return NextResponse.json({ count: jobs.length, jobs });
    } catch (error: any) {
        console.error('[API/ops/jobs/list] Error:', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
