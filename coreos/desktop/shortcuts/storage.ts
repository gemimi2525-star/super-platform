/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CORE OS — Desktop Shortcut Storage (Phase 19.5)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * localStorage adapter for desktop shortcuts.
 * ⚠️ ONLY the Apply Layer may call write methods.
 * UI code must NEVER import this directly.
 *
 * @module coreos/desktop/shortcuts/storage
 */

import type { DesktopShortcut } from './types';

const STORAGE_KEY = 'coreos.desktop.shortcuts.v2';

// ─── SSR Guard ─────────────────────────────────────────────────────────

function isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

// ─── Read ──────────────────────────────────────────────────────────────

export function loadShortcuts(): DesktopShortcut[] {
    if (!isBrowser()) return [];
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed as DesktopShortcut[];
    } catch {
        return [];
    }
}

// ─── Write (Apply Layer ONLY) ──────────────────────────────────────────

export function saveShortcuts(shortcuts: DesktopShortcut[]): void {
    if (!isBrowser()) return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(shortcuts));
    } catch {
        console.warn('[shortcuts/storage] Failed to persist shortcuts');
    }
}

export function upsertShortcut(shortcut: DesktopShortcut): void {
    const current = loadShortcuts();
    const idx = current.findIndex(s => s.id === shortcut.id);
    if (idx >= 0) {
        current[idx] = shortcut;
    } else {
        current.push(shortcut);
    }
    saveShortcuts(current);
}

export function removeShortcutById(id: string): void {
    const current = loadShortcuts();
    const next = current.filter(s => s.id !== id);
    saveShortcuts(next);
}
