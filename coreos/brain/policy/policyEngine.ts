/**
 * ═══════════════════════════════════════════════════════════════════════════
 * RUNTIME POLICY ENGINE (Phase 35C — Runtime Isolation Level 2)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Central policy evaluator. Every tool call must pass through this engine
 * before execution. Implements a 9-rule chain with short-circuit logic.
 *
 * Defense-in-depth: This is Layer 1 (Gateway). WorkerGuard is Layer 2.
 *
 * @module coreos/brain/policy/policyEngine
 */

import type {
    PolicyInput,
    PolicyDecision,
    PolicyReason,
    ToolActionType,
    RiskLevel,
} from './policyTypes';

import {
    POLICY_VERSION,
    SCOPE_TOOL_ALLOWLIST,
    RATE_LIMITS,
    NONCE_TTL_MS,
    classifyTool,
    isToolAllowedForScope,
    isDestructiveTool,
    roleMeetsRequirement,
    ROLE_REQUIREMENTS,
} from './policyMatrix';

import { policyAuditLogger } from './policyAudit';

// ═══════════════════════════════════════════════════════════════════════════
// INTERNAL STATE
// ═══════════════════════════════════════════════════════════════════════════

/** Used nonces with timestamps for anti-replay */
const usedNonces: Map<string, number> = new Map();

/** Rate limit counters: key = `${actionType}` → timestamps[] */
const rateBuckets: Map<string, number[]> = new Map();

// ═══════════════════════════════════════════════════════════════════════════
// NONCE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

/** Clean expired nonces (older than TTL) */
function cleanExpiredNonces(): void {
    const cutoff = Date.now() - NONCE_TTL_MS;
    for (const [nonce, ts] of usedNonces.entries()) {
        if (ts < cutoff) {
            usedNonces.delete(nonce);
        }
    }
}

/** Check and register a nonce. Returns false if replay detected. */
function checkAndRegisterNonce(nonce: string): boolean {
    cleanExpiredNonces();
    if (usedNonces.has(nonce)) {
        return false; // Replay!
    }
    usedNonces.set(nonce, Date.now());
    return true;
}

/** Get current nonce pool size (for diagnostics) */
export function getNoncePoolSize(): number {
    cleanExpiredNonces();
    return usedNonces.size;
}

// ═══════════════════════════════════════════════════════════════════════════
// RATE LIMITING
// ═══════════════════════════════════════════════════════════════════════════

/** Check rate limit for an action type. Returns false if exceeded. */
function checkRateLimit(actionType: ToolActionType): boolean {
    const now = Date.now();
    const windowMs = 60_000; // 1 minute window
    const limit = RATE_LIMITS[actionType] || 10;

    const key = actionType;
    const bucket = rateBuckets.get(key) || [];

    // Prune old entries
    const active = bucket.filter(ts => now - ts < windowMs);

    if (active.length >= limit) {
        rateBuckets.set(key, active);
        return false; // Rate limit exceeded
    }

    active.push(now);
    rateBuckets.set(key, active);
    return true;
}

// ═══════════════════════════════════════════════════════════════════════════
// RISK LEVEL COMPARISON
// ═══════════════════════════════════════════════════════════════════════════

const RISK_ORDER: Record<RiskLevel, number> = {
    'LOW': 1,
    'MEDIUM': 2,
    'HIGH': 3,
    'CRITICAL': 4,
};

function isRiskAbove(actual: RiskLevel, max: RiskLevel): boolean {
    return RISK_ORDER[actual] > RISK_ORDER[max];
}

// ═══════════════════════════════════════════════════════════════════════════
// POLICY EVALUATION — 9-RULE CHAIN
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Evaluate execution policy for a tool call.
 * Returns a PolicyDecision with the outcome, reasons, and risk level.
 *
 * Rules chain (short-circuit on first DENY):
 * 1. Scope check — tool must be in scope allowlist
 * 2. Destructive denylist — destructive tools need owner approval
 * 3. Role check — actor role must meet minimum for action type
 * 4. Rate limit — action rate must be within limits
 * 5. Nonce anti-replay — nonce must not be reused
 * 6. ArgsHash invariant — approved hash must match execution hash
 * 7. Production execute gate — production execute needs owner
 * 8. High-risk gate — high-risk actions need approval
 * 9. All clear → ALLOW
 */
