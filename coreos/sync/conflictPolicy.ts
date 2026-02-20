/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Conflict Policy — Phase 15D.C
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Deterministic, pure conflict resolution for cross-device job state.
 *
 * Policy v1 (3-tier tiebreak):
 *   1) Newer updatedAt wins
 *   2) If equal: higher priority wins
 *   3) If still equal: lexical compare deviceId (stable deterministic fallback)
 *
 * @module coreos/sync/conflictPolicy
 * @version 1.0.0
 */

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface JobConflictState {
    /** Last update timestamp (epoch ms) */
    updatedAt: number;
    /** Current priority (0–100) */
    priority: number;
    /** Device ID that authored this state */
    deviceId: string;
    /** Current status */
    status: string;
}

export type ConflictWinner = 'local' | 'remote';

// ═══════════════════════════════════════════════════════════════════════════
// RESOLVER
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Resolve a conflict between local (outbox) and remote (server) job state.
 *
 * Pure, deterministic function — same inputs always produce same output.
 * No side effects, no network calls.
 *
 * @param local  - The local/outbox version of the job state
 * @param remote - The server/remote version of the job state
 * @returns 'local' if local should be re-applied, 'remote' if server wins
 */
export function resolveJobConflict(
    local: JobConflictState,
    remote: JobConflictState,
): ConflictWinner {
    // Tier 1: Newer timestamp wins
    if (local.updatedAt !== remote.updatedAt) {
        return local.updatedAt > remote.updatedAt ? 'local' : 'remote';
    }

    // Tier 2: Higher priority wins (if timestamps are equal)
    if (local.priority !== remote.priority) {
        return local.priority > remote.priority ? 'local' : 'remote';
    }

    // Tier 3: Lexical deviceId comparison (stable deterministic fallback)
    if (local.deviceId !== remote.deviceId) {
        return local.deviceId < remote.deviceId ? 'local' : 'remote';
    }

    // Perfectly identical state — remote wins (server is authoritative)
    return 'remote';
}
