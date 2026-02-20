/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CORE OS — Drag Context Provider (Phase 19)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * React Context for OS-level drag & drop state.
 * Publishes drag lifecycle events to the Phase 18.5 EventBus.
 *
 * Usage:
 *   <DragProvider>
 *     <OSShell />
 *   </DragProvider>
 *
 * @module coreos/dnd/DragContext
 */

'use client';

import React, { createContext, useContext, useCallback, useState, useRef } from 'react';
import type { DragPayload, DragPhase, DropResult } from './dragTypes';
import { publish } from '@/coreos/events/bus';

// ─── Context Shape ─────────────────────────────────────────────────────

interface DragContextValue {
    /** Current drag phase */
    phase: DragPhase;

    /** Current drag payload (null when idle) */
    payload: DragPayload | null;

    /** Start a drag operation */
    startDrag: (payload: DragPayload) => void;

    /** End drag (successful drop) */
    endDrag: (result: DropResult) => void;

    /** Cancel drag (ESC or drop outside) */
    cancelDrag: (reason?: string) => void;
}

const DragCtx = createContext<DragContextValue | null>(null);

// ─── Hook ──────────────────────────────────────────────────────────────

/** No-op context for SSR and components outside DragProvider */
const NOOP_CONTEXT: DragContextValue = {
    phase: 'idle',
    payload: null,
    startDrag: () => { },
    endDrag: () => { },
    cancelDrag: () => { },
};

/**
 * Access drag state from any component.
 * Returns no-op defaults during SSR or when outside DragProvider.
 */
export function useDragContext(): DragContextValue {
    const ctx = useContext(DragCtx);
    return ctx ?? NOOP_CONTEXT;
}

// ─── Provider ──────────────────────────────────────────────────────────

export function DragProvider({ children }: { children: React.ReactNode }) {
    const [phase, setPhase] = useState<DragPhase>('idle');
    const [payload, setPayload] = useState<DragPayload | null>(null);
    const payloadRef = useRef<DragPayload | null>(null);

    const startDrag = useCallback((p: DragPayload) => {
        payloadRef.current = p;
        setPayload(p);
        setPhase('dragging');

        publish({
            type: 'drag.started',
            domain: 'ui',
            source: { appId: p.sourceAppId, module: 'dnd' },
            severity: 'info',
            dedupeKey: `drag.started:${p.type}:${p.sourceAppId}`,
            payload: {
                itemType: p.type,
                sourceAppId: p.sourceAppId,
                label: p.label,
                fileRef: p.fileRef,
                capabilityId: p.capabilityId,
                windowId: p.windowId,
            },
        });
    }, []);

    const endDrag = useCallback((result: DropResult) => {
        const p = payloadRef.current;

        publish({
            type: 'drag.dropped',
            domain: 'ui',
            source: { appId: p?.sourceAppId ?? 'unknown', module: 'dnd' },
            severity: 'info',
            dedupeKey: `drag.dropped:${p?.type}:${result.zoneId}`,
            payload: {
                itemType: p?.type,
                sourceAppId: p?.sourceAppId,
                targetZoneId: result.zoneId,
                position: result.position,
                vfsLocked: result.vfsLocked,
            },
        });

        payloadRef.current = null;
        setPayload(null);
        setPhase('idle');
    }, []);

    const cancelDrag = useCallback((reason?: string) => {
        const p = payloadRef.current;

        publish({
            type: 'drag.cancelled',
            domain: 'ui',
            source: { appId: p?.sourceAppId ?? 'unknown', module: 'dnd' },
            severity: 'info',
            dedupeKey: `drag.cancelled:${p?.type}:${p?.sourceAppId}`,
            payload: {
                itemType: p?.type,
                sourceAppId: p?.sourceAppId,
                reason: reason ?? 'user_cancel',
            },
        });

        payloadRef.current = null;
        setPayload(null);
        setPhase('idle');
    }, []);

    const value: DragContextValue = {
        phase,
        payload,
        startDrag,
        endDrag,
        cancelDrag,
    };

    return (
        <DragCtx.Provider value={value}>
            {children}
        </DragCtx.Provider>
    );
}