export function evaluateExecutionPolicy(input: PolicyInput): PolicyDecision {
    const reasons: PolicyReason[] = [];
    const { actionType, riskLevel } = classifyTool(input.toolName);

    // Override input classification with computed values
    const effectiveActionType = input.actionType || actionType;
    const effectiveRisk = riskLevel;

    // ─────────────────────────────────────────────────────────────────────
    // Rule 1: SCOPE CHECK — tool must be in app scope allowlist
    // ─────────────────────────────────────────────────────────────────────
    if (!isToolAllowedForScope(input.toolName, input.appScope)) {
        reasons.push({
            ruleId: 'SCOPE_CHECK',
            message: `Tool '${input.toolName}' is not allowed for scope '${input.appScope}'`,
            blocking: true,
        });

        const decision: PolicyDecision = {
            decision: 'DENY',
            reasons,
            riskLevel: effectiveRisk,
            policyVersion: POLICY_VERSION,
            evaluatedAt: Date.now(),
        };

        policyAuditLogger.record({
            eventType: 'EXECUTION_BLOCKED',
            timestamp: Date.now(),
            correlationId: input.correlationId,
            toolName: input.toolName,
            appScope: input.appScope,
            actorRole: input.actorRole,
            decision: 'DENY',
            riskLevel: effectiveRisk,
            reasons,
            argsHash: input.argsHash,
            nonce: input.nonce,
        });

        return decision;
    }

    reasons.push({ ruleId: 'SCOPE_CHECK', message: 'Tool is allowed for scope', blocking: false });

    // ─────────────────────────────────────────────────────────────────────
    // Rule 2: DESTRUCTIVE DENYLIST
    // ─────────────────────────────────────────────────────────────────────
    if (isDestructiveTool(input.toolName)) {
        if (input.actorRole !== 'owner') {
            reasons.push({
                ruleId: 'DESTRUCTIVE_DENY',
                message: `Destructive tool '${input.toolName}' requires owner role`,
                blocking: true,
            });

            const decision: PolicyDecision = {
                decision: 'DENY',
                reasons,
                riskLevel: 'CRITICAL',
                policyVersion: POLICY_VERSION,
                evaluatedAt: Date.now(),
            };

            policyAuditLogger.record({
                eventType: 'EXECUTION_BLOCKED',
                timestamp: Date.now(),
                correlationId: input.correlationId,
                toolName: input.toolName,
                appScope: input.appScope,
                actorRole: input.actorRole,
                decision: 'DENY',
                riskLevel: 'CRITICAL',
                reasons,
            });

            return decision;
        }

        reasons.push({ ruleId: 'DESTRUCTIVE_DENY', message: 'Owner role confirmed for destructive tool', blocking: false });
    }

    // ─────────────────────────────────────────────────────────────────────
    // Rule 3: ROLE CHECK
    // ─────────────────────────────────────────────────────────────────────
    const requiredRole = ROLE_REQUIREMENTS[effectiveActionType];
    if (!roleMeetsRequirement(input.actorRole, requiredRole)) {
        reasons.push({
            ruleId: 'ROLE_CHECK',
            message: `Role '${input.actorRole}' insufficient for '${effectiveActionType}' (requires '${requiredRole}')`,
            blocking: true,
        });

        const decision: PolicyDecision = {
            decision: 'DENY',
            reasons,
            riskLevel: effectiveRisk,
            policyVersion: POLICY_VERSION,
            evaluatedAt: Date.now(),
        };

        policyAuditLogger.record({
            eventType: 'EXECUTION_BLOCKED',
            timestamp: Date.now(),
            correlationId: input.correlationId,
            toolName: input.toolName,
            appScope: input.appScope,
            actorRole: input.actorRole,
            decision: 'DENY',
            riskLevel: effectiveRisk,
            reasons,
        });

        return decision;
    }

    reasons.push({ ruleId: 'ROLE_CHECK', message: `Role '${input.actorRole}' meets requirement`, blocking: false });

    // ─────────────────────────────────────────────────────────────────────
    // Rule 4: RATE LIMIT
    // ─────────────────────────────────────────────────────────────────────
    if (!checkRateLimit(effectiveActionType)) {
        reasons.push({
            ruleId: 'RATE_LIMIT',
            message: `Rate limit exceeded for action type '${effectiveActionType}'`,
            blocking: true,
        });

        const decision: PolicyDecision = {
            decision: 'DENY',
            reasons,
            riskLevel: effectiveRisk,
            policyVersion: POLICY_VERSION,
            evaluatedAt: Date.now(),
        };

        policyAuditLogger.record({
            eventType: 'RATE_LIMIT_HIT',
            timestamp: Date.now(),
            correlationId: input.correlationId,
            toolName: input.toolName,
            appScope: input.appScope,
            actorRole: input.actorRole,
            decision: 'DENY',
            riskLevel: effectiveRisk,
            reasons,
        });

        return decision;
    }

    reasons.push({ ruleId: 'RATE_LIMIT', message: 'Within rate limit', blocking: false });

    // ─────────────────────────────────────────────────────────────────────
    // Rule 5: NONCE ANTI-REPLAY
    // ─────────────────────────────────────────────────────────────────────
    if (!checkAndRegisterNonce(input.nonce)) {
        reasons.push({
            ruleId: 'NONCE_REPLAY',
            message: `Nonce '${input.nonce.substring(0, 8)}...' already used (replay detected)`,
            blocking: true,
        });

        const decision: PolicyDecision = {
            decision: 'DENY',
            reasons,
            riskLevel: effectiveRisk,
            policyVersion: POLICY_VERSION,
            evaluatedAt: Date.now(),
        };

        policyAuditLogger.record({
            eventType: 'NONCE_REPLAY_BLOCKED',
            timestamp: Date.now(),
            correlationId: input.correlationId,
            toolName: input.toolName,
            appScope: input.appScope,
            actorRole: input.actorRole,
            decision: 'DENY',
            riskLevel: effectiveRisk,
            reasons,
            nonce: input.nonce,
        });

        return decision;
    }

    reasons.push({ ruleId: 'NONCE_REPLAY', message: 'Nonce is fresh', blocking: false });

    // ─────────────────────────────────────────────────────────────────────
    // Rule 6: ARGS HASH INVARIANT (approve → execute)
    // ─────────────────────────────────────────────────────────────────────
    if (input.approvalArgsHash && input.argsHash !== input.approvalArgsHash) {
        reasons.push({
            ruleId: 'ARGS_HASH_MISMATCH',
            message: `ArgsHash mismatch: execution='${input.argsHash}' ≠ approval='${input.approvalArgsHash}'`,
            blocking: true,
        });

        const decision: PolicyDecision = {
            decision: 'DENY',
            reasons,
            riskLevel: effectiveRisk,
            policyVersion: POLICY_VERSION,
            evaluatedAt: Date.now(),
        };

        policyAuditLogger.record({
            eventType: 'ARGS_HASH_MISMATCH',
            timestamp: Date.now(),
            correlationId: input.correlationId,
            toolName: input.toolName,
            appScope: input.appScope,
            actorRole: input.actorRole,
            decision: 'DENY',
            riskLevel: effectiveRisk,
            reasons,
            argsHash: input.argsHash,
        });

        return decision;
    }

    if (input.approvalArgsHash) {
        reasons.push({ ruleId: 'ARGS_HASH_MISMATCH', message: 'ArgsHash matches approval', blocking: false });
    }

    // ─────────────────────────────────────────────────────────────────────
    // Rule 7: PRODUCTION EXECUTE GATE
    // ─────────────────────────────────────────────────────────────────────
    if (input.environment === 'production' && effectiveActionType === 'EXECUTE' && input.actorRole !== 'owner') {
        reasons.push({
            ruleId: 'PROD_EXECUTE_GATE',
            message: 'Production execute requires owner role',
            blocking: true,
        });

        const decision: PolicyDecision = {
            decision: 'REQUIRE_OWNER',
            reasons,
            riskLevel: effectiveRisk,
            policyVersion: POLICY_VERSION,
            evaluatedAt: Date.now(),
        };

        policyAuditLogger.record({
            eventType: 'EXECUTION_BLOCKED',
            timestamp: Date.now(),
            correlationId: input.correlationId,
            toolName: input.toolName,
            appScope: input.appScope,
            actorRole: input.actorRole,
            decision: 'REQUIRE_OWNER',
            riskLevel: effectiveRisk,
            reasons,
        });

        return decision;
    }

    // ─────────────────────────────────────────────────────────────────────
    // Rule 8: HIGH-RISK GATE
    // ─────────────────────────────────────────────────────────────────────
    const scopeEntry = SCOPE_TOOL_ALLOWLIST[input.appScope];
    if (scopeEntry && isRiskAbove(effectiveRisk, scopeEntry.maxAutoRiskLevel)) {
        if (!input.approvalArgsHash) {
            reasons.push({
                ruleId: 'HIGH_RISK_GATE',
                message: `Risk '${effectiveRisk}' exceeds auto-allow '${scopeEntry.maxAutoRiskLevel}' — approval required`,
                blocking: true,
            });

            const decision: PolicyDecision = {
                decision: 'REQUIRE_APPROVAL',
                reasons,
                riskLevel: effectiveRisk,
                policyVersion: POLICY_VERSION,
                evaluatedAt: Date.now(),
            };

            policyAuditLogger.record({
                eventType: 'POLICY_EVAL',
                timestamp: Date.now(),
                correlationId: input.correlationId,
                toolName: input.toolName,
                appScope: input.appScope,
                actorRole: input.actorRole,
                decision: 'REQUIRE_APPROVAL',
                riskLevel: effectiveRisk,
                reasons,
            });

            return decision;
        }

        reasons.push({ ruleId: 'HIGH_RISK_GATE', message: 'Approval provided for high-risk action', blocking: false });
    }

    // ─────────────────────────────────────────────────────────────────────
    // Rule 9: ALL CLEAR → ALLOW
    // ─────────────────────────────────────────────────────────────────────
    reasons.push({ ruleId: 'ALL_CLEAR', message: 'All policy checks passed', blocking: false });

    const decision: PolicyDecision = {
        decision: 'ALLOW',
        reasons,
        riskLevel: effectiveRisk,
        policyVersion: POLICY_VERSION,
        evaluatedAt: Date.now(),
    };

    policyAuditLogger.record({
        eventType: 'EXECUTION_ALLOWED',
        timestamp: Date.now(),
        correlationId: input.correlationId,
        toolName: input.toolName,
        appScope: input.appScope,
        actorRole: input.actorRole,
        decision: 'ALLOW',
        riskLevel: effectiveRisk,
        reasons,
        argsHash: input.argsHash,
        nonce: input.nonce,
    });

    return decision;
}
