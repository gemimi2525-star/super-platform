"use strict";
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CORE OS KERNEL — Type Definitions (HARDENED)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * STRICT TYPED CONTRACTS
 * - No `any` types
 * - All payloads strictly typed
 * - Events carry correlationId (intent tracing)
 *
 * @module coreos/types
 * @version 2.0.0 (Hardened)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntentFactory = exports.DEFAULT_SPACE_PERMISSIONS = exports.DEFAULT_SPACE_ID = void 0;
exports.createCorrelationId = createCorrelationId;
/**
 * Generate a new correlation ID
 */
function createCorrelationId() {
    return `cid-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
/**
 * Default space ID
 */
exports.DEFAULT_SPACE_ID = 'space:default';
/**
 * Default permissions (allow all)
 */
exports.DEFAULT_SPACE_PERMISSIONS = {
    canAccess: true,
    canOpenWindow: true,
    canFocusWindow: true,
    canMoveWindow: true,
};
// ═══════════════════════════════════════════════════════════════════════════
// INTENT FACTORY (Type-safe intent creation)
// ═══════════════════════════════════════════════════════════════════════════
/**
 * Type-safe intent factory
 * Ensures all intents have correlationId
 */
exports.IntentFactory = {
    openCapability: (capabilityId, contextId) => ({
        type: 'OPEN_CAPABILITY',
        correlationId: createCorrelationId(),
        payload: { capabilityId, contextId },
    }),
    closeWindow: (windowId) => ({
        type: 'CLOSE_WINDOW',
        correlationId: createCorrelationId(),
        payload: { windowId },
    }),
    focusWindow: (windowId) => ({
        type: 'FOCUS_WINDOW',
        correlationId: createCorrelationId(),
        payload: { windowId },
    }),
    minimizeWindow: (windowId) => ({
        type: 'MINIMIZE_WINDOW',
        correlationId: createCorrelationId(),
        payload: { windowId },
    }),
    restoreWindow: (windowId) => ({
        type: 'RESTORE_WINDOW',
        correlationId: createCorrelationId(),
        payload: { windowId },
    }),
    minimizeAll: () => ({
        type: 'MINIMIZE_ALL',
        correlationId: createCorrelationId(),
    }),
    stepUpComplete: (success) => ({
        type: 'STEP_UP_COMPLETE',
        correlationId: createCorrelationId(),
        payload: { success },
    }),
    stepUpCancel: () => ({
        type: 'STEP_UP_CANCEL',
        correlationId: createCorrelationId(),
    }),
    logout: () => ({
        type: 'LOGOUT',
        correlationId: createCorrelationId(),
    }),
    lockScreen: () => ({
        type: 'LOCK_SCREEN',
        correlationId: createCorrelationId(),
    }),
    unlockScreen: () => ({
        type: 'UNLOCK_SCREEN',
        correlationId: createCorrelationId(),
    }),
    // ─────────────────────────────────────────────────────────────────────────
    // PHASE K: Keyboard Shortcut Intent Factories
    // ─────────────────────────────────────────────────────────────────────────
    focusNextWindow: () => ({
        type: 'FOCUS_NEXT_WINDOW',
        correlationId: createCorrelationId(),
    }),
    focusPreviousWindow: () => ({
        type: 'FOCUS_PREVIOUS_WINDOW',
        correlationId: createCorrelationId(),
    }),
    focusWindowByIndex: (index) => ({
        type: 'FOCUS_WINDOW_BY_INDEX',
        correlationId: createCorrelationId(),
        payload: { index },
    }),
    minimizeFocusedWindow: () => ({
        type: 'MINIMIZE_FOCUSED_WINDOW',
        correlationId: createCorrelationId(),
    }),
    restoreLastMinimizedWindow: () => ({
        type: 'RESTORE_LAST_MINIMIZED_WINDOW',
        correlationId: createCorrelationId(),
    }),
    closeFocusedWindow: () => ({
        type: 'CLOSE_FOCUSED_WINDOW',
        correlationId: createCorrelationId(),
    }),
    escapeToCalm: () => ({
        type: 'ESCAPE_TO_CALM',
        correlationId: createCorrelationId(),
    }),
    // ─────────────────────────────────────────────────────────────────────────
    // PHASE L: Virtual Spaces / Contexts
    // ─────────────────────────────────────────────────────────────────────────
    switchSpace: (spaceId) => ({
        type: 'SWITCH_SPACE',
        correlationId: createCorrelationId(),
        payload: { spaceId },
    }),
    moveWindowToSpace: (windowId, spaceId) => ({
        type: 'MOVE_WINDOW_TO_SPACE',
        correlationId: createCorrelationId(),
        payload: { windowId, spaceId },
    }),
    // ─────────────────────────────────────────────────────────────────────────
    // PHASE Q: Restore Intents
    // ─────────────────────────────────────────────────────────────────────────
    restoreActiveSpace: () => ({
        type: 'RESTORE_ACTIVE_SPACE',
        correlationId: createCorrelationId(),
    }),
    restoreWindowById: (windowId) => ({
        type: 'RESTORE_WINDOW_BY_ID',
        correlationId: createCorrelationId(),
        payload: { windowId },
    }),
};
//# sourceMappingURL=index.js.map