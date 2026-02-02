/**
 * ═══════════════════════════════════════════════════════════════════════════
 * [DEPRECATED] CORE OS KERNEL — Policy Engine
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * ⚠️ CRITICAL WARNING ⚠️
 * This module is DEPRECATED as of Migration Phase 2.
 * All policy decisions typically handled here have been migrated to
 * the Synapse Authority (packages/synapse).
 * 
 * Any attempt to use this engine will result in a runtime error.
 * 
 * @module coreos/policy-engine
 * @deprecated Use Synapse Authority instead.
 */

import { PolicyDecision, PolicyContext, CognitiveMode, SpaceAccessDecision, SpacePolicyContext } from './types';

export class CoreOSPolicyEngine {
    evaluate(context: PolicyContext, cognitiveMode: CognitiveMode): PolicyDecision {
        throw new Error('CoreOSPolicyEngine is DEPRECATED. Execution halted. Use Synapse Authority.');
    }

    evaluateSpaceAccess(context: SpacePolicyContext): SpaceAccessDecision {
        throw new Error('CoreOSPolicyEngine is DEPRECATED. Execution halted. Use Synapse Authority.');
    }

    canDiscoverCapabilityInSpace(params: any): boolean {
        throw new Error('CoreOSPolicyEngine is DEPRECATED. Execution halted. Use Synapse Authority.');
    }

    // Stub other methods just in case type checks need them, but throw.
    registerSpacePolicy(policy: any): void { throw new Error('DEPRECATED'); }
    removeSpacePolicy(spaceId: any): void { throw new Error('DEPRECATED'); }
    getSpacePolicy(spaceId: any): any { throw new Error('DEPRECATED'); }
    isSpaceActionAllowed(context: any): boolean { throw new Error('DEPRECATED'); }
    getSpaceDenyReason(context: any): string | null { throw new Error('DEPRECATED'); }
    evaluateOpenCapabilityInSpace(params: any): any { throw new Error('DEPRECATED'); }
    isWindowVisibleInSpace(params: any): boolean { throw new Error('DEPRECATED'); }
    canFocusWindowInSpace(params: any): boolean { throw new Error('DEPRECATED'); }
    clearSpacePolicies(): void { throw new Error('DEPRECATED'); }
    isAllowed(decision: any): boolean { throw new Error('DEPRECATED'); }
    requiresStepUp(decision: any): boolean { throw new Error('DEPRECATED'); }
    isDenied(decision: any): boolean { throw new Error('DEPRECATED'); }
    isDegraded(decision: any): boolean { throw new Error('DEPRECATED'); }
    explainSpaceAccessDecision(params: any): any { throw new Error('DEPRECATED'); }
    explainCapabilityDecision(params: any): any { throw new Error('DEPRECATED'); }
    explainWindowManagerSkip(params: any): any { throw new Error('DEPRECATED'); }
}

export function getPolicyEngine(): CoreOSPolicyEngine {
    throw new Error('getPolicyEngine() is DEPRECATED. Use Synapse Authority.');
}

export function resetPolicyEngine(): void {
    // No-op or throw? No-op is safer for teardown scripts.
    console.warn('resetPolicyEngine() called on deprecated engine.');
}
