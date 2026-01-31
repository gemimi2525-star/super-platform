/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SYNAPSE — Intelligence Layer Types
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * ARCHITECTURAL POSITION:
 * 
 *   Human Intent
 *        ↓
 *   SYNAPSE Kernel
 *   ├─ Policy Engine ← Highest Authority
 *   ├─ Capability Graph
 *   ├─ State Engine
 *   ├─ Window Manager
 *   ├─ Event Bus
 *   └─ Intelligence Layer ← AI (READ-ONLY) ← YOU ARE HERE
 * 
 * CORE PRINCIPLE:
 * - AI = Observer + Advisor ONLY
 * - AI has NO execution authority
 * - AI cannot mutate state
 * - AI cannot emit intents
 * - AI cannot bypass policy
 * 
 * If Intelligence Layer is removed → System works 100% the same
 * 
 * @module coreos/intelligence/types
 * @version 1.0.0
 */

import type {
    SystemState,
    SystemEvent,
    PolicyDecision,
    CapabilityId,
    CognitiveMode,
} from '../types';

// ═══════════════════════════════════════════════════════════════════════════
// INSIGHT OUTPUT TYPES (What AI can produce)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Context insight — AI's understanding of current system context
 * 
 * ❌ Cannot trigger any action
 * ✅ Can be displayed to user on-demand
 */
export interface ContextInsight {
    readonly type: 'context_insight';
    readonly summary: string;
    readonly cognitiveMode: CognitiveMode;
    readonly activeCapabilities: readonly CapabilityId[];
    readonly confidence: number; // 0-1
    readonly timestamp: number;
}

/**
 * Policy warning — AI's explanation of policy implications
 * 
 * ❌ Cannot override policy
 * ✅ Can explain why something was denied
 */
export interface PolicyWarning {
    readonly type: 'policy_warning';
    readonly capabilityId: CapabilityId;
    readonly decision: PolicyDecision;
    readonly explanation: string;
    readonly suggestedAction: string | null; // Suggestion only, not execution
}

/**
 * Capability suggestion — AI recommends a capability
 * 
 * ❌ Cannot auto-open capability
 * ✅ Can suggest to user for manual action
 */
export interface CapabilitySuggestion {
    readonly type: 'capability_suggestion';
    readonly capabilityId: CapabilityId;
    readonly reason: string;
    readonly relevance: number; // 0-1
    readonly isBlocking: false; // NEVER blocking
}

/**
 * Explanation text — Plain text explanation
 * 
 * ❌ Cannot execute anything
 * ✅ Pure informational output
 */
export interface ExplanationText {
    readonly type: 'explanation_text';
    readonly topic: string;
    readonly content: string;
    readonly format: 'plain' | 'markdown';
}

/**
 * Union of all insight outputs
 */
export type IntelligenceOutput =
    | ContextInsight
    | PolicyWarning
    | CapabilitySuggestion
    | ExplanationText;

// ═══════════════════════════════════════════════════════════════════════════
// OBSERVER INTERFACES (READ-ONLY)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Intelligence Observer — Receives events (READ-ONLY)
 * 
 * RULES:
 * - Can observe events
 * - Cannot respond with actions
 * - Cannot mutate anything
 */
export interface IntelligenceObserver {
    /**
     * Called when system event occurs
     * @param event - The event (IMMUTABLE)
     * 
     * ❌ Must NOT return actions
     * ❌ Must NOT mutate event
     * ❌ Must NOT call kernel
     */
    onEvent(event: Readonly<SystemEvent>): void;

    /**
     * Called when state changes
     * @param state - Snapshot of state (IMMUTABLE)
     * 
     * ❌ Must NOT mutate state
     * ❌ Must NOT dispatch actions
     */
    onStateChange(state: Readonly<SystemState>): void;
}

/**
 * Context Insight Provider — Analyzes current context
 * 
 * RULES:
 * - Returns insight ONLY
 * - Called by UI on-demand
 * - Never initiates interaction
 */
export interface ContextInsightProvider {
    /**
     * Analyze current context and provide insight
     * @param state - Current state snapshot (IMMUTABLE)
     * @returns ContextInsight — informational only
     * 
     * ❌ Cannot trigger actions
     * ✅ Can be called by UI
     */
    analyzeContext(state: Readonly<SystemState>): Promise<ContextInsight>;
}

/**
 * Policy Insight Provider — Explains policy decisions
 * 
 * RULES:
 * - Explains decisions AFTER they're made
 * - Cannot influence policy evaluation
 * - Called by UI on-demand
 */
export interface PolicyInsightProvider {
    /**
     * Explain a policy decision
     * @param decision - The decision that was made
     * @param capabilityId - The capability involved
     * @returns PolicyWarning — explanation only
     * 
     * ❌ Cannot override decision
     * ✅ Can explain to user
     */
    explainDecision(
        decision: PolicyDecision,
        capabilityId: CapabilityId
    ): Promise<PolicyWarning>;
}

/**
 * Explanation Provider — Provides explanations on-demand
 * 
 * RULES:
 * - Pure informational
 * - Called by UI on-demand
 * - No side effects
 */
export interface ExplanationProvider {
    /**
     * Explain a topic
     * @param topic - What to explain
     * @param context - Additional context
     * @returns ExplanationText — pure information
     */
    explain(topic: string, context?: Record<string, unknown>): Promise<ExplanationText>;

    /**
     * Explain why step-up is required
     */
    explainStepUp(capabilityId: CapabilityId): Promise<ExplanationText>;

    /**
     * Explain why access was denied
     */
    explainDeny(capabilityId: CapabilityId, reason: string): Promise<ExplanationText>;
}

// ═══════════════════════════════════════════════════════════════════════════
// SUGGESTION INTERFACE (PASSIVE ONLY)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Suggestion Provider — Suggests capabilities (NEVER executes)
 * 
 * RULES:
 * - Suggestions are NEVER auto-executed
 * - User must manually act on suggestions
 * - isBlocking is ALWAYS false
 */
export interface SuggestionProvider {
    /**
     * Get capability suggestions based on context
     * @param state - Current state snapshot
     * @returns Array of suggestions (NEVER auto-executed)
     * 
     * ❌ Cannot auto-open capabilities
     * ✅ User must click to act
     */
    getSuggestions(state: Readonly<SystemState>): Promise<readonly CapabilitySuggestion[]>;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPOSITE INTERFACE (Full Intelligence Layer)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Complete Intelligence Layer interface
 * 
 * ARCHITECTURAL CONSTRAINTS:
 * - READ-ONLY access to system
 * - NO execution authority
 * - Removable without system impact
 */
export interface IntelligenceLayer extends
    IntelligenceObserver,
    ContextInsightProvider,
    PolicyInsightProvider,
    ExplanationProvider,
    SuggestionProvider {

    /**
     * Initialize the intelligence layer
     * @returns true if ready, false if unavailable
     */
    initialize(): Promise<boolean>;

    /**
     * Check if intelligence layer is available
     * System MUST work without it
     */
    isAvailable(): boolean;

    /**
     * Shutdown the intelligence layer
     * System continues to work after this
     */
    shutdown(): void;
}
