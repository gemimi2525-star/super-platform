/**
 * ═══════════════════════════════════════════════════════════════════════════
 * BRAIN PROPOSAL TYPES (Phase 25A — Brain Skeleton)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Firestore schema + domain types for the Brain Proposal system.
 * Separated from existing brain/types.ts to avoid coupling.
 *
 * HARDENING: Does NOT modify gateway.ts, execution.ts, or Signed Ticket.
 *
 * @module coreos/brain/brain-proposal-types
 * @version 1.0.0
 */

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

export const COLLECTION_BRAIN_PROPOSALS = 'brain_proposals';

/** Rate limit: max proposes per hour per uid */
export const RATE_LIMIT_PROPOSALS_PER_HOUR = 20;

/** Blocked destructive action keywords */
export const BLOCKED_ACTIONS = [
    'delete', 'revoke', 'rotateKey', 'dropCollection',
    'modifyGovernance', 'purge', 'destroy', 'wipe',
    'removeUser', 'revokeAccess', 'resetSystem',
] as const;

/** Scope → allowed resource types mapping */
export const SCOPE_BOUNDARIES: Record<BrainScope, string[]> = {
    notes: ['notes', 'documents'],
    files: ['files', 'storage', 'uploads'],
    ops: ['metrics', 'alerts', 'workers', 'jobs'],
    jobs: ['jobs', 'queues', 'scheduler'],
};

/** Scope → forbidden resource types */
export const SCOPE_FORBIDDEN: Record<BrainScope, string[]> = {
    notes: ['files', 'secrets', 'env', 'workers'],
    files: ['notes', 'secrets', 'env', 'workers'],
    ops: ['notes', 'files', 'secrets'],
    jobs: ['secrets', 'env', 'notes', 'files'],
};

// ═══════════════════════════════════════════════════════════════════════════
// ENUMS & TYPES
// ═══════════════════════════════════════════════════════════════════════════

/** Allowed scopes for Brain proposals */
export type BrainScope = 'notes' | 'files' | 'ops' | 'jobs';

/** Proposal lifecycle status */
export type ProposalStatus = 'PROPOSED' | 'APPROVED' | 'REJECTED';

/** Risk level for each proposed step */
export type RiskLevel = 'low' | 'medium' | 'high';

// ═══════════════════════════════════════════════════════════════════════════
// PROPOSAL STEP
// ═══════════════════════════════════════════════════════════════════════════

/** A single step within a proposal */
export interface ProposalStep {
    /** Tool/action to be performed */
    toolName: string;
    /** Human-readable description of intent */
    intent: string;
    /** Risk classification */
    riskLevel: RiskLevel;
    /** Always true in DRAFTER mode */
    requiresApproval: true;
}

// ═══════════════════════════════════════════════════════════════════════════
// PROPOSAL CONTENT (LLM output)
// ═══════════════════════════════════════════════════════════════════════════

/** The structured output from LLM */
export interface ProposalContent {
    /** Human-readable summary */
    summary: string;
    /** Ordered list of steps */
    steps: ProposalStep[];
    /** Description of estimated impact */
    estimatedImpact: string;
    /** Actions that were requested but blocked by safety rules */
    blockedActions: string[];
}

// ═══════════════════════════════════════════════════════════════════════════
// AUDIT EVENT (append-only)
// ═══════════════════════════════════════════════════════════════════════════

/** Audit trail event */
export interface ProposalAuditEvent {
    /** Event type */
    event: 'CREATED' | 'APPROVED' | 'REJECTED';
    /** Event timestamp (epoch ms) */
    timestamp: number;
    /** UID of actor */
    uid: string;
    /** Additional metadata */
    metadata?: Record<string, any>;
}

// ═══════════════════════════════════════════════════════════════════════════
// FIRESTORE DOCUMENT
// ═══════════════════════════════════════════════════════════════════════════

/** Firestore document schema for brain_proposals collection */
export interface BrainProposal {
    /** Document ID (auto-generated) */
    id?: string;
    /** Creation timestamp (epoch ms) */
    createdAt: number;
    /** UID of the user who created the proposal */
    createdByUid: string;
    /** Scope of the proposal */
    scope: BrainScope;
    /** User's goal/intent in natural language */
    userGoal: string;
    /** The structured proposal content */
    proposal: ProposalContent;
    /** Current status */
    status: ProposalStatus;
    /** Approval timestamp (epoch ms) */
    approvedAt?: number;
    /** UID of the approver */
    approvedByUid?: string;
    /** Append-only audit trail */
    auditTrail: ProposalAuditEvent[];
}
