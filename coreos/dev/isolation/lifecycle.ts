/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Capability Lifecycle State Machine (Phase 26)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * States: INSTALLED → ENABLED ↔ DISABLED → REMOVED
 * All transitions are deterministic and audit-traceable.
 */

export type CapabilityState = 'INSTALLED' | 'ENABLED' | 'DISABLED' | 'REMOVED';
export type LifecycleAction = 'enable' | 'disable' | 'remove';

interface TransitionResult {
    allowed: boolean;
    from: CapabilityState;
    to?: CapabilityState;
    reason?: string;
}

/** Legal state transitions */
const TRANSITIONS: Record<CapabilityState, Partial<Record<LifecycleAction, CapabilityState>>> = {
    INSTALLED: { enable: 'ENABLED', remove: 'REMOVED' },
    ENABLED: { disable: 'DISABLED', remove: 'REMOVED' },
    DISABLED: { enable: 'ENABLED', remove: 'REMOVED' },
    REMOVED: {}, // terminal state
};

/**
 * Compute the next state for a lifecycle transition.
 * Returns allowed=false if the transition is illegal.
 */
export function transition(currentState: CapabilityState, action: LifecycleAction): TransitionResult {
    const nextState = TRANSITIONS[currentState]?.[action];

    if (!nextState) {
        return {
            allowed: false,
            from: currentState,
            reason: `Cannot ${action} from state ${currentState}`,
        };
    }

    return {
        allowed: true,
        from: currentState,
        to: nextState,
    };
}

/**
 * Check if a capability is in an active state (can process events/calls).
 */
export function isActive(state: CapabilityState): boolean {
    return state === 'ENABLED';
}

/**
 * Get all valid actions for a given state.
 */
export function validActions(state: CapabilityState): LifecycleAction[] {
    return Object.keys(TRANSITIONS[state] || {}) as LifecycleAction[];
}
