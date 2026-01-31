"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoreOSPolicyEngine = void 0;
exports.getPolicyEngine = getPolicyEngine;
exports.resetPolicyEngine = resetPolicyEngine;
const index_js_1 = require("../types/index.js");
const capability_graph_js_1 = require("../kernel/capability-graph.js");
// Role hierarchy for comparison
const ROLE_HIERARCHY = {
    guest: 0,
    user: 1,
    admin: 2,
    owner: 3,
};
// ═══════════════════════════════════════════════════════════════════════════
// POLICY ENGINE (Deterministic Resolution)
// ═══════════════════════════════════════════════════════════════════════════
/**
 * Policy Engine - Deterministic resolution order
 *
 * Resolution order:
 * 1. locked → deny all (except unlock)
 * 2. step-up required → require_stepup until granted
 * 3. explicit deny > allow
 * 4. default deny unknown capability
 */
class CoreOSPolicyEngine {
    // Phase M: Space policies registry
    spacePolicies = new Map();
    /**
     * Evaluate access to a capability
     * @returns PolicyDecision - NEVER throws
     */
    evaluate(context, cognitiveMode) {
        const { capabilityId, security } = context;
        const graph = (0, capability_graph_js_1.getCapabilityGraph)();
        // ─────────────────────────────────────────────────────────────────────
        // STEP 0: Unknown capability → DENY
        // ─────────────────────────────────────────────────────────────────────
        if (!graph.has(capabilityId)) {
            return {
                type: 'deny',
                reason: `Unknown capability: ${capabilityId}`,
            };
        }
        // ─────────────────────────────────────────────────────────────────────
        // STEP 1: Locked screen → DENY ALL (except unlock)
        // ─────────────────────────────────────────────────────────────────────
        if (cognitiveMode === 'locked') {
            // Only unlock intent is allowed when locked
            return {
                type: 'deny',
                reason: 'System is locked',
            };
        }
        // ─────────────────────────────────────────────────────────────────────
        // STEP 2: Not authenticated → DENY
        // ─────────────────────────────────────────────────────────────────────
        if (!security.authenticated) {
            return {
                type: 'deny',
                reason: 'Authentication required',
            };
        }
        // ─────────────────────────────────────────────────────────────────────
        // STEP 3: Check required policies → DENY if missing
        // ─────────────────────────────────────────────────────────────────────
        const requiredPolicies = graph.getRequiredPolicies(capabilityId);
        const missingPolicies = requiredPolicies.filter(policy => !security.policies.includes(policy));
        if (missingPolicies.length > 0) {
            return {
                type: 'deny',
                reason: `Missing policies: ${missingPolicies.join(', ')}`,
            };
        }
        // ─────────────────────────────────────────────────────────────────────
        // STEP 4: Step-up required → REQUIRE_STEPUP (unless active)
        // ─────────────────────────────────────────────────────────────────────
        if (graph.requiresStepUp(capabilityId)) {
            // Check if step-up is already active and not expired
            if (!security.stepUpActive) {
                const manifest = graph.getManifest(capabilityId);
                return {
                    type: 'require_stepup',
                    challenge: `Confirm your identity to access ${manifest?.title || capabilityId}`,
                };
            }
            // Check expiry
            if (security.stepUpExpiry !== null && Date.now() > security.stepUpExpiry) {
                const manifest = graph.getManifest(capabilityId);
                return {
                    type: 'require_stepup',
                    challenge: `Session expired. Confirm your identity to access ${manifest?.title || capabilityId}`,
                };
            }
        }
        // ─────────────────────────────────────────────────────────────────────
        // STEP 5: All checks passed → ALLOW
        // ─────────────────────────────────────────────────────────────────────
        return { type: 'allow' };
    }
    // ═══════════════════════════════════════════════════════════════════════
    // PHASE M: SPACE POLICY EVALUATION
    // ═══════════════════════════════════════════════════════════════════════
    /**
     * Register a space policy
     */
    registerSpacePolicy(policy) {
        this.spacePolicies.set(policy.spaceId, policy);
    }
    /**
     * Remove a space policy
     */
    removeSpacePolicy(spaceId) {
        this.spacePolicies.delete(spaceId);
    }
    /**
     * Get space policy (returns default if none registered)
     */
    getSpacePolicy(spaceId) {
        const policy = this.spacePolicies.get(spaceId);
        if (policy) {
            return policy;
        }
        // Default policy: allow all
        return {
            spaceId,
            permissions: index_js_1.DEFAULT_SPACE_PERMISSIONS,
        };
    }
    /**
     * Evaluate space access
     * @returns SpaceAccessDecision - NEVER throws
     */
    evaluateSpaceAccess(context) {
        const { spaceId, action, security } = context;
        const policy = this.getSpacePolicy(spaceId);
        // ─────────────────────────────────────────────────────────────────────
        // STEP 1: Not authenticated → DENY
        // ─────────────────────────────────────────────────────────────────────
        if (!security.authenticated) {
            return {
                type: 'deny',
                reason: 'Authentication required for space access',
                spaceId,
            };
        }
        // ─────────────────────────────────────────────────────────────────────
        // STEP 2: Check required role
        // ─────────────────────────────────────────────────────────────────────
        if (policy.requiredRole) {
            const userRoleLevel = ROLE_HIERARCHY[security.role];
            const requiredRoleLevel = ROLE_HIERARCHY[policy.requiredRole];
            if (userRoleLevel < requiredRoleLevel) {
                return {
                    type: 'deny',
                    reason: `Insufficient role for ${spaceId}. Required: ${policy.requiredRole}`,
                    spaceId,
                };
            }
        }
        // ─────────────────────────────────────────────────────────────────────
        // STEP 3: Check required policies
        // ─────────────────────────────────────────────────────────────────────
        if (policy.requiredPolicies && policy.requiredPolicies.length > 0) {
            const missingPolicies = policy.requiredPolicies.filter(p => !security.policies.includes(p));
            if (missingPolicies.length > 0) {
                return {
                    type: 'deny',
                    reason: `Missing policies for ${spaceId}: ${missingPolicies.join(', ')}`,
                    spaceId,
                };
            }
        }
        // ─────────────────────────────────────────────────────────────────────
        // STEP 4: Check action-specific permission
        // ─────────────────────────────────────────────────────────────────────
        const permissionMap = {
            access: 'canAccess',
            openWindow: 'canOpenWindow',
            focusWindow: 'canFocusWindow',
            moveWindow: 'canMoveWindow',
        };
        const permissionKey = permissionMap[action];
        if (!policy.permissions[permissionKey]) {
            return {
                type: 'deny',
                reason: `Action '${action}' not permitted in ${spaceId}`,
                spaceId,
            };
        }
        // ─────────────────────────────────────────────────────────────────────
        // STEP 5: All checks passed → ALLOW
        // ─────────────────────────────────────────────────────────────────────
        return { type: 'allow' };
    }
    /**
     * Quick check: is space action allowed?
     */
    isSpaceActionAllowed(context) {
        const decision = this.evaluateSpaceAccess(context);
        return decision.type === 'allow';
    }
    /**
     * Get deny reason if action is denied
     */
    getSpaceDenyReason(context) {
        const decision = this.evaluateSpaceAccess(context);
        if (decision.type === 'deny') {
            return decision.reason;
        }
        return null;
    }
    /**
     * Phase O: Evaluate if opening a capability is allowed in the target space
     * This is a convenience wrapper that combines space policy checking
     * with capability opening semantics.
     */
    evaluateOpenCapabilityInSpace(params) {
        // Delegate to standard space access evaluation with 'openWindow' action
        return this.evaluateSpaceAccess({
            spaceId: params.spaceId,
            action: 'openWindow',
            security: params.security,
        });
    }
    // ═══════════════════════════════════════════════════════════════════════
    // PHASE P: VISIBILITY CHECKS
    // ═══════════════════════════════════════════════════════════════════════
    /**
     * Phase P: Check if a capability can be discovered/visible in a space
     * Used by Finder-like discovery sources.
     * @returns true if capability can be opened in the space
     */
    canDiscoverCapabilityInSpace(params) {
        // Check if opening is allowed in this space
        const decision = this.evaluateSpaceAccess({
            spaceId: params.spaceId,
            action: 'openWindow',
            security: params.security,
        });
        return decision.type === 'allow';
    }
    /**
     * Phase P: Check if a window is visible in the active space
     * @returns true if window.spaceId matches activeSpaceId AND canAccess is allowed
     */
    isWindowVisibleInSpace(params) {
        // Window must be in active space
        if (params.windowSpaceId !== params.activeSpaceId) {
            return false;
        }
        // Check if access is allowed in the space
        const decision = this.evaluateSpaceAccess({
            spaceId: params.activeSpaceId,
            action: 'access',
            security: params.security,
        });
        return decision.type === 'allow';
    }
    /**
     * Phase P: Check if focus is allowed for a window in the active space
     * @returns true if window is visible AND canFocusWindow is allowed
     */
    canFocusWindowInSpace(params) {
        // Window must be in active space first
        if (params.windowSpaceId !== params.activeSpaceId) {
            return false;
        }
        // Check if focus is allowed in the space
        const decision = this.evaluateSpaceAccess({
            spaceId: params.activeSpaceId,
            action: 'focusWindow',
            security: params.security,
        });
        return decision.type === 'allow';
    }
    /**
     * Clear all space policies (for testing)
     */
    clearSpacePolicies() {
        this.spacePolicies.clear();
    }
    // ═══════════════════════════════════════════════════════════════════════
    // DECISION HELPERS
    // ═══════════════════════════════════════════════════════════════════════
    /**
     * Check if a decision allows the action
     */
    isAllowed(decision) {
        return decision.type === 'allow';
    }
    /**
     * Check if step-up is required
     */
    requiresStepUp(decision) {
        return decision.type === 'require_stepup';
    }
    /**
     * Check if explicitly denied
     */
    isDenied(decision) {
        return decision.type === 'deny';
    }
    /**
     * Check if degraded to fallback
     */
    isDegraded(decision) {
        return decision.type === 'degrade';
    }
    // ═══════════════════════════════════════════════════════════════════════════
    // PHASE R: DECISION EXPLANATION BUILDERS (Pure Functions)
    // ═══════════════════════════════════════════════════════════════════════════
    /**
     * Phase R: Build explanation for space access decision
     * Pure function - deterministic and replayable
     */
    explainSpaceAccessDecision(params) {
        const { decision, intentType, correlationId, spaceId, action, windowId } = params;
        if (decision.type === 'allow') {
            return {
                decision: 'ALLOW',
                intentType,
                correlationId,
                spaceId,
                windowId,
                policyDomain: 'SpacePolicy',
                reasonChain: [
                    `SpacePolicy for ${spaceId}`,
                    `Action: ${action}`,
                    `Permission granted`,
                ],
                timestamp: Date.now(),
            };
        }
        // Deny case
        const reasonChain = [
            `SpacePolicy for ${spaceId}`,
            `Action: ${action}`,
        ];
        // Build reason chain from high-level to low-level
        if (decision.reason.includes('canAccess')) {
            reasonChain.push('Permission: canAccess = false');
        }
        else if (decision.reason.includes('canOpenWindow')) {
            reasonChain.push('Permission: canOpenWindow = false');
        }
        else if (decision.reason.includes('canFocusWindow')) {
            reasonChain.push('Permission: canFocusWindow = false');
        }
        else if (decision.reason.includes('canMoveWindow')) {
            reasonChain.push('Permission: canMoveWindow = false');
        }
        else {
            reasonChain.push(`Reason: ${decision.reason}`);
        }
        return {
            decision: 'DENY',
            intentType,
            correlationId,
            spaceId,
            windowId,
            policyDomain: 'SpacePolicy',
            failedRule: this.extractFailedRule(decision.reason),
            reasonChain,
            timestamp: Date.now(),
        };
    }
    /**
     * Phase R: Build explanation for capability policy decision
     * Pure function - deterministic and replayable
     */
    explainCapabilityDecision(params) {
        const { decision, intentType, correlationId, capabilityId, spaceId } = params;
        if (decision.type === 'allow') {
            return {
                decision: 'ALLOW',
                intentType,
                correlationId,
                capabilityId,
                spaceId,
                policyDomain: 'CapabilityPolicy',
                reasonChain: [
                    `CapabilityPolicy for ${capabilityId}`,
                    `Access granted`,
                ],
                timestamp: Date.now(),
            };
        }
        if (decision.type === 'deny') {
            return {
                decision: 'DENY',
                intentType,
                correlationId,
                capabilityId,
                spaceId,
                policyDomain: 'CapabilityPolicy',
                failedRule: decision.reason,
                reasonChain: [
                    `CapabilityPolicy for ${capabilityId}`,
                    `Denied: ${decision.reason}`,
                ],
                timestamp: Date.now(),
            };
        }
        // require_stepup or degrade - treated as SKIP for explanation purposes
        const skipReason = decision.type === 'require_stepup'
            ? `Step-up required: ${decision.challenge}`
            : `Degraded to: ${decision.fallback}`;
        return {
            decision: 'SKIP',
            intentType,
            correlationId,
            capabilityId,
            spaceId,
            policyDomain: 'CapabilityPolicy',
            failedRule: decision.type,
            reasonChain: [
                `CapabilityPolicy for ${capabilityId}`,
                skipReason,
            ],
            timestamp: Date.now(),
        };
    }
    /**
     * Phase R: Build explanation for WindowManager skip
     */
    explainWindowManagerSkip(params) {
        const { intentType, correlationId, capabilityId, windowId, spaceId, failedRule, reason } = params;
        return {
            decision: 'SKIP',
            intentType,
            correlationId,
            capabilityId,
            windowId,
            spaceId,
            policyDomain: 'WindowManager',
            failedRule,
            reasonChain: [
                'WindowManager validation',
                `Rule: ${failedRule}`,
                reason,
            ],
            timestamp: Date.now(),
        };
    }
    /**
     * Extract failed rule from reason string
     */
    extractFailedRule(reason) {
        const match = reason.match(/(can\w+)/);
        return match ? match[1] : reason;
    }
}
exports.CoreOSPolicyEngine = CoreOSPolicyEngine;
// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON
// ═══════════════════════════════════════════════════════════════════════════
let instance = null;
function getPolicyEngine() {
    if (!instance) {
        instance = new CoreOSPolicyEngine();
    }
    return instance;
}
function resetPolicyEngine() {
    instance = null;
}
//# sourceMappingURL=index.js.map