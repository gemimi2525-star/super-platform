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
export type WindowLifecycleState = 'active' | 'focused' | 'minimized' | 'hidden';
/**
 * Get lifecycle state of a window
 */
export declare function getWindowLifecycleState(window: Window, focusedWindowId: string | null): WindowLifecycleState;
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
export declare function deriveCognitiveMode(state: SystemState): CognitiveMode;
/**
 * Explain why system is in a particular cognitive mode
 */
export declare function explainCognitiveMode(state: SystemState): {
    mode: CognitiveMode;
    reason: string;
    activeWindowCount: number;
    focusedWindowId: string | null;
};
/**
 * Get all window IDs in active state
 */
export declare function getActiveWindowIds(state: SystemState): readonly string[];
/**
 * Get all window IDs in minimized state
 */
export declare function getMinimizedWindowIds(state: SystemState): readonly string[];
/**
 * Get the focused window ID (if any active window has focus)
 */
export declare function getFocusedWindowId(state: SystemState): string | null;
/**
 * Check if system is in calm state (derived)
 */
export declare function isSystemCalm(state: SystemState): boolean;
/**
 * Check if system is in focused state (derived)
 */
export declare function isSystemFocused(state: SystemState): boolean;
/**
 * Check if system is in multitask state (derived)
 */
export declare function isSystemMultitask(state: SystemState): boolean;
//# sourceMappingURL=cognitive-deriver.d.ts.map