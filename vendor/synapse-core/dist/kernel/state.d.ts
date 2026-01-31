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
import type { SystemState, SecurityContext, Window, CognitiveMode, CapabilityId, PendingStepUp, CorrelationId, SpaceId } from '../types/index.js';
export declare const INITIAL_SECURITY_CONTEXT: SecurityContext;
export declare const INITIAL_STATE: SystemState;
export type StateAction = {
    type: 'WINDOW_CREATE';
    window: Window;
    correlationId: CorrelationId;
} | {
    type: 'WINDOW_CLOSE';
    windowId: string;
    correlationId: CorrelationId;
} | {
    type: 'WINDOW_FOCUS';
    windowId: string;
    correlationId: CorrelationId;
} | {
    type: 'WINDOW_MINIMIZE';
    windowId: string;
    correlationId: CorrelationId;
} | {
    type: 'WINDOW_RESTORE';
    windowId: string;
    correlationId: CorrelationId;
} | {
    type: 'WINDOW_MINIMIZE_ALL';
    correlationId: CorrelationId;
} | {
    type: 'CAPABILITY_ACTIVATE';
    capabilityId: CapabilityId;
    correlationId: CorrelationId;
} | {
    type: 'CAPABILITY_DEACTIVATE';
    capabilityId: CapabilityId;
    correlationId: CorrelationId;
} | {
    type: 'COGNITIVE_MODE_SET';
    mode: CognitiveMode;
    correlationId: CorrelationId;
} | {
    type: 'SECURITY_SET';
    security: SecurityContext;
    correlationId: CorrelationId;
} | {
    type: 'STEP_UP_PENDING';
    pending: PendingStepUp;
} | {
    type: 'STEP_UP_CLEAR';
    correlationId: CorrelationId;
} | {
    type: 'STEP_UP_ACTIVATE';
    expiry: number;
    correlationId: CorrelationId;
} | {
    type: 'CONTEXT_PUSH';
    capabilityId: CapabilityId;
    correlationId: CorrelationId;
} | {
    type: 'CONTEXT_POP';
    correlationId: CorrelationId;
} | {
    type: 'SPACE_SWITCH';
    spaceId: SpaceId;
    correlationId: CorrelationId;
} | {
    type: 'WINDOW_MOVE_TO_SPACE';
    windowId: string;
    spaceId: SpaceId;
    correlationId: CorrelationId;
};
export declare function systemReducer(state: SystemState, action: StateAction): SystemState;
export declare class CoreOSStateStore {
    private state;
    private listeners;
    constructor(initial?: SystemState);
    /**
     * Get current state (immutable)
     */
    getState(): SystemState;
    /**
     * Dispatch an action
     */
    dispatch(action: StateAction): void;
    /**
     * Subscribe to state changes
     */
    subscribe(listener: (state: SystemState) => void): () => void;
    /**
     * Notify all listeners
     */
    private notifyListeners;
    /**
     * Reset to initial state
     */
    reset(): void;
}
export declare function getStateStore(): CoreOSStateStore;
export declare function resetStateStore(): void;
//# sourceMappingURL=state.d.ts.map