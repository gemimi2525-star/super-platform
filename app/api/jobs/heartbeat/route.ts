/**
 * ═══════════════════════════════════════════════════════════════════════════
 * API — POST /api/jobs/heartbeat (Phase 31)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Extends a job's lease and records heartbeat timestamp.
 * Called periodically by the Go worker during execution.
 *
 * Body: { jobId: string, workerId: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTION_JOB_QUEUE } from '@/coreos/jobs/types';
import { incrementCounter } from '@/coreos/ops/metrics';
import { jobLogger } from '@/coreos/jobs/job-logger';

const LEASE_EXTENSION_MS = 30_000; // 30 seconds

export async function POST(request: NextRequest) {
    try {
        const { jobId, workerId } = await request.json();

        if (!jobId || !workerId) {
            return NextResponse.json(
                { error: 'jobId and workerId are required' },
                { status: 400 },
            );
        }

        const db = getAdminFirestore();
        const now = Date.now();
        const docRef = db.collection(COLLECTION_JOB_QUEUE).doc(jobId);
        const doc = await docRef.get();

        if (!doc.exists) {
            return NextResponse.json({ error: 'Job not found' }, { status: 404 });
        }

        const data = doc.data()!;

        // Only the claiming worker can heartbeat
        if (data.workerId !== workerId) {
            return NextResponse.json(
                { error: 'Worker mismatch' },
                { status: 403 },
            );
        }

        // Only PROCESSING jobs can be heartbeated
        if (data.status !== 'PROCESSING') {
            return NextResponse.json(
                { error: `Cannot heartbeat job in ${data.status} state` },
                { status: 409 },
            );
        }

        await docRef.update({
            'lease.workerId': workerId,
            'lease.leaseUntil': now + LEASE_EXTENSION_MS,
            'heartbeat.workerId': workerId,
            'heartbeat.at': now,
            updatedAt: now,
        });

        incrementCounter('worker_heartbeat_total', { workerId });

        jobLogger.log('job.heartbeat', {
            jobId,
            workerId,
            jobType: data.ticket?.jobType,
            traceId: data.ticket?.traceId,
        });

        return NextResponse.json({
            jobId,
            leaseUntil: now + LEASE_EXTENSION_MS,
        });
    } catch (error: any) {
        console.error('[API/jobs/heartbeat] Error:', error.message);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 },
        );
    }
}
