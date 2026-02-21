/**
 * ═══════════════════════════════════════════════════════════════════════════
 * OS EVENT BUS — Metrics (Phase 23)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * In-memory counters for publish/dedupe/drop/deliver tracking.
 * No side-effects. Snapshot-only reads.
 */

export interface EventBusMetrics {
    publishedTotal: number;
    deliveredTotal: number;
    dedupedTotal: number;
    droppedTotal: number;
    bufferSize: number;
    byDomain: Record<string, number>;
}

const _metrics: EventBusMetrics = {
    publishedTotal: 0,
    deliveredTotal: 0,
    dedupedTotal: 0,
    droppedTotal: 0,
    bufferSize: 0,
    byDomain: {},
};

function domainOf(type: string): string {
    const dot = type.indexOf('.');
    return dot > 0 ? type.slice(0, dot) : type;
}

export function incrementPublished(type: string): void {
    _metrics.publishedTotal++;
    const d = domainOf(type);
    _metrics.byDomain[d] = (_metrics.byDomain[d] || 0) + 1;
}

export function incrementDelivered(count: number): void {
    _metrics.deliveredTotal += count;
}

export function incrementDeduped(): void {
    _metrics.dedupedTotal++;
}

export function incrementDropped(): void {
    _metrics.droppedTotal++;
}

export function setBufferSize(size: number): void {
    _metrics.bufferSize = size;
}

export function getMetricsSnapshot(): Readonly<EventBusMetrics> {
    return { ..._metrics, byDomain: { ..._metrics.byDomain } };
}

export function resetMetrics(): void {
    _metrics.publishedTotal = 0;
    _metrics.deliveredTotal = 0;
    _metrics.dedupedTotal = 0;
    _metrics.droppedTotal = 0;
    _metrics.bufferSize = 0;
    _metrics.byDomain = {};
}
