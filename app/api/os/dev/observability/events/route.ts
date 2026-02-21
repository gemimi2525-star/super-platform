/**
 * API Route — Observability Events (Phase 27, Dev-only)
 * GET /api/os/dev/observability/events
 */
import { NextResponse } from 'next/server';

export async function GET() {
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const { getTimeline, getSeq } = await import('@/coreos/dev/observability/timeline');
    const { getViolationCounts } = await import('@/coreos/dev/observability/violations');
    const { getMetricsSnapshot } = await import('@/coreos/events/metrics');

    return NextResponse.json({
        status: 'OK',
        module: 'observability-events',
        phase: 27,
        seq: getSeq(),
        timeline: getTimeline(50),
        violationCounts: getViolationCounts(),
        eventBusMetrics: getMetricsSnapshot(),
    });
}
