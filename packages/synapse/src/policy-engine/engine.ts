/**
 * SYNAPSE POLICY ENGINE
 * 
 * The Execution Unit for Governance Logic.
 * 
 * Input: Intent, Context
 * Output: DecisionResult (ALLOW | DENY | ESCALATE)
 * 
 * Logic:
 * 1. Blocked ID Check (Governance)
 * 2. Registry Existence Check (Integrity)
 * 3. Certification Check (Security)
 * 4. Policy Requirements Check (Authorization)
 * 5. Step-Up Check (Authentication)
 */

import { SynapseCapabilityGraph } from './graph';
import { SecurityContext, SpacePolicy, SpaceId, DEFAULT_SPACE_PERMISSIONS, SpaceAccessDecision, SpacePolicyContext, UserRole } from './types';
import { DecisionResult } from '../reason-core/schema';

// Role hierarchy/comparison logic from Core OS
const ROLE_HIERARCHY: Record<UserRole, number> = {
    guest: 0,
    user: 1,
    admin: 2,
    owner: 3,
};

export class SynapsePolicyEngine {
    private static instance: SynapsePolicyEngine;
    private graph: SynapseCapabilityGraph;
    private spacePolicies: Map<SpaceId, SpacePolicy> = new Map();

    private constructor() {
        this.graph = SynapseCapabilityGraph.getInstance();
    }

    public static getInstance(): SynapsePolicyEngine {
        if (!SynapsePolicyEngine.instance) {
            SynapsePolicyEngine.instance = new SynapsePolicyEngine();
        }
        return SynapsePolicyEngine.instance;
    }

    /**
     * Register a space policy
     */
    public registerSpacePolicy(policy: SpacePolicy): void {
        this.spacePolicies.set(policy.spaceId, policy);
    }

    /**
     * Evaluate an intent against all policies
     */
    public evaluate(
        intent: { action: string; target: string; params: Record<string, any> },
        context: { security: SecurityContext }
    ): DecisionResult {
        const { action, target, params } = intent;

        // 1. Governance Rules (Hard Blocks)
        if (target !== 'system' && this.graph.isBlocked(target)) {
            console.warn(`[POLICY] DENY: Blocked ID '${target}'`);
            return 'DENY';
        }

        // 2. OPEN_CAPABILITY Logic
        if (action === 'OPEN_CAPABILITY') {
            const capabilityId = params.intent?.payload?.capabilityId || target;
            return this.evaluateCapabilityAccess(capabilityId, context.security);
        }

        // 3. Space Logic (SWITCH_SPACE)
        if (action === 'SWITCH_SPACE') {
            const spaceId = params.spaceId || params.intent?.payload?.spaceId;
            if (spaceId) {
                const decision = this.evaluateSpaceAccess({
                    spaceId,
                    action: 'access',
                    security: context.security
                });
                if (decision.type === 'deny') {
                    console.warn(`[POLICY] DENY: Space Access '${spaceId}': ${decision.reason}`);
                    return 'DENY'; // Or return specific ReasonCode
                }
                return 'ALLOW';
            }
        }

        // Sentinel
        return 'ALLOW';
    }

    private evaluateCapabilityAccess(capabilityId: string, security: SecurityContext): DecisionResult {
        // Existence
        if (!this.graph.exists(capabilityId)) {
            console.warn(`[POLICY] DENY: Unknown capability '${capabilityId}'`);
            return 'DENY';
        }

        // Required Policies
        const manifest = this.graph.getManifest(capabilityId);
        if (manifest?.requiredPolicies.length) {
            if (security.role === 'admin') {
                // Pass
            } else {
                const hasAll = manifest.requiredPolicies.every(p => security.policies.includes(p));
                if (!hasAll) {
                    console.warn(`[POLICY] DENY: Missing required policies for '${capabilityId}'`);
                    return 'DENY';
                }
            }
        }

        // Step-Up
        if (this.graph.requiresStepUp(capabilityId)) {
            if (!security.stepUpActive) {
                return 'ESCALATE';
            }
        }

        return 'ALLOW';
    }

    /**
     * Internal Space Access Evaluation
     */
    private evaluateSpaceAccess(context: SpacePolicyContext): SpaceAccessDecision {
        const { spaceId, action, security } = context;

        // Get Policy (or default)
        const policy = this.spacePolicies.get(spaceId) || {
            spaceId,
            permissions: DEFAULT_SPACE_PERMISSIONS
        };

        // 1. Auth Check
        if (!security.authenticated) {
            return { type: 'deny', reason: 'Authentication required', spaceId };
        }

        // 2. Role Check
        if (policy.requiredRole) {
            const userRoleLevel = ROLE_HIERARCHY[security.role];
            const requiredRoleLevel = ROLE_HIERARCHY[policy.requiredRole];
            if (userRoleLevel < requiredRoleLevel) {
                return { type: 'deny', reason: `Insufficient role: ${policy.requiredRole}`, spaceId };
            }
        }

        // 3. Permission Check
        const permissionMap: Record<string, keyof typeof policy.permissions> = {
            access: 'canAccess',
            openWindow: 'canOpenWindow',
            focusWindow: 'canFocusWindow',
            moveWindow: 'canMoveWindow',
        };
        const key = permissionMap[action];
        if (key && !policy.permissions[key]) {
            return { type: 'deny', reason: `Action '${action}' not permitted`, spaceId };
        }

        return { type: 'allow' };
    }
}
