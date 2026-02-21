/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CORE OS — Appearance Apply Layer (Phase 21)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Sole writer to localStorage + CSS side-effects.
 * Called only after API success.
 *
 * @module coreos/appearance/apply
 */

import type { AppearanceState, ThemeMode, AccentToken, FontScale, WallpaperConfig } from './types';
import { ACCENT_COLORS } from './types';
import { loadAppearance, saveAppearance } from './storage';

// ─── CSS Side-Effects (deterministic, single point) ────────────────────

/** Apply the full appearance state to the DOM */
export function applyAppearanceToDom(state: AppearanceState): void {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    // Theme mode
    const resolvedTheme = state.themeMode === 'auto'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : state.themeMode;
    root.dataset.theme = resolvedTheme;

    // Accent colors
    const accent = ACCENT_COLORS[state.accent] ?? ACCENT_COLORS.indigo;
    root.style.setProperty('--os-accent', accent.hex);
    root.style.setProperty('--os-accent-hover', accent.hover);
    root.style.setProperty('--os-accent-muted', accent.muted);
    root.style.setProperty('--os-accent-subtle', accent.subtle);

    // Font scale
    root.style.setProperty('--os-font-scale', `${state.fontScale}%`);
    root.style.fontSize = `${state.fontScale}%`;

    // Wallpaper
    document.body.style.background = state.wallpaper.value;
}

// ─── Apply + Persist ───────────────────────────────────────────────────

function applyAndPersist(partial: Partial<AppearanceState>): AppearanceState {
    const current = loadAppearance();
    const updated: AppearanceState = {
        ...current,
        ...partial,
        updatedAt: new Date().toISOString(),
    };
    saveAppearance(updated);
    applyAppearanceToDom(updated);
    return updated;
}

export function applyThemeChanged(themeMode: ThemeMode): AppearanceState {
    return applyAndPersist({ themeMode });
}

export function applyAccentChanged(accent: AccentToken): AppearanceState {
    return applyAndPersist({ accent });
}

export function applyFontScaleChanged(fontScale: FontScale): AppearanceState {
    return applyAndPersist({ fontScale });
}

export function applyWallpaperChanged(wallpaper: WallpaperConfig): AppearanceState {
    return applyAndPersist({ wallpaper });
}
