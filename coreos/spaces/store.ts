/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CORE OS — Spaces Zustand Store (Phase 20 / 20.5)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * SSR-safe store for virtual desktop spaces.
 * Hydrates from localStorage on mount.
 * All mutations go through apply layer (no direct localStorage).
 *
 * Phase 20.5: Added rename, reorder, activeSpaceId restore
 *
 * @module coreos/spaces/store
 */

'use client';

import { create } from 'zustand';
import type { SpaceRecord } from './types';
import { DEFAULT_SPACE_RECORD } from './types';
import { loadSpaces, loadActiveSpaceId } from './storage';
import {
    applySpaceCreated,
    applySpaceRemoved,
    applySpaceRenamed,
    applySpacesReordered,
    applyActiveSpaceId,
} from './apply';

interface SpaceStoreState {
    /** All spaces (ordered) */
    spaces: SpaceRecord[];
    /** Hydrate from localStorage */
    hydrate: () => void;
    /** Add a space (via apply layer) */
    addSpace: (space: SpaceRecord) => void;
    /** Remove a space (via apply layer) */
    removeSpace: (spaceId: string) => void;
    /** Phase 20.5: Rename a space */
    renameSpace: (spaceId: string, name: string) => void;
    /** Phase 20.5: Reorder spaces */
    reorderSpaces: (orderedIds: string[]) => void;
    /** Phase 20.5: Persist active space ID */
    setActiveSpaceId: (spaceId: string) => void;
    /** Phase 20.5: Load persisted active space ID */
    getPersistedActiveSpaceId: () => string;
}

export const useSpaceStore = create<SpaceStoreState>((set) => ({
    spaces: [DEFAULT_SPACE_RECORD],

    hydrate: () => {
        const spaces = loadSpaces();
        set({ spaces });
    },

    addSpace: (space) => {
        const updated = applySpaceCreated(space);
        set({ spaces: updated });
    },

    removeSpace: (spaceId) => {
        const updated = applySpaceRemoved(spaceId);
        set({ spaces: updated });
    },

    renameSpace: (spaceId, name) => {
        const updated = applySpaceRenamed(spaceId, name);
        set({ spaces: updated });
    },

    reorderSpaces: (orderedIds) => {
        const updated = applySpacesReordered(orderedIds);
        set({ spaces: updated });
    },

    setActiveSpaceId: (spaceId) => {
        applyActiveSpaceId(spaceId);
    },

    getPersistedActiveSpaceId: () => {
        return loadActiveSpaceId();
    },
}));
