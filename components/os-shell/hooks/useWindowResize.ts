/**
 * ═══════════════════════════════════════════════════════════════════════════
 * useWindowResize — Phase 13: Window Resize Hook
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Enables resizing windows from edges and corners (8 directions).
 * Calls WindowManager.resizeWindow() + moveWindow() through governance adapter.
 * 
 * @module components/os-shell/hooks/useWindowResize
 * @version 1.0.0 (Phase 13)
 */

'use client';

import { useCallback, useRef, useEffect } from 'react';
import { getWindowManager, createCorrelationId } from '@/governance/synapse';

export type ResizeDirection = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';

interface ResizeState {
    isResizing: boolean;
    direction: ResizeDirection;
    startX: number;
    startY: number;
    windowStartX: number;
    windowStartY: number;
    windowStartW: number;
    windowStartH: number;
}

const CURSOR_MAP: Record<ResizeDirection, string> = {
    n: 'ns-resize',
    ne: 'nesw-resize',
    e: 'ew-resize',
    se: 'nwse-resize',
    s: 'ns-resize',
    sw: 'nesw-resize',
    w: 'ew-resize',
    nw: 'nwse-resize',
};

/**
 * Custom hook for window resize interaction.
 * 
 * @param windowId - The window to resize
 * @param windowX - Current window X position
 * @param windowY - Current window Y position
 * @param windowW - Current window width
 * @param windowH - Current window height
 * @param minWidth - Minimum width
 * @param minHeight - Minimum height
 * @param isMaximized - Whether the window is maximized
 * @returns onResizeStart handler to attach to resize handles
 */
export function useWindowResize(
    windowId: string,
    windowX: number,
    windowY: number,
    windowW: number,
    windowH: number,
    minWidth: number,
    minHeight: number,
    isMaximized: boolean,
) {
    const resizeState = useRef<ResizeState>({
        isResizing: false,
        direction: 'se',
        startX: 0,
        startY: 0,
        windowStartX: 0,
        windowStartY: 0,
        windowStartW: 0,
        windowStartH: 0,
    });

    const currentBounds = useRef({ x: windowX, y: windowY, w: windowW, h: windowH });
    currentBounds.current = { x: windowX, y: windowY, w: windowW, h: windowH };

    const onMouseMove = useCallback((e: MouseEvent) => {
        if (!resizeState.current.isResizing) return;

        const rs = resizeState.current;
        const dx = e.clientX - rs.startX;
        const dy = e.clientY - rs.startY;
        const dir = rs.direction;

        let newX = rs.windowStartX;
        let newY = rs.windowStartY;
        let newW = rs.windowStartW;
        let newH = rs.windowStartH;

        // East component
        if (dir.includes('e')) {
            newW = Math.max(minWidth, rs.windowStartW + dx);
        }
        // West component
        if (dir.includes('w')) {
            const proposedW = rs.windowStartW - dx;
            if (proposedW >= minWidth) {
                newW = proposedW;
                newX = rs.windowStartX + dx;
            }
        }
        // South component
        if (dir === 's' || dir === 'se' || dir === 'sw') {
            newH = Math.max(minHeight, rs.windowStartH + dy);
        }
        // North component
        if (dir === 'n' || dir === 'ne' || dir === 'nw') {
            const proposedH = rs.windowStartH - dy;
            if (proposedH >= minHeight) {
                newH = proposedH;
                newY = rs.windowStartY + dy;
            }
        }

        const wm = getWindowManager();
        const cid = createCorrelationId();

        // Move if position changed (N/W/NW/SW/NE edges)
        if (newX !== rs.windowStartX || newY !== rs.windowStartY) {
            wm.moveWindow(windowId, newX, newY, cid);
        }

        // Resize
        wm.resizeWindow(windowId, newW, newH, cid);
    }, [windowId, minWidth, minHeight]);

    const onMouseUp = useCallback(() => {
        resizeState.current.isResizing = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    }, [onMouseMove]);

    /**
     * Start resize from a given direction.
     * Attach this to the resize handle's onMouseDown.
     */
    const onResizeStart = useCallback((direction: ResizeDirection, e: React.MouseEvent) => {
        if (isMaximized) return;
        e.preventDefault();
        e.stopPropagation();

        const cur = currentBounds.current;

        resizeState.current = {
            isResizing: true,
            direction,
            startX: e.clientX,
            startY: e.clientY,
            windowStartX: cur.x,
            windowStartY: cur.y,
            windowStartW: cur.w,
            windowStartH: cur.h,
        };

        document.body.style.cursor = CURSOR_MAP[direction];
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

    return { onResizeStart, CURSOR_MAP };
}
