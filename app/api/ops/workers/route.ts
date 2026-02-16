/**
 * ═══════════════════════════════════════════════════════════════════════════
 * API — GET /api/ops/workers (Phase 31.8)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Returns all active workers with heartbeat status, current job,
 * and lease information for Ops Center dashboard.
 *
 * Phase 31.8: Includes devModeActive flag for UI banner.
 */

import { NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTION_JOB_QUEUE } from '@/coreos/jobs/types';

export async function GET() {
    try {
        const db = getAdminFirestore();
        const now = Date.now();

        // Query all PROCESSING jobs (these have active workers)
        const snapshot = await db
            .collection(COLLECTION_JOB_QUEUE)
            .where('status', '==', 'PROCESSING')
            .orderBy('claimedAt', 'desc')
            .limit(100)
            .get();

        // Group by workerId
        const workerMap = new Map<string, {
            workerId: string;
            activeJobs: number;
            jobs: Array<{
                jobId: string;
                jobType: string;
                claimedAt: number | null;
                leaseUntil: number | null;
                leaseExpired: boolean;
                lastHeartbeat: number | null;
                heartbeatAgeMs: number | null;
                attempt: number;
                maxAttempts: number;
            }>;
            lastSeen: number;
            healthy: boolean;
        }>();

        for (const doc of snapshot.docs) {
            const data = doc.data();
            const workerId = data.workerId ?? 'unknown';
            const leaseUntil = data.lease?.leaseUntil ?? null;
            const lastHeartbeat = data.heartbeat?.at ?? null;

            if (!workerMap.has(workerId)) {
                workerMap.set(workerId, {
                    workerId,
                    activeJobs: 0,
                    jobs: [],
                    lastSeen: 0,
                    healthy: true,
                });
            }

            const worker = workerMap.get(workerId)!;
            const leaseExpired = leaseUntil !== null && leaseUntil < now;
            const heartbeatAgeMs = lastHeartbeat !== null ? now - lastHeartbeat : null;

            worker.activeJobs++;
            worker.jobs.push({
                jobId: doc.id,
                jobType: data.ticket?.jobType ?? 'unknown',
                claimedAt: data.claimedAt ?? null,
                leaseUntil,
                leaseExpired,
                lastHeartbeat,
                heartbeatAgeMs,
                attempt: data.attempts ?? 0,
                maxAttempts: data.maxAttempts ?? 3,
            });

            // Track last seen time
            const lastActivity = Math.max(
                data.claimedAt ?? 0,
                lastHeartbeat ?? 0,
            );
            if (lastActivity > worker.lastSeen) {
                worker.lastSeen = lastActivity;
            }

            // Mark unhealthy if any lease expired
            if (leaseExpired) {
                worker.healthy = false;
            }
        }

        const workers = Array.from(workerMap.values()).sort(
            (a, b) => b.lastSeen - a.lastSeen,
        );

        const devModeActive = process.env.JOB_WORKER_DEV_MODE === 'true';

        return NextResponse.json({
            workers,
            totalWorkers: workers.length,
            totalActiveJobs: snapshot.size,
            healthyWorkers: workers.filter((w) => w.healthy).length,
            unhealthyWorkers: workers.filter((w) => !w.healthy).length,
            devModeActive,
            devModeWarning: devModeActive
                ? 'DEV MODE ACTIVE (HMAC BYPASS) — LOCAL ONLY'
                : null,
            timestamp: now,
        });
    } catch (error: any) {
        console.error('[API/ops/workers] Error:', error.message);
        return NextResponse.json(
            { error: 'Failed to query workers' },
            { status: 500 },
        );
    }
}
