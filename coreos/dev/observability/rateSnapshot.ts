/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Rate Analytics Snapshot (Phase 27)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Aggregates per-capability rate usage from rateLimiter + isolation registry.
 */

import { getRateUsage } from '@/coreos/dev/isolation/rateLimiter';
import { useIsolationRegistry } from '@/coreos/dev/isolation/registry';

export interface CapabilityRateSnapshot {
    capabilityId: string;
    state: string;
    event: { current: number; limit: number };
    api: { current: number; limit: number };
    throttleCount: number;
    denyCount: number;
}

export interface RateAnalyticsSnapshot {
    timestamp: string;
    totalCapabilities: number;
    totalThrottled: number;
    totalDenied: number;
    capabilities: CapabilityRateSnapshot[];
}

/**
 * Capture a snapshot of all capability rate usage.
 */
export function captureRateSnapshot(): RateAnalyticsSnapshot {
    const caps = useIsolationRegistry.getState().capabilities;
    let totalThrottled = 0;
    let totalDenied = 0;

    const snapshots: CapabilityRateSnapshot[] = caps.map(c => {
        const usage = getRateUsage(c.capabilityId);
        totalThrottled += c.throttleCount;
        totalDenied += c.denyCount;

        return {
            capabilityId: c.capabilityId,
            state: c.state,
            event: usage.event,
            api: usage.api,
            throttleCount: c.throttleCount,
            denyCount: c.denyCount,
        };
    });

    return {
        timestamp: new Date().toISOString(),
        totalCapabilities: caps.length,
        totalThrottled,
        totalDenied,
        capabilities: snapshots,
    };
}
