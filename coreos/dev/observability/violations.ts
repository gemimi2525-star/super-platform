/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Isolation Violation Log (Phase 27)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Tracks permission denials, cross-call denials, throttles,
 * and disabled capability action attempts.
 * Ring buffer (max 200). Each entry includes traceId + reason.
 */

export type ViolationType =
    | 'permission.denied'
    | 'crosscall.denied'
    | 'rate.throttled'
    | 'disabled.action';

export interface ViolationEntry {
    id: number;
    type: ViolationType;
    capabilityId: string;
    targetId?: string;   // for cross-call
    reason: string;
    timestamp: string;   // ISO
}

const MAX_VIOLATIONS = 200;
let _violations: ViolationEntry[] = [];
let _vid = 0;

/**
 * Record a violation.
 */
export function recordViolation(
    type: ViolationType,
    capabilityId: string,
    reason: string,
    targetId?: string,
): ViolationEntry {
    const entry: ViolationEntry = {
        id: ++_vid,
        type,
        capabilityId,
        targetId,
        reason,
        timestamp: new Date().toISOString(),
    };

    _violations.push(entry);
    if (_violations.length > MAX_VIOLATIONS) {
        _violations = _violations.slice(-MAX_VIOLATIONS);
    }

    return entry;
}

/**
 * Get violations (most recent first).
 */
export function getViolations(limit = 50): ViolationEntry[] {
    return _violations.slice(-limit).reverse();
}

/**
 * Get all violations (for export).
 */
export function getAllViolations(): ViolationEntry[] {
    return [..._violations];
}

/**
 * Get violation counts by type.
 */
export function getViolationCounts(): Record<ViolationType, number> {
    const counts: Record<string, number> = {
        'permission.denied': 0,
        'crosscall.denied': 0,
        'rate.throttled': 0,
        'disabled.action': 0,
    };
    for (const v of _violations) {
        counts[v.type] = (counts[v.type] || 0) + 1;
    }
    return counts as Record<ViolationType, number>;
}

/**
 * Clear violations (dev/test).
 */
export function clearViolations(): void {
    _violations = [];
    _vid = 0;
}
