/**
 * ═══════════════════════════════════════════════════════════════════════════
 * APICOREDATA OS — Core Preferences Store
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * PHASE 7.4: Persisted preferences for brand and appearance
 * 
 * Storage: localStorage (per device, v1)
 * Future: Persist per org/user in DB (v1.1)
 * 
 * @version 1.0.0
 * @date 2026-01-29
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { OSBackgroundPreset } from '@/lib/os-core/appearance';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface BrandSettings {
    /** Custom logo URL (data URL or external URL) */
    logoUrl: string | null;
    /** Original filename for display */
    logoFilename: string | null;
}

export interface AppearanceSettings {
    /** Desktop background preset key */
    backgroundPreset: OSBackgroundPreset;
    /** Custom background (if not using preset) */
    customBackground: string | null;
}

export interface CorePreferencesState {
    // Brand
    brand: BrandSettings;

    // Appearance
    appearance: AppearanceSettings;

    // Recent Items (for Core System Menu)
    recentApps: string[];

    // Lock State
    isLocked: boolean;

    // Actions
    setBrandLogo: (logoUrl: string | null, filename: string | null) => void;
    setBackgroundPreset: (preset: OSBackgroundPreset) => void;
    setCustomBackground: (value: string | null) => void;
    addRecentApp: (appId: string) => void;
    clearRecentApps: () => void;
    setLocked: (locked: boolean) => void;
    resetBrand: () => void;
    resetAppearance: () => void;
    resetAll: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// DEFAULTS
// ═══════════════════════════════════════════════════════════════════════════

const DEFAULT_BRAND: BrandSettings = {
    logoUrl: null,
    logoFilename: null,
};

const DEFAULT_APPEARANCE: AppearanceSettings = {
    backgroundPreset: 'gradient-light',
    customBackground: null,
};

// ═══════════════════════════════════════════════════════════════════════════
// STORE
// ═══════════════════════════════════════════════════════════════════════════

export const useCorePreferences = create<CorePreferencesState>()(
    persist(
        (set, get) => ({
            // Initial state
            brand: DEFAULT_BRAND,
            appearance: DEFAULT_APPEARANCE,
            recentApps: [],
            isLocked: false,

            // Brand actions
            setBrandLogo: (logoUrl, filename) => {
                set({
                    brand: {
                        logoUrl,
                        logoFilename: filename,
                    },
                });
            },

            resetBrand: () => {
                set({ brand: DEFAULT_BRAND });
            },

            // Appearance actions
            setBackgroundPreset: (preset) => {
                set({
                    appearance: {
                        ...get().appearance,
                        backgroundPreset: preset,
                        customBackground: null, // Clear custom when using preset
                    },
                });
            },

            setCustomBackground: (value) => {
                set({
                    appearance: {
                        ...get().appearance,
                        customBackground: value,
                    },
                });
            },

            resetAppearance: () => {
                set({ appearance: DEFAULT_APPEARANCE });
            },

            // Recent apps
            addRecentApp: (appId) => {
                const current = get().recentApps;
                // Remove if exists, add to front, limit to 5
                const filtered = current.filter(id => id !== appId);
                set({
                    recentApps: [appId, ...filtered].slice(0, 5),
                });
            },

            clearRecentApps: () => {
                set({ recentApps: [] });
            },

            // Lock
            setLocked: (locked) => {
                set({ isLocked: locked });
            },

            // Reset all (preserves preferences after logout per spec)
            resetAll: () => {
                set({
                    brand: DEFAULT_BRAND,
                    appearance: DEFAULT_APPEARANCE,
                    recentApps: [],
                    isLocked: false,
                });
            },
        }),
        {
            name: 'apicoredata.os.preferences',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                brand: state.brand,
                appearance: state.appearance,
                recentApps: state.recentApps,
                // Don't persist isLocked
            }),
        }
    )
);

// ═══════════════════════════════════════════════════════════════════════════
// SELECTORS
// ═══════════════════════════════════════════════════════════════════════════

export const selectBrandLogo = (state: CorePreferencesState) => state.brand.logoUrl;
export const selectBackgroundPreset = (state: CorePreferencesState) => state.appearance.backgroundPreset;
export const selectRecentApps = (state: CorePreferencesState) => state.recentApps;
