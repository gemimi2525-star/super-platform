/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CORE OS — Drop Zone Hook (Phase 19)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * React hook for creating drop targets.
 * Validates payload type, manages hover state, handles drop acceptance.
 *
 * Usage:
 *   const { dropRef, isOver, canDrop } = useDropZone({
 *     zoneId: 'desktop',
 *     accepts: ['capability', 'file'],
 *     onDrop: (payload, position) => { ... return true; },
 *   });
 *   <div ref={dropRef} ...>
 *
 * @module coreos/dnd/useDropZone
 */

'use client';

import { useCallback, useRef, useState } from 'react';
import type { DragPayload, DropZoneConfig } from './dragTypes';
import { useDragContext } from './DragContext';

// ─── Return Type ───────────────────────────────────────────────────────

interface DropZoneResult {
    /** Ref to attach to the drop target DOM element */
    dropRef: React.RefCallback<HTMLElement>;

    /** Whether a valid drag is hovering over this zone */
    isOver: boolean;

    /** Whether the current drag payload can be dropped here */
    canDrop: boolean;

    /** DOM event handlers to spread on the drop target */
    handlers: {
        onDragOver: (e: React.DragEvent) => void;
        onDragEnter: (e: React.DragEvent) => void;
        onDragLeave: (e: React.DragEvent) => void;
        onDrop: (e: React.DragEvent) => void;
    };
}

// ─── Hook ──────────────────────────────────────────────────────────────

export function useDropZone(config: DropZoneConfig): DropZoneResult {
    const { phase, payload, endDrag } = useDragContext();
    const [isOver, setIsOver] = useState(false);
    const elementRef = useRef<HTMLElement | null>(null);
    const enterCountRef = useRef(0);

    // Check if current payload can be dropped here
    const canDrop = (() => {
        if (phase !== 'dragging' || !payload) return false;
        if (!config.accepts.includes(payload.type)) return false;
        if (config.canDrop && !config.canDrop(payload)) return false;
        return true;
    })();

    const dropRef = useCallback((el: HTMLElement | null) => {
        elementRef.current = el;
    }, []);

    const onDragOver = useCallback((e: React.DragEvent) => {
        if (!canDrop) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }, [canDrop]);

    const onDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        enterCountRef.current++;
        if (enterCountRef.current === 1) {
            setIsOver(true);
        }
    }, []);

    const onDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        enterCountRef.current--;
        if (enterCountRef.current <= 0) {
            enterCountRef.current = 0;
            setIsOver(false);
        }
    }, []);

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        enterCountRef.current = 0;
        setIsOver(false);

        if (!payload || !canDrop) return;

        const rect = elementRef.current?.getBoundingClientRect();
        const position = {
            x: rect ? e.clientX - rect.left : e.clientX,
            y: rect ? e.clientY - rect.top : e.clientY,
        };

        const accepted = config.onDrop(payload, position);

        if (accepted) {
            endDrag({
                zoneId: config.zoneId,
                position,
            });
        }
    }, [payload, canDrop, config, endDrag]);

    return {
        dropRef,
        isOver,
        canDrop,
        handlers: {
            onDragOver,
            onDragEnter,
            onDragLeave,
            onDrop,
        },
    };
}
