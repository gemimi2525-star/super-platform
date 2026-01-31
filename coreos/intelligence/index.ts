/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SYNAPSE — Intelligence Layer Exports
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * ARCHITECTURE REMINDER:
 * 
 *   AI = Insight Layer, NOT Authority Layer
 * 
 * - ❌ AI cannot emit intents
 * - ❌ AI cannot mutate state
 * - ❌ AI cannot bypass policy
 * - ✅ AI can observe (read-only)
 * - ✅ AI can explain (on-demand)
 * - ✅ AI can suggest (passive, never executes)
 * 
 * If Intelligence Layer is removed → System works 100% the same
 * 
 * @module coreos/intelligence
 */

// ═══════════════════════════════════════════════════════════════════════════
// TYPE EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export type {
    // Output types
    ContextInsight,
    PolicyWarning,
    CapabilitySuggestion,
    ExplanationText,
    IntelligenceOutput,

    // Interface types
    IntelligenceObserver,
    ContextInsightProvider,
    PolicyInsightProvider,
    ExplanationProvider,
    SuggestionProvider,
    IntelligenceLayer,
} from './types';

// ═══════════════════════════════════════════════════════════════════════════
// OBSERVER / BRIDGE
// ═══════════════════════════════════════════════════════════════════════════

export {
    IntelligenceBridge,
    getIntelligenceBridge,
    resetIntelligenceBridge,
} from './observer';

// ═══════════════════════════════════════════════════════════════════════════
// STUB IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════════════

export {
    StubIntelligenceLayer,
    getIntelligenceLayer,
    setIntelligenceLayer,
    resetIntelligenceLayer,
} from './stub';

// ═══════════════════════════════════════════════════════════════════════════
// REACT HOOKS (re-exported for convenience)
// ═══════════════════════════════════════════════════════════════════════════

// Note: React hooks should be imported from './react' directly in client components
// This is just for documentation purposes
