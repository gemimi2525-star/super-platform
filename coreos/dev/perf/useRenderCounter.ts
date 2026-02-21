/**
 * ═══════════════════════════════════════════════════════════════════════════
 * useRenderCounter — Dev-only render tracking hook (Phase 23)
 * ═══════════════════════════════════════════════════════════════════════════
 */
'use client';

import { useRef } from 'react';

/** Global in-memory render count map */
const _renderCounts = new Map<string, number>();

/**
 * Track render count for a named component bucket.
 * Returns current count. No-op overhead in production (just a ref increment).
 */
export function useRenderCounter(name: string): number {
    const countRef = useRef(0);
    countRef.current++;
    _renderCounts.set(name, countRef.current);
    return countRef.current;
}

/** Snapshot of all render counts */
export function getRenderSnapshot(): Record<string, number> {
    const out: Record<string, number> = {};
    for (const [k, v] of _renderCounts) {
        out[k] = v;
    }
    return out;
}

/** Reset all counters (dev/test) */
export function resetRenderCounters(): void {
    _renderCounts.clear();
}
