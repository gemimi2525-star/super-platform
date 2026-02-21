/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CORE OS — Appearance Manager Types (Phase 21)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * @module coreos/appearance/types
 */

// ─── Theme Mode ────────────────────────────────────────────────────────

export type ThemeMode = 'light' | 'dark' | 'auto';

// ─── Accent Token (calm palette) ───────────────────────────────────────

export type AccentToken = 'indigo' | 'emerald' | 'rose' | 'amber' | 'slate' | 'cyan';

export const ACCENT_COLORS: Record<AccentToken, { label: string; hex: string; hover: string; muted: string; subtle: string }> = {
    indigo: { label: 'Indigo', hex: '#6366f1', hover: '#4f46e5', muted: '#c7d2fe', subtle: '#eef2ff' },
    emerald: { label: 'Emerald', hex: '#10b981', hover: '#059669', muted: '#a7f3d0', subtle: '#ecfdf5' },
    rose: { label: 'Rose', hex: '#f43f5e', hover: '#e11d48', muted: '#fecdd3', subtle: '#fff1f2' },
    amber: { label: 'Amber', hex: '#f59e0b', hover: '#d97706', muted: '#fde68a', subtle: '#fffbeb' },
    slate: { label: 'Slate', hex: '#64748b', hover: '#475569', muted: '#cbd5e1', subtle: '#f8fafc' },
    cyan: { label: 'Cyan', hex: '#06b6d4', hover: '#0891b2', muted: '#a5f3fc', subtle: '#ecfeff' },
};

// ─── Font Scale ────────────────────────────────────────────────────────

export type FontScale = 90 | 100 | 110;

// ─── Wallpaper ─────────────────────────────────────────────────────────

export type WallpaperType = 'solid' | 'gradient';

export interface WallpaperConfig {
    readonly type: WallpaperType;
    readonly value: string;
}

export const WALLPAPER_PRESETS: { id: string; label: string; config: WallpaperConfig }[] = [
    { id: 'ocean', label: 'Ocean', config: { type: 'gradient', value: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 50%, #1e293b 100%)' } },
    { id: 'twilight', label: 'Twilight', config: { type: 'gradient', value: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' } },
    { id: 'aurora', label: 'Aurora', config: { type: 'gradient', value: 'linear-gradient(135deg, #0d1b2a 0%, #1b2838 40%, #2d4a3e 100%)' } },
    { id: 'midnight', label: 'Midnight', config: { type: 'gradient', value: 'linear-gradient(180deg, #0c0c1d 0%, #1a1a2e 100%)' } },
    { id: 'slate', label: 'Slate', config: { type: 'solid', value: '#1e293b' } },
    { id: 'charcoal', label: 'Charcoal', config: { type: 'solid', value: '#18181b' } },
];

// ─── Full State ────────────────────────────────────────────────────────

export interface AppearanceState {
    readonly themeMode: ThemeMode;
    readonly accent: AccentToken;
    readonly fontScale: FontScale;
    readonly wallpaper: WallpaperConfig;
    readonly updatedAt: string;
}

export const DEFAULT_APPEARANCE: AppearanceState = {
    themeMode: 'dark',
    accent: 'indigo',
    fontScale: 100,
    wallpaper: { type: 'gradient', value: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 50%, #1e293b 100%)' },
    updatedAt: new Date(0).toISOString(),
};

// ─── Storage Key ───────────────────────────────────────────────────────

export const APPEARANCE_STORAGE_KEY = 'coreos:appearance:v1';
