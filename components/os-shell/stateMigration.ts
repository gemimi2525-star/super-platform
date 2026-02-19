/**
 * ═══════════════════════════════════════════════════════════════════════════
 * OS SHELL — State Migration (Phase 39)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Pure, deterministic migration functions for shell snapshots.
 * Handles alias resolution, ghost removal, and single-instance dedup.
 *
 * Rules:
 * - Every function is pure + deterministic + idempotent
 * - Never deletes user data (VFS) — only UI state
 * - All migrations are versioned and forward-only
 *
 * @module components/os-shell/stateMigration
 * @version 1.0.0 (Phase 39)
 */

import type { ShellSnapshot, WindowSnapshot } from './shell-persistence';
import { isSingleInstance } from './apps/manifest';

// ═══════════════════════════════════════════════════════════════════════════
// ALIAS MAP — Dead/alias capabilityIds → canonical capabilityId
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Maps dead or alias capability IDs to their canonical replacements.
 * null = remove (ghost, no canonical exists).
 */
export const CAPABILITY_ALIAS_MAP: Record<string, string | null> = {
    // Phase 38: Removed entries
    'core.files': 'core.finder',    // core.finder is canonical Finder
    'system.explorer': 'core.finder',    // Legacy alias → core.finder
    'brain.dashboard': null,             // Merged into Monitor Hub (Phase 26A), no standalone
    'core.store': null,             // Placeholder, no component yet
};

// ═══════════════════════════════════════════════════════════════════════════
// HUB TAB MAP — Capabilities that should route to System Hub tabs
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Maps capabilities that overlap with System Hub tabs.
 * When a dock item maps here, clicking it opens/focuses System Hub
 * with the specified tab instead of spawning a standalone app.
 */
export const HUB_TAB_MAP: Record<string, string> = {
    'user.manage': 'users',
    'org.manage': 'organization',
    'system.configure': 'configuration',
    'core.settings': 'general',
};

// ═══════════════════════════════════════════════════════════════════════════
// MIGRATION: v1 → v2
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Migrate a v1 snapshot to v2.
 * - Remaps alias capabilityIds to canonical IDs
 * - Removes ghost windows (capabilityId → null in alias map)
 * - Deduplicates single-instance app windows (keeps highest zIndex)
 * - Bumps version to 2
 *
 * Pure + deterministic + idempotent.
 */
export function migrateSnapshotV1toV2(snapshot: ShellSnapshot): ShellSnapshot {
    // Step 1: Remap aliases and remove ghosts
    const remapped: WindowSnapshot[] = [];
    for (const win of snapshot.windows) {
        const alias = CAPABILITY_ALIAS_MAP[win.capabilityId];

        if (alias === undefined) {
            // Not in alias map → keep as-is
            remapped.push(win);
        } else if (alias === null) {
            // Ghost → remove
            continue;
        } else {
            // Alias → remap to canonical
            remapped.push({ ...win, capabilityId: alias });
        }
    }

    // Step 2: Normalize (dedup single-instance)
    const normalized = normalizeWindows(remapped);

    return {
        ...snapshot,
        version: 2 as ShellSnapshot['version'],
        windows: normalized,
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// NORMALIZE WINDOWS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Normalize window list:
 * - For single-instance apps: keep only the window with highest zIndex
 * - Recalculate z-indices contiguously (0, 1, 2, ...)
 *
 * Pure + deterministic.
 */
export function normalizeWindows(windows: WindowSnapshot[]): WindowSnapshot[] {
    const seen = new Map<string, WindowSnapshot>(); // capabilityId → best window

    for (const win of windows) {
        const isSingle = isSingleInstance(win.capabilityId);

        if (isSingle && seen.has(win.capabilityId)) {
            // Keep the one with higher zIndex (most recently focused)
            const existing = seen.get(win.capabilityId)!;
            if (win.zIndex > existing.zIndex) {
                seen.set(win.capabilityId, win);
            }
            // else keep existing
        } else {
            // Multi-instance or first occurrence → keep
            // For multi-instance, use composite key to allow multiple
            const key = isSingle ? win.capabilityId : `${win.capabilityId}::${win.id}`;
            seen.set(key, win);
        }
    }

    // Collect and re-index z-indices contiguously
    const result = Array.from(seen.values())
        .sort((a, b) => a.zIndex - b.zIndex)
        .map((win, idx) => ({ ...win, zIndex: idx }));

    return result;
}

// ═══════════════════════════════════════════════════════════════════════════
// MIGRATION PIPELINE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Run all necessary migrations on a snapshot to bring it to current version.
 * Returns the migrated snapshot, or null if the snapshot is invalid.
 *
 * @param snapshot - The snapshot to migrate (any version)
 * @returns Migrated snapshot at current version, or null
 */
export function migrateSnapshot(snapshot: ShellSnapshot): ShellSnapshot | null {
    let current = snapshot;

    // v1 → v2
    if (current.version === 1) {
        console.log('[StateMigration] Migrating snapshot v1 → v2');
        current = migrateSnapshotV1toV2(current);
    }

    // Future: v2 → v3, etc.

    return current;
}
