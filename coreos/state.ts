/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CORE OS KERNEL — System State (HARDENED)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Single source of truth for entire system.
 * Pure reducer with NO side effects.
 * 
 * @module coreos/state
 * @version 2.0.0 (Hardened)
 */

import type {
    SystemState,
    SecurityContext,
    Window,
    CognitiveMode,
    CapabilityId,
    PendingStepUp,
    CorrelationId,
    SpaceId,
} from './types';
import { DEFAULT_SPACE_ID } from './types';

// ═══════════════════════════════════════════════════════════════════════════
// INITIAL STATE
// ═══════════════════════════════════════════════════════════════════════════

export const INITIAL_SECURITY_CONTEXT: SecurityContext = {
    authenticated: false,
    userId: null,
    role: 'guest',
    stepUpActive: false,
    stepUpExpiry: null,
    policies: [],
};

export const INITIAL_STATE: SystemState = {
    windows: {},
    windowOrder: [],
    focusedWindowId: null,
    activeSpaceId: DEFAULT_SPACE_ID,  // Phase L
    processes: {},
    activeCapabilities: [],
    contextStack: ['core.finder'],
    cognitiveMode: 'calm',
    security: INITIAL_SECURITY_CONTEXT,
    pendingStepUp: null,
};

// ═══════════════════════════════════════════════════════════════════════════
// STATE ACTIONS (Strictly Typed)
// ═══════════════════════════════════════════════════════════════════════════

export type StateAction =
    | { type: 'WINDOW_CREATE'; window: Window; correlationId: CorrelationId }
    | { type: 'WINDOW_CLOSE'; windowId: string; correlationId: CorrelationId }
    | { type: 'WINDOW_FOCUS'; windowId: string; correlationId: CorrelationId }
    | { type: 'WINDOW_MINIMIZE'; windowId: string; correlationId: CorrelationId }
    | { type: 'WINDOW_RESTORE'; windowId: string; correlationId: CorrelationId }
    | { type: 'WINDOW_MINIMIZE_ALL'; correlationId: CorrelationId }
    | { type: 'CAPABILITY_ACTIVATE'; capabilityId: CapabilityId; correlationId: CorrelationId }
    | { type: 'CAPABILITY_DEACTIVATE'; capabilityId: CapabilityId; correlationId: CorrelationId }
    | { type: 'COGNITIVE_MODE_SET'; mode: CognitiveMode; correlationId: CorrelationId }
    | { type: 'SECURITY_SET'; security: SecurityContext; correlationId: CorrelationId }
    | { type: 'STEP_UP_PENDING'; pending: PendingStepUp }
    | { type: 'STEP_UP_CLEAR'; correlationId: CorrelationId }
    | { type: 'STEP_UP_ACTIVATE'; expiry: number; correlationId: CorrelationId }
    | { type: 'CONTEXT_PUSH'; capabilityId: CapabilityId; correlationId: CorrelationId }
    | { type: 'CONTEXT_POP'; correlationId: CorrelationId }
    // Phase L: Virtual Spaces
    | { type: 'SPACE_SWITCH'; spaceId: SpaceId; correlationId: CorrelationId }
    | { type: 'WINDOW_MOVE_TO_SPACE'; windowId: string; spaceId: SpaceId; correlationId: CorrelationId };

// ═══════════════════════════════════════════════════════════════════════════
// PURE REDUCER (No Side Effects)
// ═══════════════════════════════════════════════════════════════════════════

