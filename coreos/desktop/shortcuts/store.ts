/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CORE OS — Desktop Shortcut Store (Phase 19.5)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Zustand store for desktop shortcuts. SSR-safe.
 * Hydrates from storage on mount. Mutations go through apply layer.
 *
 * @module coreos/desktop/shortcuts/store
 */

import { create } from 'zustand';
import type { DesktopShortcut } from './types';
import { loadShortcuts } from './storage';
import { applyShortcutCreated, applyShortcutRemoved } from './apply';

interface ShortcutStoreState {
    /** Current shortcuts */
    shortcuts: DesktopShortcut[];

    /** Whether store has been hydrated from storage */
    hydrated: boolean;

    /** Hydrate from localStorage (call once on mount) */
    hydrate: () => void;

    /** Add shortcut (after API success) */
    addShortcut: (shortcut: DesktopShortcut) => void;

    /** Remove shortcut (after API success) */
    removeShortcut: (id: string) => void;

    /** Check if shortcut exists for capability */
    hasShortcut: (capabilityId: string) => boolean;
}

export const useShortcutStore = create<ShortcutStoreState>((set, get) => ({
    shortcuts: [],
    hydrated: false,

    hydrate: () => {
        if (get().hydrated) return;
        const loaded = loadShortcuts();
        set({ shortcuts: loaded, hydrated: true });
    },

    addShortcut: (shortcut: DesktopShortcut) => {
        // Apply to storage first
        applyShortcutCreated(shortcut);
        // Then update store
        set(state => ({
            shortcuts: [...state.shortcuts, shortcut],
        }));
    },

    removeShortcut: (id: string) => {
        // Apply to storage first
        applyShortcutRemoved(id);
        // Then update store
        set(state => ({
            shortcuts: state.shortcuts.filter(s => s.id !== id),
        }));
    },

    hasShortcut: (capabilityId: string) => {
        return get().shortcuts.some(s => s.capabilityId === capabilityId);
    },
}));
