/**
 * ═══════════════════════════════════════════════════════════════════════════
 * RUNTIME POLICY TYPES (Phase 35C — Runtime Isolation Level 2)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Core type definitions for the Runtime Policy Engine.
 * All policy decisions flow through these contracts.
 *
 * @module coreos/brain/policy/policyTypes
 */

// ═══════════════════════════════════════════════════════════════════════════
// ACTION CLASSIFICATION
// ═══════════════════════════════════════════════════════════════════════════

/** Tool action classification for policy evaluation */
export type ToolActionType = 'READ' | 'PROPOSE' | 'EXECUTE' | 'DELETE' | 'ADMIN';

/** Risk level for graduated enforcement */
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

/** Policy decision outcomes */
export type PolicyDecisionType = 'ALLOW' | 'DENY' | 'REQUIRE_APPROVAL' | 'REQUIRE_OWNER';

// ═══════════════════════════════════════════════════════════════════════════
// POLICY INPUT / OUTPUT
// ═══════════════════════════════════════════════════════════════════════════

/** Input to the policy engine for every tool call evaluation */
export interface PolicyInput {
    /** Tool being invoked */
    toolName: string;
    /** Classified action type */
    actionType: ToolActionType;
    /** App scope (e.g. 'core.notes') */
    appScope: string;
    /** Actor role */
    actorRole: 'owner' | 'admin' | 'user' | 'system';
    /** Environment */
    environment: 'preview' | 'production';
    /** Request source */
    requestSource: 'browser' | 'ci' | 'worker' | 'api';
    /** Unique nonce for anti-replay */
    nonce: string;
    /** SHA-256 hash of tool call arguments */
    argsHash: string;
    /** Signed approval argsHash (if execute was pre-approved) */
    approvalArgsHash?: string;
    /** Correlation ID for audit trail */
    correlationId: string;
    /** Timestamp of request */
    timestamp: number;
}

/** Policy engine evaluation result */
export interface PolicyDecision {
    /** Decision outcome */
    decision: PolicyDecisionType;
    /** Human-readable reasons for the decision */
    reasons: PolicyReason[];
    /** Risk level assessed */
    riskLevel: RiskLevel;
    /** Evaluated policy version */
    policyVersion: string;
    /** Timestamp of evaluation */
    evaluatedAt: number;
}

/** Individual reason for a policy decision */
export interface PolicyReason {
    /** Rule identifier (e.g. 'SCOPE_CHECK', 'NONCE_REPLAY') */
    ruleId: string;
    /** Human-readable description */
    message: string;
    /** Whether this reason caused a block */
    blocking: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// TOOL FIREWALL
// ═══════════════════════════════════════════════════════════════════════════

/** Tool Firewall check result */
export interface FirewallResult {
    /** Whether the tool call passed firewall checks */
    allowed: boolean;
    /** Normalized tool name */
    normalizedToolName: string;
    /** Computed arguments hash */
    computedArgsHash: string;
    /** Reason if blocked */
    blockReason?: string;
    /** Firewall check details */
    checks: FirewallCheck[];
}

/** Individual firewall check */
export interface FirewallCheck {
    checkName: string;
    passed: boolean;
    detail?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// WORKER GUARD
// ═══════════════════════════════════════════════════════════════════════════

/** Input to the worker-level execution guard */
export interface GuardInput {
    /** Tool being executed */
    toolName: string;
    /** Nonce from gateway */
    nonce: string;
    /** App scope token */
    scopeToken: string;
    /** Arguments hash */
    argsHash: string;
    /** Approval signature hash (if exists) */
    approvalArgsHash?: string;
    /** Policy decision from gateway */
    policyDecision: PolicyDecisionType;
    /** Correlation ID */
    correlationId: string;
}

/** Worker guard verification result */
export interface GuardResult {
    /** Whether execution is permitted */
    permitted: boolean;
    /** Block reason if not permitted */
    blockReason?: string;
    /** Checks performed */
    checks: { name: string; passed: boolean; detail?: string }[];
}

// ═══════════════════════════════════════════════════════════════════════════
// AUDIT EVENTS
// ═══════════════════════════════════════════════════════════════════════════

/** Audit event types for policy decisions */
export type PolicyAuditEventType =
    | 'POLICY_EVAL'
    | 'EXECUTION_BLOCKED'
    | 'EXECUTION_ALLOWED'
    | 'NONCE_REPLAY_BLOCKED'
    | 'ARGS_HASH_MISMATCH'
    | 'RATE_LIMIT_HIT'
    | 'FIREWALL_BLOCKED'
    | 'GUARD_BLOCKED';

/** Structured audit event for policy decisions */
export interface PolicyAuditEvent {
    eventType: PolicyAuditEventType;
    timestamp: number;
    correlationId: string;
    toolName: string;
    appScope: string;
    actorRole: string;
    decision?: PolicyDecisionType;
    riskLevel?: RiskLevel;
    reasons?: PolicyReason[];
    argsHash?: string;
    nonce?: string;
    metadata?: Record<string, unknown>;
}

// ═══════════════════════════════════════════════════════════════════════════
// SCOPE MATRIX TYPES
// ═══════════════════════════════════════════════════════════════════════════

/** Scope tool allowlist entry */
export interface ScopeAllowlistEntry {
    /** Allowed tool name patterns (prefix match with wildcard) */
    allowedPatterns: string[];
    /** Maximum risk level allowed without approval */
    maxAutoRiskLevel: RiskLevel;
}

/** Tool risk classification entry */
export interface ToolRiskEntry {
    /** Tool name prefix pattern */
    pattern: string;
    /** Classified action type */
    actionType: ToolActionType;
    /** Risk level */
    riskLevel: RiskLevel;
}

/** Role minimum requirements per action type */
export type RoleRequirementMap = Record<ToolActionType, 'user' | 'admin' | 'owner'>;
