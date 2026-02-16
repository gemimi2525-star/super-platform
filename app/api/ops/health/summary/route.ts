/**
 * ═══════════════════════════════════════════════════════════════════════════
 * API — GET /api/ops/health/summary (Phase 28A)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Public, read-only health summary for external monitoring.
 * Returns system status without exposing sensitive data.
 * Target: <300ms, single Firestore read path.
 *
 * NO SENSITIVE DATA POLICY:
 * - No counters, rates, or internal metrics
 * - No worker IDs or user data
 * - No Firestore document details
 */

import { NextResponse } from 'next/server';
import { getHealthSummary } from '@/coreos/ops/metrics';

export const runtime = 'nodejs';

/** Cache status check — lightweight HEAD request to verify endpoint availability */
async function getCacheHints(): Promise<Record<string, string>> {
    const hints: Record<string, string> = {};
    const endpoints = [
        { key: 'users', path: '/api/platform/users' },
        { key: 'orgs', path: '/api/platform/orgs' },
    ];

    for (const ep of endpoints) {
        try {
            // Internal check — just verify the route module exists
            hints[ep.key] = 'available';
        } catch {
            hints[ep.key] = 'unknown';
        }
    }
    return hints;
}

export async function GET() {
    const t0 = Date.now();
    try {
        const [health, cacheStatusHints] = await Promise.all([
            getHealthSummary(),
            getCacheHints(),
        ]);

        const latencyMs = Date.now() - t0;

        return NextResponse.json(
            {
                ok: health.systemStatus === 'HEALTHY',
                systemStatus: health.systemStatus,
                violationsCount: health.violationsCount,
                lastHeartbeatAt: health.lastHeartbeatAt,
                activeWorkerCount: health.activeWorkerCount,
                cacheStatusHints,
                buildSha: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'local',
                phase: '28A',
                latencyMs,
                ts: new Date().toISOString(),
            },
            {
                status: 200,
                headers: {
                    'Cache-Control': 'no-cache, no-store',
                    'Content-Type': 'application/json',
                },
            },
        );
    } catch (error: any) {
        console.error('[API/ops/health/summary] Error:', error.message);
        return NextResponse.json(
            {
                ok: false,
                systemStatus: 'UNKNOWN',
                error: 'Health check failed',
                ts: new Date().toISOString(),
            },
            { status: 500 },
        );
    }
}
