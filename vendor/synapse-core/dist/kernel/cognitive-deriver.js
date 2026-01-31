"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWindowLifecycleState = getWindowLifecycleState;
exports.deriveCognitiveMode = deriveCognitiveMode;
exports.explainCognitiveMode = explainCognitiveMode;
exports.getActiveWindowIds = getActiveWindowIds;
exports.getMinimizedWindowIds = getMinimizedWindowIds;
exports.getFocusedWindowId = getFocusedWindowId;
exports.isSystemCalm = isSystemCalm;
exports.isSystemFocused = isSystemFocused;
exports.isSystemMultitask = isSystemMultitask;
/**
 * Get lifecycle state of a window
 */
function getWindowLifecycleState(window, focusedWindowId) {
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
function deriveCognitiveMode(state) {
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
function explainCognitiveMode(state) {
    const windows = Object.values(state.windows);
    const activeWindowCount = windows.filter(w => w.state === 'active').length;
    const mode = deriveCognitiveMode(state);
    let reason;
    switch (mode) {
        case 'calm':
            if (state.focusedWindowId === null) {
                reason = 'No window has focus';
            }
            else if (activeWindowCount === 0) {
                reason = 'All windows are minimized';
            }
            else {
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
function getActiveWindowIds(state) {
    return Object.values(state.windows)
        .filter(w => w.state === 'active')
        .map(w => w.id);
}
/**
 * Get all window IDs in minimized state
 */
function getMinimizedWindowIds(state) {
    return Object.values(state.windows)
        .filter(w => w.state === 'minimized')
        .map(w => w.id);
}
/**
 * Get the focused window ID (if any active window has focus)
 */
function getFocusedWindowId(state) {
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
function isSystemCalm(state) {
    return deriveCognitiveMode(state) === 'calm';
}
/**
 * Check if system is in focused state (derived)
 */
function isSystemFocused(state) {
    return deriveCognitiveMode(state) === 'focused';
}
/**
 * Check if system is in multitask state (derived)
 */
function isSystemMultitask(state) {
    return deriveCognitiveMode(state) === 'multitask';
}
//# sourceMappingURL=cognitive-deriver.js.map