/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CORE OS — Drag & Drop Types (Phase 19)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Canonical payload types for deterministic drag & drop operations.
 * All drag events flow through the Phase 18.5 EventBus.
 *
 * @module coreos/dnd/dragTypes
 */

import type { CapabilityId } from '@/coreos/types';

// ─── Drag Item Types ───────────────────────────────────────────────────

/** What is being dragged */
export type DragItemType = 'file' | 'capability' | 'window';

// ─── Drag Payload ──────────────────────────────────────────────────────

/** File reference (VFS path) */
export interface DragFileRef {
    readonly path: string;
    readonly name: string;
    readonly mime?: string;
    readonly size?: number;
}

/** Canonical drag payload — one of file, capability, or window */
export interface DragPayload {
    /** What type of item is being dragged */
    readonly type: DragItemType;

    /** File reference (when type='file') */
    readonly fileRef?: DragFileRef;

    /** Capability identifier (when type='capability') */
    readonly capabilityId?: CapabilityId;

    /** Window identifier (when type='window') */
    readonly windowId?: string;

    /** Source app that initiated the drag */
    readonly sourceAppId: string;

    /** Human-readable label for drag preview */
    readonly label: string;

    /** Emoji icon for drag preview */
    readonly icon?: string;
}

// ─── Drag Phase ────────────────────────────────────────────────────────

export type DragPhase = 'idle' | 'dragging' | 'over' | 'dropped' | 'cancelled';

// ─── Drop Result ───────────────────────────────────────────────────────

export interface DropResult {
    /** Target zone that accepted the drop */
    readonly zoneId: string;

    /** Position of drop (relative to zone) */
    readonly position: { x: number; y: number };

    /** Whether VFS was required but locked */
    readonly vfsLocked?: boolean;
}

// ─── Drop Zone Config ──────────────────────────────────────────────────

export interface DropZoneConfig {
    /** Unique zone identifier */
    readonly zoneId: string;

    /** What item types this zone accepts */
    readonly accepts: readonly DragItemType[];

    /** Handle the drop — return true if accepted */
    readonly onDrop: (payload: DragPayload, position: { x: number; y: number }) => boolean;

    /** Optional: validate before accepting */
    readonly canDrop?: (payload: DragPayload) => boolean;
}
