/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CORE OS — Spaces Storage Adapter (Phase 20)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * SSR-safe localStorage adapter for space records.
 * Write methods are called ONLY by the apply layer.
 *
 * @module coreos/spaces/storage
 */

import { type SpaceRecord, DEFAULT_SPACE_RECORD, SPACES_STORAGE_KEY } from './types';

// ─── Read ──────────────────────────────────────────────────────────────

export function loadSpaces(): SpaceRecord[] {
    if (typeof window === 'undefined') return [DEFAULT_SPACE_RECORD];
    try {
        const raw = localStorage.getItem(SPACES_STORAGE_KEY);
        if (!raw) return [DEFAULT_SPACE_RECORD];
        const parsed = JSON.parse(raw) as SpaceRecord[];
        if (!Array.isArray(parsed) || parsed.length === 0) return [DEFAULT_SPACE_RECORD];
        return parsed;
    } catch {
        return [DEFAULT_SPACE_RECORD];
    }
}

// ─── Write (Apply Layer Only) ──────────────────────────────────────────

export function saveSpaces(spaces: SpaceRecord[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(SPACES_STORAGE_KEY, JSON.stringify(spaces));
}

export function upsertSpace(space: SpaceRecord): SpaceRecord[] {
    const spaces = loadSpaces();
    const idx = spaces.findIndex(s => s.id === space.id);
    if (idx >= 0) {
        spaces[idx] = space;
    } else {
        spaces.push(space);
    }
    saveSpaces(spaces);
    return spaces;
}

export function removeSpaceById(spaceId: string): SpaceRecord[] {
    const spaces = loadSpaces().filter(s => s.id !== spaceId);
    // Ensure default space always exists
    if (spaces.length === 0) {
        spaces.push(DEFAULT_SPACE_RECORD);
    }
    saveSpaces(spaces);
    return spaces;
}
