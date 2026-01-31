/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CORE OS KERNEL — Policy Engine (HARDENED)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * DETERMINISTIC POLICY RESOLUTION ORDER:
 * 1. locked → deny all (except unlock)
 * 2. step-up required → require_stepup until granted
 * 3. explicit deny > allow
 * 4. default deny unknown capability
 *
 * Policy changes alter behavior WITHOUT touching kernel pipeline.
 *
 * @module coreos/policy-engine
 * @version 3.0.0 (Phase M: Space Policies)
 */
import type { CapabilityId, PolicyDecision, SecurityContext, PolicyContext, CognitiveMode, SpaceId, SpacePolicy, SpaceAccessDecision, SpacePolicyContext, SpaceAction, CorrelationId, DecisionExplanation } from '../types/index.js';
/**
 * Policy Engine - Deterministic resolution order
 *
 * Resolution order:
 * 1. locked → deny all (except unlock)
 * 2. step-up required → require_stepup until granted
 * 3. explicit deny > allow
 * 4. default deny unknown capability
 */
export declare class CoreOSPolicyEngine {
    private spacePolicies;
    /**
     * Evaluate access to a capability
     * @returns PolicyDecision - NEVER throws
     */
    evaluate(context: PolicyContext, cognitiveMode: CognitiveMode): PolicyDecision;
    /**
     * Register a space policy
     */
    registerSpacePolicy(policy: SpacePolicy): void;
    /**
     * Remove a space policy
     */
    removeSpacePolicy(spaceId: SpaceId): void;
    /**
     * Get space policy (returns default if none registered)
     */
    getSpacePolicy(spaceId: SpaceId): SpacePolicy;
    /**
     * Evaluate space access
     * @returns SpaceAccessDecision - NEVER throws
     */
    evaluateSpaceAccess(context: SpacePolicyContext): SpaceAccessDecision;
    /**
     * Quick check: is space action allowed?
     */
    isSpaceActionAllowed(context: SpacePolicyContext): boolean;
    /**
     * Get deny reason if action is denied
     */
    getSpaceDenyReason(context: SpacePolicyContext): string | null;
    /**
     * Phase O: Evaluate if opening a capability is allowed in the target space
     * This is a convenience wrapper that combines space policy checking
     * with capability opening semantics.
     */
    evaluateOpenCapabilityInSpace(params: {
        capabilityId: CapabilityId;
        spaceId: SpaceId;
        security: SecurityContext;
    }): SpaceAccessDecision;
    /**
     * Phase P: Check if a capability can be discovered/visible in a space
     * Used by Finder-like discovery sources.
     * @returns true if capability can be opened in the space
     */
    canDiscoverCapabilityInSpace(params: {
        capabilityId: CapabilityId;
        spaceId: SpaceId;
        security: SecurityContext;
    }): boolean;
    /**
     * Phase P: Check if a window is visible in the active space
     * @returns true if window.spaceId matches activeSpaceId AND canAccess is allowed
     */
    isWindowVisibleInSpace(params: {
        windowSpaceId: SpaceId;
        activeSpaceId: SpaceId;
        security: SecurityContext;
    }): boolean;
    /**
     * Phase P: Check if focus is allowed for a window in the active space
     * @returns true if window is visible AND canFocusWindow is allowed
     */
    canFocusWindowInSpace(params: {
        windowSpaceId: SpaceId;
        activeSpaceId: SpaceId;
        security: SecurityContext;
    }): boolean;
    /**
     * Clear all space policies (for testing)
     */
    clearSpacePolicies(): void;
    /**
     * Check if a decision allows the action
     */
    isAllowed(decision: PolicyDecision): boolean;
    /**
     * Check if step-up is required
     */
    requiresStepUp(decision: PolicyDecision): boolean;
    /**
     * Check if explicitly denied
     */
    isDenied(decision: PolicyDecision): boolean;
    /**
     * Check if degraded to fallback
     */
    isDegraded(decision: PolicyDecision): boolean;
    /**
     * Phase R: Build explanation for space access decision
     * Pure function - deterministic and replayable
     */
    explainSpaceAccessDecision(params: {
        decision: SpaceAccessDecision;
        intentType: string;
        correlationId: CorrelationId;
        spaceId: SpaceId;
        action: SpaceAction;
        windowId?: string;
    }): DecisionExplanation;
    /**
     * Phase R: Build explanation for capability policy decision
     * Pure function - deterministic and replayable
     */
    explainCapabilityDecision(params: {
        decision: PolicyDecision;
        intentType: string;
        correlationId: CorrelationId;
        capabilityId: CapabilityId;
        spaceId?: SpaceId;
    }): DecisionExplanation;
    /**
     * Phase R: Build explanation for WindowManager skip
     */
    explainWindowManagerSkip(params: {
        intentType: string;
        correlationId: CorrelationId;
        capabilityId?: CapabilityId;
        windowId?: string;
        spaceId?: SpaceId;
        failedRule: string;
        reason: string;
    }): DecisionExplanation;
    /**
     * Extract failed rule from reason string
     */
    private extractFailedRule;
}
export declare function getPolicyEngine(): CoreOSPolicyEngine;
export declare function resetPolicyEngine(): void;
//# sourceMappingURL=index.d.ts.map