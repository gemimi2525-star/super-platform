/**
 * ═══════════════════════════════════════════════════════════════════════════
 * API — GET /api/ops/metrics/summary (Phase 22B)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Returns all counters + computed rates.
 */

import { NextResponse } from 'next/server';
import { getAllCounters, getActiveWorkers } from '@/coreos/ops/metrics';

export async function GET() {
    try {
        const counters = await getAllCounters();
        const activeWorkers = await getActiveWorkers();

        // Compute rates — aggregate by key prefix (keys have suffixes like :jobType=scheduler.tick)
        let total = 0;
        let completed = 0;
        let dead = 0;
        let retryable = 0;

        for (const [key, val] of Object.entries(counters)) {
            if (key.startsWith('jobs_total')) total += val;
            if (key.startsWith('jobs_completed')) completed += val;
            if (key.startsWith('jobs_dead')) dead += val;
            if (key.startsWith('jobs_failed_retryable')) retryable += val;
        }

        const rates = {
            successRate: total > 0 ? Math.round((completed / total) * 10000) / 100 : 0,
            deadRate: total > 0 ? Math.round((dead / total) * 10000) / 100 : 0,
            retryRate: total > 0 ? Math.round((retryable / total) * 10000) / 100 : 0,
        };

        return NextResponse.json({
            counters,
            aggregated: { total, completed, dead, retryable },
            rates,
            activeWorkers,
            generatedAt: new Date().toISOString(),
        });
    } catch (error: any) {
        console.error('[API/ops/metrics/summary] Error:', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
