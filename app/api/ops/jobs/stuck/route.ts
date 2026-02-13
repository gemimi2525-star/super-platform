/**
 * ═══════════════════════════════════════════════════════════════════════════
 * API — GET /api/ops/jobs/stuck (Phase 22B)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Returns PROCESSING jobs that are stuck (lease expired).
 * Query params:
 *   - thresholdSec (optional, default 90): lease expiry threshold
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTION_JOB_QUEUE } from '@/coreos/jobs/types';
import type { StuckJob } from '@/coreos/ops/types';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const thresholdSec = parseInt(searchParams.get('thresholdSec') ?? '90');

        const db = getAdminFirestore();
        const now = Date.now();

        // Query PROCESSING jobs
        const snapshot = await db
            .collection(COLLECTION_JOB_QUEUE)
            .where('status', '==', 'PROCESSING')
            .get();

        const stuckJobs: StuckJob[] = [];

        snapshot.forEach((doc) => {
            const data = doc.data();
            const leaseUntil = data.lease?.leaseUntil ?? null;
            const lastHeartbeat = data.heartbeat?.at ?? null;

            // Job is stuck if lease has expired
            const isStuck = leaseUntil !== null && leaseUntil < now;
            // Or if no heartbeat for threshold period
            const heartbeatStale = lastHeartbeat !== null
                && (now - lastHeartbeat) > thresholdSec * 1000;
            // Or if no lease at all (legacy processing jobs)
            const noLease = leaseUntil === null;

            if (isStuck || heartbeatStale || noLease) {
                const stuckForMs = leaseUntil ? (now - leaseUntil) : (now - (data.claimedAt ?? now));

                stuckJobs.push({
                    jobId: doc.id,
                    jobType: data.ticket?.jobType ?? 'unknown',
                    workerId: data.workerId,
                    status: data.status,
                    attempts: data.attempts ?? 0,
                    leaseUntil,
                    lastHeartbeat,
                    stuckForSec: Math.round(stuckForMs / 1000),
                    claimedAt: data.claimedAt,
                });
            }
        });

        // Sort by most stuck first
        stuckJobs.sort((a, b) => b.stuckForSec - a.stuckForSec);

        return NextResponse.json({
            count: stuckJobs.length,
            thresholdSec,
            jobs: stuckJobs,
            generatedAt: new Date().toISOString(),
        });
    } catch (error: any) {
        console.error('[API/ops/jobs/stuck] Error:', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
