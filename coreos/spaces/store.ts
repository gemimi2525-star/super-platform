/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CORE OS — Spaces Zustand Store (Phase 20)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * SSR-safe store for virtual desktop spaces.
 * Hydrates from localStorage on mount.
 * All mutations go through apply layer (no direct localStorage).
 *
 * @module coreos/spaces/store
 */

'use client';

import { create } from 'zustand';
import type { SpaceRecord } from './types';
import { DEFAULT_SPACE_RECORD } from './types';
import { loadSpaces } from './storage';
import { applySpaceCreated, applySpaceRemoved } from './apply';

interface SpaceStoreState {
    /** All spaces (ordered) */
    spaces: SpaceRecord[];
    /** Hydrate from localStorage */
    hydrate: () => void;
    /** Add a space (via apply layer) */
    addSpace: (space: SpaceRecord) => void;
    /** Remove a space (via apply layer) */
    removeSpace: (spaceId: string) => void;
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
}));
