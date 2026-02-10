/**
 * ═══════════════════════════════════════════════════════════════════════════
 * useWindowDrag — Phase 13.1: Window Drag Hook (Hotfix)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Enables dragging windows by their title bar.
 * 
 * Phase 13.1 Hotfix: Bypasses frozen moveWindow() Y-clamp (max 600px)
 * by dispatching WINDOW_MOVE directly to state store with dynamic
 * viewport-based bounds. This respects the Fix Patch Protocol.
 * 
 * @module components/os-shell/hooks/useWindowDrag
 * @version 1.1.0 (Phase 13.1 Hotfix)
 */

'use client';

import { useCallback, useRef, useEffect } from 'react';
import { getStateStore, createCorrelationId } from '@/governance/synapse';

interface DragState {
    isDragging: boolean;
    startX: number;
    startY: number;
    windowStartX: number;
    windowStartY: number;
}

// Menubar height constant (matches --nx-menubar-height)
const MENUBAR_HEIGHT = 28;
// Minimum visible title bar pixels that must remain on screen
const MIN_VISIBLE_PX = 100;

/**
 * Custom hook for window drag interaction.
 * 
 * @param windowId - The window to drag
 * @param windowX - Current window X position
 * @param windowY - Current window Y position
 * @param isMaximized - Whether the window is maximized (blocks drag)
 * @returns onMouseDown handler to attach to the title bar
 */
export function useWindowDrag(
    windowId: string,
    windowX: number,
    windowY: number,
    isMaximized: boolean,
) {
    const dragState = useRef<DragState>({
        isDragging: false,
        startX: 0,
        startY: 0,
        windowStartX: 0,
        windowStartY: 0,
    });

    // Keep current window position in ref for use in handlers
    const currentPos = useRef({ x: windowX, y: windowY });
    currentPos.current = { x: windowX, y: windowY };

    const onMouseMove = useCallback((e: MouseEvent) => {
        if (!dragState.current.isDragging) return;

        const dx = e.clientX - dragState.current.startX;
        const dy = e.clientY - dragState.current.startY;

        const newX = dragState.current.windowStartX + dx;
        const newY = dragState.current.windowStartY + dy;

        // Phase 13.1 Hotfix: Dynamic viewport-based clamp
        // instead of frozen moveWindow() hardcoded clampedY max 600px
        const viewportH = window.innerHeight;
        const viewportW = window.innerWidth;
        const clampedX = Math.max(-viewportW + MIN_VISIBLE_PX, Math.min(newX, viewportW - MIN_VISIBLE_PX));
        const clampedY = Math.max(MENUBAR_HEIGHT, Math.min(newY, viewportH - MIN_VISIBLE_PX));

        // Dispatch directly to state store to bypass frozen moveWindow() clamp
        const store = getStateStore();
        store.dispatch({
            type: 'WINDOW_MOVE',
            windowId,
            x: clampedX,
            y: clampedY,
            correlationId: createCorrelationId(),
        });
    }, [windowId]);

    const onMouseUp = useCallback(() => {
        dragState.current.isDragging = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    }, [onMouseMove]);

    const onTitleBarMouseDown = useCallback((e: React.MouseEvent) => {
        // Don't drag if maximized or if clicking on buttons
        if (isMaximized) return;
        if ((e.target as HTMLElement).closest('button')) return;

        e.preventDefault();

        dragState.current = {
            isDragging: true,
            startX: e.clientX,
            startY: e.clientY,
            windowStartX: currentPos.current.x,
            windowStartY: currentPos.current.y,
        };

        document.body.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }, [isMaximized, onMouseMove, onMouseUp]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
    }, [onMouseMove, onMouseUp]);

    return { onTitleBarMouseDown };
}
