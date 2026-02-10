/**
 * ═══════════════════════════════════════════════════════════════════════════
 * useContextMenu — Phase 13: Context Menu Hook
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Manages context menu state — position, items, visibility.
 * Prevents native context menu and shows custom OS menu.
 * 
 * @module components/os-shell/hooks/useContextMenu
 * @version 1.0.0 (Phase 13)
 */

'use client';

import { useState, useCallback } from 'react';
import type { ContextMenuEntry } from '../ContextMenu';

interface ContextMenuState {
    isOpen: boolean;
    x: number;
    y: number;
    items: ContextMenuEntry[];
}

const INITIAL_STATE: ContextMenuState = {
    isOpen: false,
    x: 0,
    y: 0,
    items: [],
};

/**
 * Hook to manage context menu state.
 * 
 * Usage:
 * ```tsx
 * const { menuState, showMenu, hideMenu } = useContextMenu();
 * 
 * <div onContextMenu={(e) => showMenu(e, items)} />
 * {menuState.isOpen && <ContextMenu {...menuState} onClose={hideMenu} />}
 * ```
 */
export function useContextMenu() {
    const [menuState, setMenuState] = useState<ContextMenuState>(INITIAL_STATE);

    const showMenu = useCallback((e: React.MouseEvent, items: ContextMenuEntry[]) => {
        e.preventDefault();
        e.stopPropagation();
        setMenuState({
            isOpen: true,
            x: e.clientX,
            y: e.clientY,
            items,
        });
    }, []);

    const hideMenu = useCallback(() => {
        setMenuState(INITIAL_STATE);
    }, []);

    return { menuState, showMenu, hideMenu };
}
