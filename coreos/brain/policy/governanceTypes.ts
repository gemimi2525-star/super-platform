/**
 * ═══════════════════════════════════════════════════════════════════════════
 * GOVERNANCE TYPES (Phase 35D — Autonomous Governance Enforcement)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Type contracts for the Governance Reaction Engine.
 * Defines modes, triggers, actions, state shape, and audit events.
 *
 * @module coreos/brain/policy/governanceTypes
 */

// ═══════════════════════════════════════════════════════════════════════════
// GOVERNANCE MODES
// ═══════════════════════════════════════════════════════════════════════════

/** Governance operating modes (graduated severity) */
export type GovernanceMode = 'NORMAL' | 'THROTTLED' | 'SOFT_LOCK' | 'HARD_FREEZE';

/** Actions the governance engine can autonomously take */
export type GovernanceAction =
    | 'SOFT_LOCK'
    | 'HARD_FREEZE'
    | 'ALERT_OWNER'
    | 'THROTTLE_RATE'
    | 'BLOCK_PROMOTION';

/** Trigger types that cause governance reactions */
export type GovernanceTrigger =
    | 'INTEGRITY_FAILURE'
    | 'POLICY_BURST'
    | 'NONCE_REPLAY_FLOOD'
    | 'LEDGER_MISMATCH';

// ═══════════════════════════════════════════════════════════════════════════
// GOVERNANCE STATE
// ═══════════════════════════════════════════════════════════════════════════

/** Global governance state — singleton, in-memory */
export interface GovernanceState {
    /** Current operating mode */
    mode: GovernanceMode;
    /** Human-readable reason for current mode */
    reason: string;
    /** Timestamp when current mode was triggered */
    triggeredAt: number;
    /** Trigger that caused the current mode */
    triggeredBy: GovernanceTrigger | 'SYSTEM_INIT' | 'OWNER_OVERRIDE';
    /** Sliding window violation counters */
    violationCounts: {
        policyDeny: number;
        nonceReplay: number;
        integrityFail: number;
        ledgerMismatch: number;
    };
    /** Last integrity check result */
    lastIntegrityCheck: {
        hashValid: boolean;
        kernelFrozen: boolean;
        checkedAt: number;
    } | null;
    /** Whether promotion is blocked */
    promotionBlocked: boolean;
    /** Soft-lock expiry timestamp (0 = no expiry) */
    lockExpiresAt: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// GOVERNANCE REACTIONS
// ═══════════════════════════════════════════════════════════════════════════

/** A reaction event produced by the governance engine */
export interface GovernanceReaction {
    /** Trigger that caused this reaction */
    trigger: GovernanceTrigger;
    /** Actions taken */
    actions: GovernanceAction[];
    /** Severity level */
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    /** Timestamp */
    timestamp: number;
    /** Detail string */
    detail: string;
    /** Previous mode before reaction */
    previousMode: GovernanceMode;
    /** New mode after reaction */
    newMode: GovernanceMode;
}

// ═══════════════════════════════════════════════════════════════════════════
// GOVERNANCE THRESHOLDS
// ═══════════════════════════════════════════════════════════════════════════

/** Configurable thresholds for governance triggers */
export interface GovernanceThresholds {
    /** Policy DENY count to trigger THROTTLE (within window) */
    policyBurstLimit: number;
    /** Nonce replay count to trigger SOFT_LOCK (within window) */
    nonceReplayLimit: number;
    /** Sliding window duration in ms */
    windowMs: number;
    /** Soft-lock duration in ms */
    softLockDurationMs: number;
}

/** Default thresholds */
export const DEFAULT_GOVERNANCE_THRESHOLDS: GovernanceThresholds = {
    policyBurstLimit: 5,
    nonceReplayLimit: 3,
    windowMs: 60_000,      // 1 minute
    softLockDurationMs: 60_000, // 60 seconds
};

// ═══════════════════════════════════════════════════════════════════════════
// GOVERNANCE AUDIT EVENT TYPES (extends PolicyAuditEventType)
// ═══════════════════════════════════════════════════════════════════════════

/** Governance-specific audit event types */
export type GovernanceAuditEventType =
    | 'GOVERNANCE_FREEZE'
    | 'GOVERNANCE_THROTTLE'
    | 'GOVERNANCE_LOCK'
    | 'GOVERNANCE_OVERRIDE'
    | 'GOVERNANCE_BLOCK_PROMOTION';
