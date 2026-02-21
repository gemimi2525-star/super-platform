/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CORE OS — Appearance Storage Adapter (Phase 21)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * SSR-safe localStorage adapter. Write methods called ONLY by apply layer.
 *
 * @module coreos/appearance/storage
 */

import { type AppearanceState, DEFAULT_APPEARANCE, APPEARANCE_STORAGE_KEY } from './types';

export function loadAppearance(): AppearanceState {
    if (typeof window === 'undefined') return DEFAULT_APPEARANCE;
    try {
        const raw = localStorage.getItem(APPEARANCE_STORAGE_KEY);
        if (!raw) return DEFAULT_APPEARANCE;
        const parsed = JSON.parse(raw) as AppearanceState;
        if (!parsed || typeof parsed.themeMode !== 'string') return DEFAULT_APPEARANCE;
        return { ...DEFAULT_APPEARANCE, ...parsed };
    } catch {
        return DEFAULT_APPEARANCE;
    }
}

export function saveAppearance(state: AppearanceState): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(state));
}
