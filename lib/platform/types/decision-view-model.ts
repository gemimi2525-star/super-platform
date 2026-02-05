/**
 * Decision View Model
 * 
 * Phase 14.3: Live Governance View
 * 
 * Types for governance decision information in audit logs.
 * These represent platform-layer policy decisions (not SYNAPSE kernel yet).
 */

/**
 * Decision outcome from policy evaluation
 */
export type DecisionOutcome = 'ALLOW' | 'DENY' | 'SKIP';

/**
 * Severity level for decision impact
 */
export type DecisionSeverity = 'low' | 'med' | 'high';

/**
 * Complete decision information
 */
export interface DecisionInfo {
    /** Policy decision outcome */
    outcome: DecisionOutcome;

    /** Policy key that was evaluated */
    policyKey?: string;

    /** Human-readable reason for the decision */
    reason?: string;

    /** Capability being accessed (e.g., "ops.center", "system.configure") */
    capability?: string;

    /** Severity of the decision impact */
    severity?: DecisionSeverity;
}

/**
 * Extended audit entry with decision
 */
export interface AuditEntryWithDecision {
    id: string;
    traceId: string;
    timestamp: Date;
    action: string;

    // Actor
    actorId: string;
    actorEmail?: string;
    actorRole?: string;

    // Target
    target?: Record<string, unknown>;
    metadata?: Record<string, unknown>;

    // Decision (Phase 14.3)
    decision: DecisionInfo;

    // Status (execution result, distinct from decision)
    success: boolean;
    status: 'SUCCESS' | 'DENIED' | 'FAILED' | 'INFO';

    // Source
    source?: string;
}
