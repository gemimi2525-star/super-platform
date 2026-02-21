/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Dev Package Store — Zustand (Phase 25)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * In-memory store for installed dev packages.
 * No persistence in production. Dev-only.
 */

import { create } from 'zustand';
import type { InstalledPackage } from './types';
import { MAX_DEV_PACKAGES } from './types';

interface PackageStoreState {
    packages: InstalledPackage[];
    addPackage: (pkg: InstalledPackage) => boolean;
    removePackage: (id: string) => boolean;
    getPackage: (id: string) => InstalledPackage | undefined;
    hasPackage: (id: string) => boolean;
    clear: () => void;
}

export const usePackageStore = create<PackageStoreState>((set, get) => ({
    packages: [],

    addPackage: (pkg: InstalledPackage) => {
        const state = get();
        if (state.packages.length >= MAX_DEV_PACKAGES) return false;
        if (state.packages.some(p => p.id === pkg.id)) return false;
        set({ packages: [...state.packages, pkg] });
        return true;
    },

    removePackage: (id: string) => {
        const state = get();
        const before = state.packages.length;
        const after = state.packages.filter(p => p.id !== id);
        if (after.length === before) return false;
        set({ packages: after });
        return true;
    },

    getPackage: (id: string) => {
        return get().packages.find(p => p.id === id);
    },

    hasPackage: (id: string) => {
        return get().packages.some(p => p.id === id);
    },

    clear: () => set({ packages: [] }),
}));
