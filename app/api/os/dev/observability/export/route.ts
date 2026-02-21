/**
 * API Route — Observability Export (Phase 27, Dev-only)
 * GET /api/os/dev/observability/export
 *
 * Full deterministic snapshot for debug replay / forensics.
 */
import { NextResponse } from 'next/server';

export async function GET() {
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const { getFullTimeline, getSeq } = await import('@/coreos/dev/observability/timeline');
    const { getAllViolations, getViolationCounts } = await import('@/coreos/dev/observability/violations');
    const { captureRateSnapshot } = await import('@/coreos/dev/observability/rateSnapshot');
    const { getMetricsSnapshot } = await import('@/coreos/events/metrics');

    return NextResponse.json({
        status: 'OK',
        module: 'observability-export',
        phase: 27,
        exportedAt: new Date().toISOString(),
        seq: getSeq(),
        timeline: getFullTimeline(),
        violations: getAllViolations(),
        violationCounts: getViolationCounts(),
        rate: captureRateSnapshot(),
        eventBusMetrics: getMetricsSnapshot(),
    });
}
