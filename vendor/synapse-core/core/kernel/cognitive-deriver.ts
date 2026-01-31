/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CORE OS KERNEL — Cognitive State Deriver (Phase J)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Pure function to derive cognitive mode from window states.
 * 
 * CANONICAL RULES (Phase J):
 * - calm     → No focused window OR all windows minimized
 * - focused  → Exactly 1 focused window
 * - multitask → 2+ active windows (focused + other active)
 * 
 * cognitiveMode = f(state.windows, state.focusedWindowId)
 * 
 * @module coreos/cognitive-deriver
 * @version 1.0.0 (Phase J)
 */

import type { CognitiveMode, SystemState, Window } from '../types/index.js';

// ═══════════════════════════════════════════════════════════════════════════
// WINDOW LIFECYCLE STATES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Window Lifecycle States (Canonical)
 * 
 * State Transition Diagram:
 * 
 *   created → active → focused → minimized → restored (active) → closed
 *                  ↑                          ↓
 *                  └──────────────────────────┘
 * 
 * Note: 'focused' is not a separate WindowState, but determined by focusedWindowId
 */
export type WindowLifecycleState =
    | 'active'    // Window is visible and usable
    | 'focused'   // Window is active AND has focus (derived)
    | 'minimized' // Window is in dock, not visible
    | 'hidden';   // Window is invisible (rare)

/**
 * Get lifecycle state of a window
 */
export function getWindowLifecycleState(
    window: Window,
    focusedWindowId: string | null
): WindowLifecycleState {
    if (window.state === 'minimized') {
        return 'minimized';
    }
    if (window.state === 'hidden') {
        return 'hidden';
    }
    // window.state === 'active'
    if (window.id === focusedWindowId) {
        return 'focused';
    }
    return 'active';
}

// ═══════════════════════════════════════════════════════════════════════════
// COGNITIVE MODE DERIVATION (Pure Function)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Derive cognitive mode from window states
 * 
 * This is a PURE FUNCTION — no side effects
 * 
 * Rules:
 * 1. calm      → No focused window OR focusedWindowId is null
 * 2. focused   → Exactly 1 active window with focus
 * 3. multitask → 2+ active (non-minimized) windows
 * 
 * @param state System state
 * @returns Derived cognitive mode
 */
export function deriveCognitiveMode(state: SystemState): CognitiveMode {
    const windows = Object.values(state.windows);

    // Count active windows (not minimized, not hidden)
    const activeWindows = windows.filter(w => w.state === 'active');
    const activeCount = activeWindows.length;

    // Check if focused window exists and is valid
    const hasFocusedWindow = state.focusedWindowId !== null
        && state.windows[state.focusedWindowId]
        && state.windows[state.focusedWindowId].state === 'active';

    // Rule 1: No focused window → calm
    if (!hasFocusedWindow) {
        return 'calm';
    }

    // Rule 3: Multiple active windows → multitask
    if (activeCount >= 2) {
        return 'multitask';
    }

    // Rule 2: Exactly 1 active window with focus → focused
    if (activeCount === 1 && hasFocusedWindow) {
        return 'focused';
    }

    // Default fallback (should not reach here)
    return 'calm';
}

/**
 * Explain why system is in a particular cognitive mode
 */
export function explainCognitiveMode(state: SystemState): {
    mode: CognitiveMode;
    reason: string;
    activeWindowCount: number;
    focusedWindowId: string | null;
} {
    const windows = Object.values(state.windows);
    const activeWindowCount = windows.filter(w => w.state === 'active').length;
    const mode = deriveCognitiveMode(state);

    let reason: string;

    switch (mode) {
        case 'calm':
            if (state.focusedWindowId === null) {
                reason = 'No window has focus';
            } else if (activeWindowCount === 0) {
                reason = 'All windows are minimized';
            } else {
                reason = 'Focused window is not active';
            }
            break;
        case 'focused':
            reason = `Single active window focused (${state.focusedWindowId})`;
            break;
        case 'multitask':
            reason = `${activeWindowCount} active windows`;
            break;
        default:
            reason = 'Unknown state';
    }

    return {
        mode,
        reason,
        activeWindowCount,
        focusedWindowId: state.focusedWindowId,
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// WINDOW STATE QUERIES (Helper Functions)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get all window IDs in active state
 */
export function getActiveWindowIds(state: SystemState): readonly string[] {
    return Object.values(state.windows)
        .filter(w => w.state === 'active')
        .map(w => w.id);
}

/**
 * Get all window IDs in minimized state
 */
export function getMinimizedWindowIds(state: SystemState): readonly string[] {
    return Object.values(state.windows)
        .filter(w => w.state === 'minimized')
        .map(w => w.id);
}

/**
 * Get the focused window ID (if any active window has focus)
 */
export function getFocusedWindowId(state: SystemState): string | null {
    if (!state.focusedWindowId) {
        return null;
    }
    const window = state.windows[state.focusedWindowId];
    if (window && window.state === 'active') {
        return state.focusedWindowId;
    }
    return null;
}

/**
 * Check if system is in calm state (derived)
 */
export function isSystemCalm(state: SystemState): boolean {
    return deriveCognitiveMode(state) === 'calm';
}

/**
 * Check if system is in focused state (derived)
 */
export function isSystemFocused(state: SystemState): boolean {
    return deriveCognitiveMode(state) === 'focused';
}

/**
 * Check if system is in multitask state (derived)
 */
export function isSystemMultitask(state: SystemState): boolean {
    return deriveCognitiveMode(state) === 'multitask';
}
