/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CORE OS — Spaces Apply Layer (Phase 20 / 20.5)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Sole writer to localStorage for space records.
 * Called only after API success.
 *
 * @module coreos/spaces/apply
 */

import type { SpaceRecord } from './types';
import {
    upsertSpace,
    removeSpaceById,
    renameSpaceById,
    reorderSpaces as reorderSpacesStorage,
    saveActiveSpaceId,
} from './storage';

/** Apply a created space → write to localStorage */
export function applySpaceCreated(space: SpaceRecord): SpaceRecord[] {
    return upsertSpace(space);
}

/** Apply a removed space → delete from localStorage */
export function applySpaceRemoved(spaceId: string): SpaceRecord[] {
    return removeSpaceById(spaceId);
}

// ─── Phase 20.5 ────────────────────────────────────────────────────────

/** Apply a renamed space → update localStorage */
export function applySpaceRenamed(spaceId: string, name: string): SpaceRecord[] {
    return renameSpaceById(spaceId, name);
}

/** Apply reordered spaces → update localStorage */
export function applySpacesReordered(orderedIds: string[]): SpaceRecord[] {
    return reorderSpacesStorage(orderedIds);
}

/** Persist active space ID to localStorage */
export function applyActiveSpaceId(spaceId: string): void {
    saveActiveSpaceId(spaceId);
}
