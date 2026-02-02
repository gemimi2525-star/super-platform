/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SYNAPSE REASON CORE SCHEMA v1 (CANONICAL)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * The immutable source of truth for all system decisions.
 * This schema is deterministic, UI-agnostic, and AI-agnostic.
 * 
 * @version 1.0.0
 * @status FROZEN
 */

export const SCHEMA_VERSION = "1.0.0";

export type DecisionResult = 'ALLOW' | 'DENY' | 'ESCALATE';

export interface ReasonCode {
    readonly code: string;
    readonly category: 'SECURITY' | 'COMPLIANCE' | 'INTEGRITY' | 'BUSINESS';
    readonly description: string;
    readonly risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface IntentSummary {
    readonly action: string; // e.g., 'OPEN_CAPABILITY', 'SWITCH_SPACE'
    readonly target: string; // e.g., 'core.finder', 'space:default'
    readonly params: Record<string, unknown>; // JSON-serializable params
}

export interface ContextSnapshot {
    readonly systemState: string;
    readonly userRole: string;
    readonly resourceSensitivity: string;
    readonly activeConstraints: readonly string[];
}

export interface DecisionPackage {
    // Identity & Correlation
    readonly decisionId: string;
    readonly traceId: string;
    readonly timestamp: number;
    readonly actorId: string;
    readonly schemaVersion: typeof SCHEMA_VERSION;

    // Policy Binding
    readonly policyId: string;        // e.g., 'core.space.policy'
    readonly policyVersion: string;   // e.g., '1.0.0'
    readonly policyHash?: string;     // Optional: SHA-256 of policy definition

    // Intent Summary
    readonly intent: IntentSummary;

    // Context Snapshot
    readonly context: ContextSnapshot;

    // Decision
    readonly decision: DecisionResult;
}

export interface ReasonCore {
    readonly reason_codes: readonly ReasonCode[];
    readonly policy_refs: readonly string[]; // IDs of policies evaluated
    readonly rule_hits: readonly string[]; // IDs of specific rules triggered
    readonly evidence: Record<string, unknown>; // Data supporting the decision
    readonly missing_requirements: readonly string[]; // What was needed but missing
}

export interface DecisionRecord {
    readonly package: DecisionPackage;
    readonly reason: ReasonCore;

    // Audit & Verification
    readonly audit: {
        readonly ledger_ref: string; // Pointer to append-only log entry
        readonly previous_hash: string; // Hash chain link
        readonly signature: string; // Cryptographic proof (Ed25519 or equivalent)
        readonly signerId: string; // Identity of the Authority
    };
}
