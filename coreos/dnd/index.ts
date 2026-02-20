/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CORE OS — Drag & Drop Barrel (Phase 19)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Central export point for all DnD primitives.
 *
 * @module coreos/dnd
 */

// Types
export type {
    DragItemType,
    DragFileRef,
    DragPayload,
    DragPhase,
    DropResult,
    DropZoneConfig,
} from './dragTypes';

// Context
export { DragProvider, useDragContext } from './DragContext';

// Hooks
export { useDropZone } from './useDropZone';
