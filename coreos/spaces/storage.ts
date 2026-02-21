/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CORE OS — Spaces Storage Adapter (Phase 20 / 20.5)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * SSR-safe localStorage adapter for space records.
 * Write methods are called ONLY by the apply layer.
 *
 * @module coreos/spaces/storage
 */

import { type SpaceRecord, DEFAULT_SPACE_RECORD, SPACES_STORAGE_KEY, ACTIVE_SPACE_KEY } from './types';

// ─── Read ──────────────────────────────────────────────────────────────

export function loadSpaces(): SpaceRecord[] {
    if (typeof window === 'undefined') return [DEFAULT_SPACE_RECORD];
    try {
        const raw = localStorage.getItem(SPACES_STORAGE_KEY);
        if (!raw) return [DEFAULT_SPACE_RECORD];
        const parsed = JSON.parse(raw) as SpaceRecord[];
        if (!Array.isArray(parsed) || parsed.length === 0) return [DEFAULT_SPACE_RECORD];
        // Phase 20.5: Sort by order
        return parsed.sort((a, b) => a.order - b.order);
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

// ─── Phase 20.5: Rename ────────────────────────────────────────────────

export function renameSpaceById(spaceId: string, name: string): SpaceRecord[] {
    const spaces = loadSpaces();
    const idx = spaces.findIndex(s => s.id === spaceId);
    if (idx >= 0) {
        spaces[idx] = { ...spaces[idx], name, updatedAt: new Date().toISOString() };
    }
    saveSpaces(spaces);
    return spaces;
}

// ─── Phase 20.5: Reorder ───────────────────────────────────────────────

export function reorderSpaces(orderedIds: string[]): SpaceRecord[] {
    const spaces = loadSpaces();
    const reordered = orderedIds
        .map((id, i) => {
            const s = spaces.find(sp => sp.id === id);
            return s ? { ...s, order: i, updatedAt: new Date().toISOString() } : null;
        })
        .filter(Boolean) as SpaceRecord[];
    // Add any spaces not in orderedIds at the end
    const remaining = spaces.filter(s => !orderedIds.includes(s.id));
    const merged = [...reordered, ...remaining.map((s, i) => ({ ...s, order: reordered.length + i }))];
    saveSpaces(merged);
    return merged;
}

// ─── Phase 20.5: Active Space ID persistence ──────────────────────────

export function loadActiveSpaceId(): string {
    if (typeof window === 'undefined') return 'space:default';
    return localStorage.getItem(ACTIVE_SPACE_KEY) || 'space:default';
}

export function saveActiveSpaceId(spaceId: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(ACTIVE_SPACE_KEY, spaceId);
}
