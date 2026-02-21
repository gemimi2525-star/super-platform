/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CORE OS — Spaces Apply Layer (Phase 20)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Sole writer to localStorage for space records.
 * Called only after API success.
 *
 * @module coreos/spaces/apply
 */

import type { SpaceRecord } from './types';
import { upsertSpace, removeSpaceById } from './storage';

/** Apply a created space → write to localStorage */
export function applySpaceCreated(space: SpaceRecord): SpaceRecord[] {
    return upsertSpace(space);
}

/** Apply a removed space → delete from localStorage */
export function applySpaceRemoved(spaceId: string): SpaceRecord[] {
    return removeSpaceById(spaceId);
}
