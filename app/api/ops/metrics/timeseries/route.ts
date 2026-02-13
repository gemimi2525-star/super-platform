/**
 * ═══════════════════════════════════════════════════════════════════════════
 * API — GET /api/ops/metrics/timeseries (Phase 22B)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Returns bucketed timeseries data for a metric.
 * Query params:
 *   - metric (required): e.g. "job_latency"
 *   - window (optional): e.g. "60m", "24h" (default 60m)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTimeseries } from '@/coreos/ops/metrics';
import type { TimeseriesBucket } from '@/coreos/ops/types';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const metric = searchParams.get('metric') ?? 'job_latency';
        const windowParam = searchParams.get('window') ?? '60m';

        // Parse window
        const windowMs = parseWindow(windowParam);
        if (!windowMs) {
            return NextResponse.json(
                { error: `Invalid window format: ${windowParam}. Use e.g. "60m", "24h"` },
                { status: 400 },
            );
        }

        const entries = await getTimeseries(metric, windowMs);

        // Aggregate into buckets
        const bucketMap = new Map<string, { count: number; sum: number; min: number; max: number }>();

        for (const entry of entries) {
            const existing = bucketMap.get(entry.bucket);
            if (existing) {
                existing.count++;
                existing.sum += entry.value;
                existing.min = Math.min(existing.min, entry.value);
                existing.max = Math.max(existing.max, entry.value);
            } else {
                bucketMap.set(entry.bucket, {
                    count: 1,
                    sum: entry.value,
                    min: entry.value,
                    max: entry.value,
                });
            }
        }

        const buckets: TimeseriesBucket[] = Array.from(bucketMap.entries())
            .map(([bucket, data]) => ({
                bucket,
                count: data.count,
                sum: data.sum,
                min: data.min,
                max: data.max,
                avg: Math.round(data.sum / data.count),
            }))
            .sort((a, b) => a.bucket.localeCompare(b.bucket));

        return NextResponse.json({
            metric,
            window: windowParam,
            windowMs,
            totalEntries: entries.length,
            buckets,
            generatedAt: new Date().toISOString(),
        });
    } catch (error: any) {
        console.error('[API/ops/metrics/timeseries] Error:', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

function parseWindow(w: string): number | null {
    const match = w.match(/^(\d+)(m|h|d)$/);
    if (!match) return null;
    const num = parseInt(match[1]);
    switch (match[2]) {
        case 'm': return num * 60 * 1000;
        case 'h': return num * 3600 * 1000;
        case 'd': return num * 86400 * 1000;
        default: return null;
    }
}
