/**
 * ═══════════════════════════════════════════════════════════════════════════
 * OS SHELL — Persistence (V1)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Persist and restore OS Shell state via localStorage.
 * Product-level only — does NOT touch kernel state.
 * 
 * @module components/os-shell/shell-persistence
 * @version 1.0.0
 */

import type { Window } from '@/governance/synapse';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface WindowSnapshot {
    id: string;
    capabilityId: string;
    title: string;
    state: 'active' | 'minimized' | 'hidden';
    zIndex: number;
    bounds: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}

export interface ShellSnapshot {
    version: 1;
    savedAt: number;
    focusedWindowId: string | null;
    activeSpaceId: string | null;
    windows: WindowSnapshot[];
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const STORAGE_KEY_PREFIX = 'apicoredata:coreos:shell:v1';
const DEBOUNCE_MS = 300;
const CURRENT_VERSION = 1;

// Default bounds for new windows
const DEFAULT_BOUNDS = {
    x: 120,
    y: 80,
    width: 520,
    height: 380,
};

// ═══════════════════════════════════════════════════════════════════════════
// STORAGE KEY
// ═══════════════════════════════════════════════════════════════════════════

function getStorageKey(userId: string): string {
    return `${STORAGE_KEY_PREFIX}:${userId}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// SERIALIZE / DESERIALIZE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Serialize windows to stable JSON (deterministic key order)
 */
export function serializeSnapshot(
    windows: Record<string, Window>,
    focusedWindowId: string | null,
    activeSpaceId: string | null = null
): ShellSnapshot {
    // Sort windows by id for deterministic output
    const sortedWindows = Object.values(windows)
        .sort((a, b) => a.id.localeCompare(b.id))
        .map((w): WindowSnapshot => ({
            id: w.id,
            capabilityId: w.capabilityId,
            title: w.title,
            state: w.state,
            zIndex: w.zIndex,
            bounds: {
                x: DEFAULT_BOUNDS.x + (w.zIndex * 30),
                y: DEFAULT_BOUNDS.y + (w.zIndex * 30),
                width: DEFAULT_BOUNDS.width,
                height: DEFAULT_BOUNDS.height,
            },
        }));

    return {
        version: CURRENT_VERSION,
        savedAt: Date.now(),
        focusedWindowId,
        activeSpaceId,
        windows: sortedWindows,
    };
}

/**
 * Deserialize snapshot from JSON string
 */
export function deserializeSnapshot(json: string): ShellSnapshot | null {
    try {
        const parsed = JSON.parse(json);

        // Validate version
        if (parsed.version !== CURRENT_VERSION) {
            console.warn('[ShellPersistence] Version mismatch, ignoring snapshot');
            return null;
        }

        // Validate structure
        if (!parsed.windows || !Array.isArray(parsed.windows)) {
            console.warn('[ShellPersistence] Invalid snapshot structure');
            return null;
        }

        return parsed as ShellSnapshot;
    } catch (e) {
        console.warn('[ShellPersistence] Failed to parse snapshot:', e);
        return null;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// SAVE / LOAD
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Save shell state to localStorage
 */
export function saveSnapshot(
    userId: string,
    windows: Record<string, Window>,
    focusedWindowId: string | null,
    activeSpaceId: string | null = null
): void {
    if (typeof window === 'undefined') return;

    const snapshot = serializeSnapshot(windows, focusedWindowId, activeSpaceId);
    const key = getStorageKey(userId);

    try {
        localStorage.setItem(key, JSON.stringify(snapshot));
    } catch (e) {
        console.error('[ShellPersistence] Failed to save:', e);
    }
}

/**
 * Load shell state from localStorage
 */
export function loadSnapshot(userId: string): ShellSnapshot | null {
    if (typeof window === 'undefined') return null;

    const key = getStorageKey(userId);

    try {
        const json = localStorage.getItem(key);
        if (!json) return null;
        return deserializeSnapshot(json);
    } catch (e) {
        console.error('[ShellPersistence] Failed to load:', e);
        return null;
    }
}

/**
 * Clear saved snapshot
 */
export function clearSnapshot(userId: string): void {
    if (typeof window === 'undefined') return;

    const key = getStorageKey(userId);

    try {
        localStorage.removeItem(key);
    } catch (e) {
        console.error('[ShellPersistence] Failed to clear:', e);
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// DEBOUNCED SAVE
// ═══════════════════════════════════════════════════════════════════════════

let saveTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * Save with debounce to avoid excessive writes
 */
export function debouncedSave(
    userId: string,
    windows: Record<string, Window>,
    focusedWindowId: string | null,
    activeSpaceId: string | null = null
): void {
    if (saveTimeout) {
        clearTimeout(saveTimeout);
    }

    saveTimeout = setTimeout(() => {
        saveSnapshot(userId, windows, focusedWindowId, activeSpaceId);
        saveTimeout = null;
    }, DEBOUNCE_MS);
}

// ═══════════════════════════════════════════════════════════════════════════
// BOUNDS SAFETY (V4)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Clamp bounds to ensure window is visible on screen
 */
export function clampBounds(bounds: WindowSnapshot['bounds']): WindowSnapshot['bounds'] {
    if (typeof window === 'undefined') return bounds;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const minVisibleArea = 50; // Must be able to see at least 50px

    let { x, y, width, height } = bounds;

    // Clamp width/height to reasonable values
    width = Math.min(Math.max(200, width), viewportWidth - 40);
    height = Math.min(Math.max(150, height), viewportHeight - 100);

    // Clamp x to ensure titlebar is accessible
    x = Math.max(0, Math.min(x, viewportWidth - minVisibleArea));

    // Clamp y to ensure titlebar is below menu bar (28px) and above dock
    const menubarHeight = 28;
    const dockHeight = 80;
    y = Math.max(menubarHeight + 10, Math.min(y, viewportHeight - dockHeight - minVisibleArea));

    return { x, y, width, height };
}

/**
 * Apply bounds safety to entire snapshot
 */
export function sanitizeSnapshot(snapshot: ShellSnapshot): ShellSnapshot {
    return {
        ...snapshot,
        windows: snapshot.windows.map(w => ({
            ...w,
            bounds: clampBounds(w.bounds),
        })),
    };
}
