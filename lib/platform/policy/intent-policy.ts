/**
 * Intent Policy Evaluator
 * 
 * Phase 14.3: Live Governance View
 * 
 * Platform-layer policy evaluation for user intent events.
 * 
 * Design:
 * - Lightweight, deterministic rules
 * - Production-safe (no SYNAPSE kernel dependency yet)
 * - Expandable to full SYNAPSE integration later
 * 
 * IMPORTANT: This is NOT the SYNAPSE kernel. This is a platform-layer
 * policy evaluator specifically for intent events to demonstrate
 * governance visibility.
 */

import type { DecisionInfo, DecisionOutcome } from '../types/decision-view-model';
import type { IntentTarget } from '../types/intent-events';

/**
 * Environment type
 */
type Environment = 'production' | 'development' | 'staging';

/**
 * Policy evaluation parameters
 */
export interface PolicyEvaluationParams {
    /** Intent action (e.g., "os.app.open", "os.governance.bypass") */
    action: string;

    /** Target of the action */
    target?: IntentTarget;

    /** Additional metadata */
    meta?: Record<string, unknown>;

    /** Actor information from session */
    actor: {
        uid: string;
        email?: string;
        role?: string;
    };

    /** Current environment */
    env: Environment;
}

/**
 * Protected actions that are ALWAYS denied in production
 */
const PRODUCTION_PROTECTED_ACTIONS = [
    'os.governance.bypass',
    'os.kernel.modify',
    'os.system.configure',
] as const;

/**
 * Owner-only capabilities (for future RBAC)
 */
const OWNER_ONLY_CAPABILITIES = [
    'org.manage',
    'system.configure',
    'admin.panel',
] as const;

/**
 * Evaluate intent policy
 * 
 * @param params Policy evaluation parameters
 * @returns Decision information
 */
export function evaluateIntentPolicy(params: PolicyEvaluationParams): DecisionInfo {
    const { action, target, actor, env } = params;

    // ═══════════════════════════════════════════════════════════════════════════
    // RULE 1: Production Protected Actions
    // ═══════════════════════════════════════════════════════════════════════════
    if (env === 'production' && PRODUCTION_PROTECTED_ACTIONS.includes(action as any)) {
        return {
            outcome: 'DENY',
            policyKey: 'prod.protected_action',
            reason: 'Action is protected in production environment',
            capability: 'system.configure',
            severity: 'high',
        };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // RULE 2: Owner-Only Actions (Future RBAC)
    // ═══════════════════════════════════════════════════════════════════════════
    const isAdminAction = action.startsWith('os.admin.');
    const targetCapability = target?.appId as string;
    const isOwnerOnlyCapability = targetCapability && OWNER_ONLY_CAPABILITIES.includes(targetCapability as any);

    if ((isAdminAction || isOwnerOnlyCapability) && actor.role !== 'owner') {
        return {
            outcome: 'DENY',
            policyKey: 'rbac.owner_only',
            reason: 'Owner role required for this action',
            capability: targetCapability || 'admin',
            severity: 'med',
        };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // RULE 3: Default ALLOW
    // ═══════════════════════════════════════════════════════════════════════════
    // Normal user intents (os.app.open, os.view.switch, etc.) are allowed
    return {
        outcome: 'ALLOW',
        policyKey: 'default.allow',
        reason: 'Standard user intent',
        capability: target?.appId as string,
        severity: 'low',
    };
}

/**
 * Get current environment
 * 
 * @returns Current environment
 */
export function getCurrentEnvironment(): Environment {
    const env = process.env.NODE_ENV;
    const vercelEnv = process.env.VERCEL_ENV;

    if (vercelEnv === 'production' || env === 'production') {
        return 'production';
    }

    if (vercelEnv === 'preview') {
        return 'staging';
    }

    return 'development';
}
