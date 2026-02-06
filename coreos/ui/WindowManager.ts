/**
 * Window Manager Types & Utilities
 * 
 * Phase 17.1 — Multi-app window management system
 * Provides Z-index, position, focus, and minimize/restore state management.
 * 
 * ADDITIVE to Phase 16 — Runtime Contract v1 remains FROZEN.
 */

import type { AppManifest } from '@/lib/runtime/types';

// ═══════════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════════

export const WINDOW_CONSTANTS = {
    BASE_Z_INDEX: 9000,
    MAX_CONCURRENT_WINDOWS: 10,
    CASCADE_OFFSET_X: 30,
    CASCADE_OFFSET_Y: 30,
    INITIAL_POSITION_X: 100,
    INITIAL_POSITION_Y: 80,
    MAX_CASCADE_STEPS: 10,
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export interface WindowState {
    id: string;                    // Unique window ID (same as PID)
    appId: string;                 // App identifier (e.g., 'os.calculator')
    pid: string;                   // Process ID
    manifest: AppManifest;
    worker: Worker | null;

    // Window state
    zIndex: number;
    focused: boolean;
    minimized: boolean;
    position: { x: number; y: number };
    size: { width: number; height: number };

    // Timestamps
    launchedAt: number;
    lastFocusAt: number;
}

export interface WindowManagerState {
    windows: WindowState[];
    currentMaxZ: number;
    cascadeCount: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// Z-Index Manager
// ═══════════════════════════════════════════════════════════════════════════

export class ZIndexManager {
    private currentMaxZ: number = WINDOW_CONSTANTS.BASE_Z_INDEX;

    getNextZIndex(): number {
        return ++this.currentMaxZ;
    }

    bringToFront(): number {
        return ++this.currentMaxZ;
    }

    reset(): void {
        this.currentMaxZ = WINDOW_CONSTANTS.BASE_Z_INDEX;
    }

    getCurrentMax(): number {
        return this.currentMaxZ;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// Position Manager (Cascade Algorithm)
// ═══════════════════════════════════════════════════════════════════════════

export class PositionManager {
    private cascadeCount: number = 0;

    getNextPosition(): { x: number; y: number } {
        const offset = this.cascadeCount % WINDOW_CONSTANTS.MAX_CASCADE_STEPS;
        this.cascadeCount++;

        return {
            x: WINDOW_CONSTANTS.INITIAL_POSITION_X + (offset * WINDOW_CONSTANTS.CASCADE_OFFSET_X),
            y: WINDOW_CONSTANTS.INITIAL_POSITION_Y + (offset * WINDOW_CONSTANTS.CASCADE_OFFSET_Y),
        };
    }

    reset(): void {
        this.cascadeCount = 0;
    }

    getCascadeCount(): number {
        return this.cascadeCount;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// Window Manager Actions
// ═══════════════════════════════════════════════════════════════════════════

export type WindowAction =
    | { type: 'LAUNCH'; payload: Omit<WindowState, 'zIndex' | 'focused' | 'minimized' | 'position' | 'lastFocusAt'> }
    | { type: 'FOCUS'; windowId: string }
    | { type: 'MINIMIZE'; windowId: string }
    | { type: 'RESTORE'; windowId: string }
    | { type: 'CLOSE'; windowId: string }
    | { type: 'MOVE'; windowId: string; position: { x: number; y: number } }
    | { type: 'RESET' };

export function windowManagerReducer(
    state: WindowManagerState,
    action: WindowAction,
    zIndexManager: ZIndexManager,
    positionManager: PositionManager
): WindowManagerState {
    switch (action.type) {
        case 'LAUNCH': {
            // Check max window limit
            const activeWindows = state.windows.filter(w => !w.minimized || w.worker !== null);
            if (activeWindows.length >= WINDOW_CONSTANTS.MAX_CONCURRENT_WINDOWS) {
                console.warn('[WindowManager] Max concurrent windows reached');
                return state; // Caller should handle this
            }

            const position = positionManager.getNextPosition();
            const zIndex = zIndexManager.getNextZIndex();

            const newWindow: WindowState = {
                ...action.payload,
                zIndex,
                focused: true,
                minimized: false,
                position,
                lastFocusAt: Date.now(),
            };

            // Unfocus all other windows
            const updatedWindows = state.windows.map(w => ({
                ...w,
                focused: false,
            }));

            return {
                ...state,
                windows: [...updatedWindows, newWindow],
                currentMaxZ: zIndex,
                cascadeCount: positionManager.getCascadeCount(),
            };
        }

        case 'FOCUS': {
            const zIndex = zIndexManager.bringToFront();
            return {
                ...state,
                windows: state.windows.map(w => ({
                    ...w,
                    focused: w.id === action.windowId,
                    zIndex: w.id === action.windowId ? zIndex : w.zIndex,
                    lastFocusAt: w.id === action.windowId ? Date.now() : w.lastFocusAt,
                    minimized: w.id === action.windowId ? false : w.minimized, // Restore if minimized
                })),
                currentMaxZ: zIndex,
            };
        }

        case 'MINIMIZE': {
            return {
                ...state,
                windows: state.windows.map(w => ({
                    ...w,
                    minimized: w.id === action.windowId ? true : w.minimized,
                    focused: w.id === action.windowId ? false : w.focused,
                })),
            };
        }

        case 'RESTORE': {
            const zIndex = zIndexManager.bringToFront();
            return {
                ...state,
                windows: state.windows.map(w => ({
                    ...w,
                    minimized: w.id === action.windowId ? false : w.minimized,
                    focused: w.id === action.windowId,
                    zIndex: w.id === action.windowId ? zIndex : w.zIndex,
                    lastFocusAt: w.id === action.windowId ? Date.now() : w.lastFocusAt,
                })),
                currentMaxZ: zIndex,
            };
        }

        case 'CLOSE': {
            const windowToClose = state.windows.find(w => w.id === action.windowId);
            if (windowToClose?.worker) {
                windowToClose.worker.terminate();
            }

            const remainingWindows = state.windows.filter(w => w.id !== action.windowId);

            // Reset Z-index counter if no windows left
            if (remainingWindows.length === 0) {
                zIndexManager.reset();
                positionManager.reset();
            }

            return {
                ...state,
                windows: remainingWindows,
                cascadeCount: remainingWindows.length === 0 ? 0 : state.cascadeCount,
            };
        }

        case 'MOVE': {
            return {
                ...state,
                windows: state.windows.map(w =>
                    w.id === action.windowId
                        ? { ...w, position: action.position }
                        : w
                ),
            };
        }

        case 'RESET': {
            // Terminate all workers
            state.windows.forEach(w => w.worker?.terminate());
            zIndexManager.reset();
            positionManager.reset();
            return {
                windows: [],
                currentMaxZ: WINDOW_CONSTANTS.BASE_Z_INDEX,
                cascadeCount: 0,
            };
        }

        default:
            return state;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════════════════

export function canLaunchNewWindow(state: WindowManagerState): boolean {
    return state.windows.length < WINDOW_CONSTANTS.MAX_CONCURRENT_WINDOWS;
}

export function getActiveWindowCount(state: WindowManagerState): number {
    return state.windows.filter(w => !w.minimized).length;
}

export function getMinimizedWindows(state: WindowManagerState): WindowState[] {
    return state.windows.filter(w => w.minimized);
}

export function getVisibleWindows(state: WindowManagerState): WindowState[] {
    return state.windows.filter(w => !w.minimized);
}

export function getFocusedWindow(state: WindowManagerState): WindowState | null {
    return state.windows.find(w => w.focused) || null;
}

export function createInitialWindowManagerState(): WindowManagerState {
    return {
        windows: [],
        currentMaxZ: WINDOW_CONSTANTS.BASE_Z_INDEX,
        cascadeCount: 0,
    };
}
