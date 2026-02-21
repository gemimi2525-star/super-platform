/**
 * ═══════════════════════════════════════════════════════════════════════════
 * OS EVENT BUS — Guards (Phase 23)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Deterministic throttle for high-frequency event types.
 * Runtime stability guard — NOT a policy decision.
 */

interface GuardResult {
    allowed: boolean;
    reason?: string;
}

/** Throttle window per event type prefix (ms) */
const THROTTLE_MAP: Record<string, number> = {
    'drag': 100,
    'focus': 200,
    'space': 150,
};

/** Last publish timestamp per throttle key */
const _lastPublish = new Map<string, number>();

function getThrottleKey(type: string): string | null {
    const dot = type.indexOf('.');
    const prefix = dot > 0 ? type.slice(0, dot) : type;
    return THROTTLE_MAP[prefix] !== undefined ? prefix : null;
}

export function shouldPublish(type: string): GuardResult {
    const key = getThrottleKey(type);
    if (!key) return { allowed: true };

    const windowMs = THROTTLE_MAP[key];
    const now = Date.now();
    const last = _lastPublish.get(key);

    if (last && now - last < windowMs) {
        return { allowed: false, reason: `throttled:${key} (${windowMs}ms window)` };
    }

    _lastPublish.set(key, now);
    return { allowed: true };
}

export function resetGuards(): void {
    _lastPublish.clear();
}
