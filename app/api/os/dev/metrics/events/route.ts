/**
 * API Route — EventBus Metrics (Phase 23, Dev-only)
 * GET /api/os/dev/metrics/events
 */
import { NextResponse } from 'next/server';

export async function GET() {
    // Dev-only gate
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Dynamic import to avoid bundling in prod tree-shake
    const { getMetricsSnapshot } = await import('@/coreos/events/metrics');
    const snapshot = getMetricsSnapshot();

    return NextResponse.json({
        status: 'OK',
        module: 'event-bus-metrics',
        phase: 23,
        metrics: snapshot,
    });
}
