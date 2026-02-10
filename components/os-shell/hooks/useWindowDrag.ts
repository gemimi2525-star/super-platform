/**
 * ═══════════════════════════════════════════════════════════════════════════
 * useWindowDrag — Phase 13: Window Drag Hook
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Enables dragging windows by their title bar.
 * Calls WindowManager.moveWindow() through the governance adapter.
 * Uses refs (not state) for tracking to avoid re-renders during drag.
 * 
 * @module components/os-shell/hooks/useWindowDrag
 * @version 1.0.0 (Phase 13)
 */

'use client';

import { useCallback, useRef, useEffect } from 'react';
import { getWindowManager, createCorrelationId } from '@/governance/synapse';

interface DragState {
    isDragging: boolean;
    startX: number;
    startY: number;
    windowStartX: number;
    windowStartY: number;
}

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

        const wm = getWindowManager();
        wm.moveWindow(windowId, newX, newY, createCorrelationId());
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
