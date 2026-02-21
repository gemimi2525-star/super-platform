/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CORE OS — Virtual Desktop Spaces Types (Phase 20)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Canonical data model for virtual desktop spaces.
 * Uses the kernel's frozen SpaceId type (`space:${string}`).
 *
 * @module coreos/spaces/types
 */

import type { SpaceId } from '@/coreos/types';

// ─── Space Record ──────────────────────────────────────────────────────

/** Persistent metadata for a virtual desktop space */
export interface SpaceRecord {
    readonly id: SpaceId;
    readonly name: string;
    readonly order: number;
    readonly createdAt: string;       // ISO 8601
    readonly updatedAt?: string;      // ISO 8601 (Phase 20.5)
    readonly createdBy: { uid: string };
    readonly traceId: string;
}

// ─── Intent Input Types ────────────────────────────────────────────────

export interface CreateSpaceIntent {
    readonly name: string;
    readonly traceId: string;
}

export interface ActivateSpaceIntent {
    readonly spaceId: SpaceId;
    readonly traceId: string;
}

export interface MoveWindowIntent {
    readonly windowId: string;
    readonly targetSpaceId: SpaceId;
    readonly traceId: string;
}

export interface RemoveSpaceIntent {
    readonly spaceId: SpaceId;
    readonly traceId: string;
}

// ─── Phase 20.5: Rename & Reorder Intents ──────────────────────────────

export interface RenameSpaceIntent {
    readonly spaceId: SpaceId;
    readonly name: string;
    readonly traceId: string;
}

export interface ReorderSpacesIntent {
    readonly orderedIds: SpaceId[];
    readonly traceId: string;
}

// ─── Defaults ──────────────────────────────────────────────────────────

export const DEFAULT_SPACE_RECORD: SpaceRecord = {
    id: 'space:default',
    name: 'Desktop 1',
    order: 0,
    createdAt: new Date(0).toISOString(),
    createdBy: { uid: 'system' },
    traceId: 'boot',
};

// ─── ID Generator ──────────────────────────────────────────────────────

/** Generate a deterministic space ID from a name */
export function generateSpaceId(name: string): SpaceId {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const ts = Date.now().toString(36);
    return `space:${slug}-${ts}` as SpaceId;
}

// ─── Storage Key ───────────────────────────────────────────────────────

export const SPACES_STORAGE_KEY = 'coreos:spaces:v1';
export const ACTIVE_SPACE_KEY = 'coreos:activeSpaceId:v1';
