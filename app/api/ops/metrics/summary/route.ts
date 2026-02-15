/**
 * ═══════════════════════════════════════════════════════════════════════════
 * API — GET /api/ops/metrics/summary (Phase 22B → 24)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Returns all counters + computed rates + system health status.
 */

import { NextResponse } from 'next/server';
import { getAllCounters, getActiveWorkers, getFreshHeartbeatCount } from '@/coreos/ops/metrics';
import { evaluateThresholds, processAlerts, getUnresolvedAlertCount } from '@/coreos/ops/threshold-engine';

export async function GET() {
    try {
        const [counters, activeWorkers, freshHeartbeatCount] = await Promise.all([
            getAllCounters(),
            getActiveWorkers(),
            getFreshHeartbeatCount(),
        ]);

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

        // Phase 24: Evaluate thresholds and persist alerts
        const thresholdResult = evaluateThresholds(rates, activeWorkers, counters, freshHeartbeatCount);

        // Fire-and-forget: persist alerts to Firestore (don't block response)
        processAlerts(thresholdResult).catch((err) => {
            console.warn('[API/ops/metrics/summary] processAlerts error:', err.message);
        });

        // Get count of unresolved alerts
        const unresolvedAlerts = await getUnresolvedAlertCount();

        return NextResponse.json({
            counters,
            aggregated: { total, completed, dead, retryable },
            rates,
            activeWorkers,
            systemStatus: thresholdResult.status,
            unresolvedAlerts,
            violations: thresholdResult.violations,
            generatedAt: new Date().toISOString(),
        });
    } catch (error: any) {
        console.error('[API/ops/metrics/summary] Error:', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

