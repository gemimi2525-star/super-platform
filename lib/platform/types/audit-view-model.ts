/**
 * Audit View Model Types
 * 
 * Phase 13: Governance Legibility & Actor Truth
 * 
 * Platform-layer view model for audit logs with enriched actor information,
 * status categorization, and SYNAPSE decision linkage.
 * 
 * CRITICAL: This is a VIEW MODEL layer only - does NOT modify SYNAPSE Kernel
 */

/**
 * Audit entry status categorization for UI display.
 * 
 * - SUCCESS: Operation succeeded as intended
 * - DENIED: Access denied by policy/permission rules (not an error)
 * - FAILED: Operation failed due to error/exception
 * - INFO: Informational event (e.g., login, view)
 */
export type AuditStatus = 'SUCCESS' | 'DENIED' | 'FAILED' | 'INFO';

/**
 * Actor information with kind identification.
 * 
 * Resolves actor truth to show who performed the action:
 * - user: Human user from session
 * - service: Service account or API integration
 * - system: Background/automated system process
 */
export interface AuditActor {
    kind: 'user' | 'service' | 'system';
    displayName: string;  // Email for users, service name, or "system"
    actorId?: string;     // UID or service identifier
}

/**
 * Human-readable reason for audit event outcome.
 * 
 * Provides context for DENIED or FAILED events.
 */
export interface AuditReason {
    code: string;         // Machine-readable code (e.g., 'POLICY_VIOLATION')
    summary: string;      // Human-readable explanation
}

/**
 * SYNAPSE decision information (if linked).
 * 
 * Links platform audit events to SYNAPSE Kernel decisions.
 */
export interface AuditDecisionInfo {
    decision: 'ALLOW' | 'DENY' | 'SKIP';
    policyId?: string;
    capability?: string;
    ruleHit?: string;
}

/**
 * Ledger verification result.
 * 
 * Shows whether audit entry exists in SYNAPSE Ledger.
 */
export interface LedgerVerification {
    found: boolean;
    verified: boolean;
    ledgerIndex?: number;
    hash?: string;
    chainValid?: boolean;
}

/**
 * Complete audit view model for UI consumption.
 * 
 * This is the enriched format returned by the platform API
 * and consumed by the Ops Center Audit Trail UI.
 */
export interface AuditViewModel {
    id: string;
    traceId: string;
    action: string;
    status: AuditStatus;
    actor: AuditActor;
    reason?: AuditReason;
    decision?: AuditDecisionInfo;
    timestamp: string;              // ISO 8601 format
    rawPayload?: Record<string, unknown>;  // Original data (may be truncated)
}
