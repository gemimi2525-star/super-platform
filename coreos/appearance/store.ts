/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CORE OS — Appearance Zustand Store (Phase 21)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * SSR-safe store. All mutations go through apply layer.
 *
 * @module coreos/appearance/store
 */

'use client';

import { create } from 'zustand';
import type { AppearanceState, ThemeMode, AccentToken, FontScale, WallpaperConfig } from './types';
import { DEFAULT_APPEARANCE } from './types';
import { loadAppearance } from './storage';
import {
    applyAppearanceToDom,
    applyThemeChanged,
    applyAccentChanged,
    applyFontScaleChanged,
    applyWallpaperChanged,
} from './apply';

interface AppearanceStoreState extends AppearanceState {
    hydrate: () => void;
    setTheme: (mode: ThemeMode) => void;
    setAccent: (accent: AccentToken) => void;
    setFontScale: (scale: FontScale) => void;
    setWallpaper: (wallpaper: WallpaperConfig) => void;
}

export const useAppearanceStore = create<AppearanceStoreState>((set) => ({
    ...DEFAULT_APPEARANCE,

    hydrate: () => {
        const state = loadAppearance();
        set(state);
        applyAppearanceToDom(state);
    },

    setTheme: (mode) => {
        const updated = applyThemeChanged(mode);
        set(updated);
    },

    setAccent: (accent) => {
        const updated = applyAccentChanged(accent);
        set(updated);
    },

    setFontScale: (scale) => {
        const updated = applyFontScaleChanged(scale);
        set(updated);
    },

    setWallpaper: (wallpaper) => {
        const updated = applyWallpaperChanged(wallpaper);
        set(updated);
    },
}));
