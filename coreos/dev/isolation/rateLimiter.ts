/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Capability Rate Limiter (Phase 26)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Per-capability sliding window rate limiting.
 * Events: 50/sec, API: 20/sec, Burst window: 5s rolling.
 */

export type RateType = 'event' | 'api';

interface RateResult {
    allowed: boolean;
    current: number;
    limit: number;
    windowMs: number;
    reason?: string;
}

const LIMITS: Record<RateType, { max: number; windowMs: number }> = {
    event: { max: 50, windowMs: 1000 },
    api: { max: 20, windowMs: 1000 },
};

/** Per-capability timestamp ring buffers */
const _buckets = new Map<string, number[]>();

function getKey(capabilityId: string, type: RateType): string {
    return `${capabilityId}:${type}`;
}

/**
 * Check if a capability action is within rate limits.
 */
export function checkRate(capabilityId: string, type: RateType): RateResult {
    const key = getKey(capabilityId, type);
    const config = LIMITS[type];
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Get or create bucket
    let timestamps = _buckets.get(key);
    if (!timestamps) {
        timestamps = [];
        _buckets.set(key, timestamps);
    }

    // Prune expired entries
    const active = timestamps.filter(t => t > windowStart);
    _buckets.set(key, active);

    // Check limit
    if (active.length >= config.max) {
        return {
            allowed: false,
            current: active.length,
            limit: config.max,
            windowMs: config.windowMs,
            reason: `Rate limit exceeded: ${capabilityId} ${type} (${active.length}/${config.max} per ${config.windowMs}ms)`,
        };
    }

    // Record this action
    active.push(now);
    return {
        allowed: true,
        current: active.length,
        limit: config.max,
        windowMs: config.windowMs,
    };
}

/**
 * Get current rate usage for a capability.
 */
export function getRateUsage(capabilityId: string): Record<RateType, { current: number; limit: number }> {
    const now = Date.now();
    const result: Record<string, { current: number; limit: number }> = {};

    for (const type of ['event', 'api'] as RateType[]) {
        const key = getKey(capabilityId, type);
        const config = LIMITS[type];
        const timestamps = _buckets.get(key) || [];
        const active = timestamps.filter(t => t > now - config.windowMs);
        result[type] = { current: active.length, limit: config.max };
    }

    return result as Record<RateType, { current: number; limit: number }>;
}

/**
 * Reset all rate counters (dev/test).
 */
export function resetRateLimiter(): void {
    _buckets.clear();
}