export function systemReducer(state: SystemState, action: StateAction): SystemState {
    switch (action.type) {
        case 'WINDOW_CREATE': {
            const maxZ = Math.max(0, ...Object.values(state.windows).map(w => w.zIndex));
            const newWindow: Window = {
                ...action.window,
                zIndex: maxZ + 1,
            };
            return {
                ...state,
                windows: { ...state.windows, [newWindow.id]: newWindow },
                windowOrder: [...state.windowOrder, newWindow.id],
                focusedWindowId: newWindow.id,
            };
        }

        case 'WINDOW_CLOSE': {
            const { [action.windowId]: removed, ...remaining } = state.windows;
            if (!removed) return state;

            const newOrder = state.windowOrder.filter(id => id !== action.windowId);
            const newFocused = state.focusedWindowId === action.windowId
                ? newOrder[newOrder.length - 1] ?? null
                : state.focusedWindowId;

            return {
                ...state,
                windows: remaining,
                windowOrder: newOrder,
                focusedWindowId: newFocused,
            };
        }

        case 'WINDOW_FOCUS': {
            const window = state.windows[action.windowId];
            if (!window) return state;

            const maxZ = Math.max(0, ...Object.values(state.windows).map(w => w.zIndex));
            return {
                ...state,
                windows: {
                    ...state.windows,
                    [action.windowId]: { ...window, zIndex: maxZ + 1, state: 'active' },
                },
                focusedWindowId: action.windowId,
            };
        }

        case 'WINDOW_MINIMIZE': {
            const window = state.windows[action.windowId];
            if (!window) return state;

            const newFocused = state.focusedWindowId === action.windowId
                ? state.windowOrder.filter(id =>
                    id !== action.windowId && state.windows[id]?.state === 'active'
                ).pop() ?? null
                : state.focusedWindowId;

            return {
                ...state,
                windows: {
                    ...state.windows,
                    [action.windowId]: { ...window, state: 'minimized' },
                },
                focusedWindowId: newFocused,
            };
        }

        case 'WINDOW_RESTORE': {
            const window = state.windows[action.windowId];
            if (!window) return state;

            const maxZ = Math.max(0, ...Object.values(state.windows).map(w => w.zIndex));
            return {
                ...state,
                windows: {
                    ...state.windows,
                    [action.windowId]: { ...window, state: 'active', zIndex: maxZ + 1 },
                },
                focusedWindowId: action.windowId,
            };
        }

        case 'WINDOW_MINIMIZE_ALL': {
            const minimizedWindows = Object.fromEntries(
                Object.entries(state.windows).map(([id, w]) => [
                    id,
                    { ...w, state: 'minimized' as const },
                ])
            );
            return {
                ...state,
                windows: minimizedWindows,
                focusedWindowId: null,
            };
        }

        case 'CAPABILITY_ACTIVATE': {
            if (state.activeCapabilities.includes(action.capabilityId)) {
                return state;
            }
            return {
                ...state,
                activeCapabilities: [...state.activeCapabilities, action.capabilityId],
            };
        }

        case 'CAPABILITY_DEACTIVATE': {
            return {
                ...state,
                activeCapabilities: state.activeCapabilities.filter(
                    c => c !== action.capabilityId
                ),
            };
        }

        case 'COGNITIVE_MODE_SET': {
            return {
                ...state,
                cognitiveMode: action.mode,
            };
        }

        case 'SECURITY_SET': {
            return {
                ...state,
                security: action.security,
            };
        }

        case 'STEP_UP_PENDING': {
            return {
                ...state,
                pendingStepUp: action.pending,
            };
        }

        case 'STEP_UP_CLEAR': {
            return {
                ...state,
                pendingStepUp: null,
            };
        }

        case 'STEP_UP_ACTIVATE': {
            return {
                ...state,
                security: {
                    ...state.security,
                    stepUpActive: true,
                    stepUpExpiry: action.expiry,
                },
                pendingStepUp: null,
            };
        }

        case 'CONTEXT_PUSH': {
            return {
                ...state,
                contextStack: [...state.contextStack, action.capabilityId],
            };
        }

        case 'CONTEXT_POP': {
            if (state.contextStack.length <= 1) return state;
            return {
                ...state,
                contextStack: state.contextStack.slice(0, -1),
            };
        }

        // ───────────────────────────────────────────────────────────────────
        // PHASE L: Virtual Spaces
        // ───────────────────────────────────────────────────────────────────

        case 'SPACE_SWITCH': {
            if (state.activeSpaceId === action.spaceId) {
                return state;  // No change if already on this space
            }

            // When switching space, clear focus (new space might have no windows)
            // Focus will be recalculated by cognitive deriver
            return {
                ...state,
                activeSpaceId: action.spaceId,
                focusedWindowId: null,
            };
        }

        case 'WINDOW_MOVE_TO_SPACE': {
            const window = state.windows[action.windowId];
            if (!window || window.spaceId === action.spaceId) {
                return state;  // Window doesn't exist or already in target space
            }

            const newWindow = { ...window, spaceId: action.spaceId };

            // If window was focused and moving to different space, clear focus
            const newFocusedWindowId =
                state.focusedWindowId === action.windowId && action.spaceId !== state.activeSpaceId
                    ? null
                    : state.focusedWindowId;

            return {
                ...state,
                windows: {
                    ...state.windows,
                    [action.windowId]: newWindow,
                },
                focusedWindowId: newFocusedWindowId,
            };
        }

        default:
            return state;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// STATE STORE
// ═══════════════════════════════════════════════════════════════════════════

export class CoreOSStateStore {
    private state: SystemState;
    private listeners: Set<(state: SystemState) => void> = new Set();

    constructor(initial: SystemState = INITIAL_STATE) {
        this.state = initial;
    }

    /**
     * Get current state (immutable)
     */
    getState(): SystemState {
        return this.state;
    }

    /**
     * Dispatch an action
     */
    dispatch(action: StateAction): void {
        const prevState = this.state;
        this.state = systemReducer(this.state, action);

        if (this.state !== prevState) {
            this.notifyListeners();
        }
    }

    /**
     * Subscribe to state changes
     */
    subscribe(listener: (state: SystemState) => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    /**
     * Notify all listeners
     */
    private notifyListeners(): void {
        for (const listener of this.listeners) {
            try {
                listener(this.state);
            } catch (error) {
                console.error('[StateStore] Listener error:', error);
            }
        }
    }

    /**
     * Reset to initial state
     */
    reset(): void {
        this.state = INITIAL_STATE;
        this.notifyListeners();
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON
// ═══════════════════════════════════════════════════════════════════════════

let instance: CoreOSStateStore | null = null;

export function getStateStore(): CoreOSStateStore {
    if (!instance) {
        instance = new CoreOSStateStore();
    }
    return instance;
}

export function resetStateStore(): void {
    if (instance) {
        instance.reset();
    }
    instance = null;
}
