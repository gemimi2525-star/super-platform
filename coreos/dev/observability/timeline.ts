/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Event Timeline Engine (Phase 27)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Deterministic ring buffer recording all observability events.
 * Max 500 entries, ordered by seq number.
 * SSR-safe — no window/document dependencies.
 */

export type TimelineEventKind =
    | 'lifecycle.transition'
    | 'permission.denied'
    | 'crosscall.denied'
    | 'rate.throttled'
    | 'package.installed'
    | 'package.uninstalled'
    | 'capability.enabled'
    | 'capability.disabled';

export interface TimelineEntry {
    seq: number;
    kind: TimelineEventKind;
    capabilityId: string;
    detail: string;
    timestamp: string; // ISO
}

const MAX_ENTRIES = 500;
let _timeline: TimelineEntry[] = [];
let _seq = 0;

/**
 * Record an event to the timeline.
 */
export function recordEvent(
    kind: TimelineEventKind,
    capabilityId: string,
    detail: string,
): TimelineEntry {
    const entry: TimelineEntry = {
        seq: ++_seq,
        kind,
        capabilityId,
        detail,
        timestamp: new Date().toISOString(),
    };

    _timeline.push(entry);
    if (_timeline.length > MAX_ENTRIES) {
        _timeline = _timeline.slice(-MAX_ENTRIES);
    }

    return entry;
}

/**
 * Get timeline entries (most recent first).
 */
export function getTimeline(limit = 50): TimelineEntry[] {
    return _timeline.slice(-limit).reverse();
}

/**
 * Get full timeline (for export).
 */
export function getFullTimeline(): TimelineEntry[] {
    return [..._timeline];
}

/**
 * Get current sequence number.
 */
export function getSeq(): number {
    return _seq;
}

/**
 * Clear timeline (dev/test).
 */
export function clearTimeline(): void {
    _timeline = [];
    _seq = 0;
}
