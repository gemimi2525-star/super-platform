/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SYNAPSE — Intelligence React Hooks (ON-DEMAND ONLY)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * React hooks for UI to access Intelligence Layer ON-DEMAND.
 * 
 * RULES:
 * - UI must explicitly call hooks
 * - AI never initiates interaction
 * - All outputs are informational only
 * - No auto-execution of suggestions
 * 
 * @module coreos/intelligence/react
 * @version 1.0.0
 */

'use client';

import { useCallback, useState, useEffect } from 'react';
import { useSystemState } from '../react';
import { getIntelligenceLayer } from './stub';
import type {
    ContextInsight,
    PolicyWarning,
    ExplanationText,
    CapabilitySuggestion,
} from './types';
import type { PolicyDecision, CapabilityId } from '../types';

// ═══════════════════════════════════════════════════════════════════════════
// EXPLANATION HOOKS (ON-DEMAND)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Hook to explain a policy decision
 * 
 * USAGE:
 * const { explain, explanation, loading } = useExplainDecision();
 * // UI calls explain() when user requests it
 * 
 * ❌ Never auto-executes
 * ✅ Called by UI on-demand
 */
export function useExplainDecision() {
    const [explanation, setExplanation] = useState<PolicyWarning | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const explain = useCallback(async (
        decision: PolicyDecision,
        capabilityId: CapabilityId
    ) => {
        setLoading(true);
        setError(null);
        try {
            const layer = getIntelligenceLayer();
            if (!layer.isAvailable()) {
                // System works without AI
                setExplanation(null);
                return;
            }
            const result = await layer.explainDecision(decision, capabilityId);
            setExplanation(result);
        } catch (e) {
            // AI errors don't break system
            setError(e instanceof Error ? e.message : 'Unknown error');
            setExplanation(null);
        } finally {
            setLoading(false);
        }
    }, []);

    const clear = useCallback(() => {
        setExplanation(null);
        setError(null);
    }, []);

    return { explain, explanation, loading, error, clear };
}

/**
 * Hook to explain step-up requirement
 * 
 * ❌ Never auto-shows
 * ✅ UI calls when user clicks "Why?"
 */
export function useExplainStepUp() {
    const [explanation, setExplanation] = useState<ExplanationText | null>(null);
    const [loading, setLoading] = useState(false);

    const explain = useCallback(async (capabilityId: CapabilityId) => {
        setLoading(true);
        try {
            const layer = getIntelligenceLayer();
            if (!layer.isAvailable()) {
                setExplanation(null);
                return;
            }
            const result = await layer.explainStepUp(capabilityId);
            setExplanation(result);
        } catch {
            // AI errors don't break system
            setExplanation(null);
        } finally {
            setLoading(false);
        }
    }, []);

    return { explain, explanation, loading };
}

/**
 * Hook to explain access denial
 * 
 * ❌ Never auto-shows
 * ✅ UI calls when user clicks "Why was I denied?"
 */
export function useExplainDeny() {
    const [explanation, setExplanation] = useState<ExplanationText | null>(null);
    const [loading, setLoading] = useState(false);

    const explain = useCallback(async (capabilityId: CapabilityId, reason: string) => {
        setLoading(true);
        try {
            const layer = getIntelligenceLayer();
            if (!layer.isAvailable()) {
                setExplanation(null);
                return;
            }
            const result = await layer.explainDeny(capabilityId, reason);
            setExplanation(result);
        } catch {
            setExplanation(null);
        } finally {
            setLoading(false);
        }
    }, []);

    return { explain, explanation, loading };
}

// ═══════════════════════════════════════════════════════════════════════════
// CONTEXT INSIGHT HOOK (ON-DEMAND)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Hook to get context insight
 * 
 * ❌ Never auto-displays
 * ✅ UI calls when user wants to understand context
 */
export function useContextInsight() {
    const state = useSystemState();
    const [insight, setInsight] = useState<ContextInsight | null>(null);
    const [loading, setLoading] = useState(false);

    const analyze = useCallback(async () => {
        setLoading(true);
        try {
            const layer = getIntelligenceLayer();
            if (!layer.isAvailable()) {
                setInsight(null);
                return;
            }
            // Create immutable snapshot
            const snapshot = JSON.parse(JSON.stringify(state));
            const result = await layer.analyzeContext(snapshot);
            setInsight(result);
        } catch {
            setInsight(null);
        } finally {
            setLoading(false);
        }
    }, [state]);

    return { analyze, insight, loading };
}

// ═══════════════════════════════════════════════════════════════════════════
// SUGGESTION HOOK (PASSIVE ONLY)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Hook to get capability suggestions
 * 
 * RULES:
 * - Suggestions are NEVER auto-executed
 * - User must manually click to act on suggestion
 * - isBlocking is ALWAYS false
 * 
 * ❌ Never auto-opens capabilities
 * ✅ Shows suggestions in UI for user to decide
 */
export function useSuggestions() {
    const state = useSystemState();
    const [suggestions, setSuggestions] = useState<readonly CapabilitySuggestion[]>([]);
    const [loading, setLoading] = useState(false);

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const layer = getIntelligenceLayer();
            if (!layer.isAvailable()) {
                setSuggestions([]);
                return;
            }
            const snapshot = JSON.parse(JSON.stringify(state));
            const result = await layer.getSuggestions(snapshot);
            setSuggestions(result);
        } catch {
            setSuggestions([]);
        } finally {
            setLoading(false);
        }
    }, [state]);

    return { refresh, suggestions, loading };
}

// ═══════════════════════════════════════════════════════════════════════════
// AVAILABILITY HOOK
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Hook to check if Intelligence Layer is available
 * 
 * System MUST work when this returns false
 */
export function useIntelligenceAvailable(): boolean {
    const [available, setAvailable] = useState(false);

    useEffect(() => {
        const layer = getIntelligenceLayer();
        setAvailable(layer.isAvailable());
    }, []);

    return available;
}
