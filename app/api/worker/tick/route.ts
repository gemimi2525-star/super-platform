/**
 * ═══════════════════════════════════════════════════════════════════════════
 * API — GET /api/worker/tick (Phase 27C.8b+)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Cron-triggered system heartbeat.
 * Invoked by Vercel Cron every 1 minute to keep the Ops Center HEALTHY.
 *
 * Responsibilities:
 *   1. Send a system heartbeat via incrementCounter
 *   2. Return tick status for monitoring
 */

import { NextResponse } from 'next/server';
import { incrementCounter } from '@/coreos/ops/metrics';

const WORKER_ID = 'system-cron';

export async function GET() {
    try {
        const now = Date.now();

        // 1. Send system heartbeat — keeps this worker in getActiveWorkers()
        incrementCounter('worker_heartbeat_total', { workerId: WORKER_ID });

        return NextResponse.json({
            ok: true,
            workerId: WORKER_ID,
            tickedAt: new Date(now).toISOString(),
        });
    } catch (error: any) {
        console.error('[API/worker/tick] Error:', error.message);
        return NextResponse.json(
            { ok: false, error: 'Tick failed' },
            { status: 500 },
        );
    }
}
