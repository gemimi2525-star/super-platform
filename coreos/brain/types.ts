/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AI BRAIN TYPES (Phase 25A → Phase 19 DRAFTER)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Defines the contract for interacting with the Core OS "Single Brain".
 * Supporting Request/Response models, Tool definitions, and Proposal types.
 * 
 * Phase 19: Added ProposalAction for DRAFTER mode (propose-only)
 * 
 * @module coreos/brain/types
 */

import { CapabilityId } from '../types';

export type BrainRole = 'system' | 'user' | 'assistant' | 'tool';

export interface BrainMessage {
    role: BrainRole;
    content: string;
    name?: string; // For function calling
    tool_call_id?: string;
}

export interface BrainRequest {
    appId: string;
    correlationId: string;
    messages: BrainMessage[];
    locale?: string;
    userId?: string;
    context?: Record<string, any>; // Additional context (e.g. selected text)
    shadow?: boolean; // If true, AI observes/explains only (No Execution)
    appScope?: string; // Phase 19: App-scoped context (e.g. 'core.notes')
}

export interface BrainResponse {
    id: string;
    content?: string;
    tool_calls?: BrainToolCall[];
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

// Tool Contract
export interface BrainToolCall {
    id: string;
    type: 'function';
    function: {
        name: string;
        arguments: string; // JSON string
    };
}

export interface BrainTool {
    name: string;
    description: string;
    parameters: Record<string, any>; // JSON Schema
    requiredCapabilities: CapabilityId[]; // Security Scope
    handler: (args: any, context: ToolContext) => Promise<any>;
}

export interface ToolContext {
    appId: string;
    userId: string;
    correlationId: string;
    appScope?: string; // Phase 19: App scope for tool filtering
}

export type BrainStatus = 'idle' | 'processing' | 'error';

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 19: PROPOSAL TYPES (DRAFTER MODE)
// ═══════════════════════════════════════════════════════════════════════════

export type ProposalType = 'rewrite' | 'summarize' | 'structure' | 'organize' | 'recommend';

export interface ProposalAction {
    id: string;
    type: ProposalType;
    appId: string;
    title: string;
    description: string;
    preview?: string;        // ตัวอย่างผลลัพธ์
    confidence: number;      // 0-1
    requiresConfirm: true;   // บังคับเสมอ — ผู้ใช้ต้องยืนยัน
    metadata?: Record<string, any>;
}

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 20: EXECUTION TYPES (AGENT MODE — Single Human Authority)
// ═══════════════════════════════════════════════════════════════════════════

/** Action types classified by risk level (see Document D) */
export type ActionType =
    | 'NOTE_REWRITE'        // 🟡 SENSITIVE
    | 'NOTE_STRUCTURE'      // 🟡 SENSITIVE
    | 'NOTE_SUMMARIZE'      // 🟡 SENSITIVE
    | 'SETTING_CHANGE'      // 🟡 SENSITIVE
    | 'FILE_ORGANIZE'       // 🟠 DESTRUCTIVE
    | 'FILE_MOVE'           // 🟠 DESTRUCTIVE
    | 'FILE_DELETE'         // 🟠 DESTRUCTIVE
    | 'FILE_OVERWRITE'      // 🟠 DESTRUCTIVE
    | 'FILE_PURGE'          // 🔴 IRREVERSIBLE
    | 'ORG_PERMISSION'      // 🔴 IRREVERSIBLE
    | 'SYSTEM_RESET';       // 🔴 IRREVERSIBLE

/** Risk classification levels */
export type RiskClass = 'SAFE' | 'SENSITIVE' | 'DESTRUCTIVE' | 'IRREVERSIBLE';

/** Target resource for execution */
export interface ResourceTarget {
    resourceId: string;
    resourceType: 'note' | 'file' | 'setting' | 'org' | 'system';
    path?: string;           // Optional path (e.g. file path)
    displayName?: string;    // Human-readable name
}

/** Before/after diff for preview and audit */
export interface ActionDiff {
    before: string;
    after: string;
    summary: string;         // Human-readable summary of changes
}

/**
 * Signed Approval — ต้องมีทุกครั้งก่อน execute
 * ลงนามด้วย Ed25519 (see Document B)
 */
export interface SignedApproval {
    approvalId: string;              // Unique ID (uuid v4)
    intentId: string;                // CorrelationId จาก proposal
    actionType: ActionType;          // Action ที่อนุมัติ
    scope: string;                   // App scope (e.g. 'core.notes')
    target: ResourceTarget;          // Resource ที่จะกระทำ
    diff: ActionDiff;                // Before/After
    approvedBy: string;              // OWNER_AUTHORITY identifier
    approvedAt: number;              // Unix timestamp (ms)
    expiresAt: number;               // Unix timestamp (ms) — ต้องไม่เกิน 15 นาที
    nonce: string;                   // Unique nonce (กัน replay)
    signature: string;               // Ed25519 signature (base64)
    signedFields: string[];          // List of fields in canonical order
}

/** Undo plan for rollback */
export interface UndoPlan {
    executionId: string;
    snapshotRef: string;             // Reference to pre-execution snapshot
    rollbackType: 'RESTORE' | 'REVERSE' | 'MANUAL';
    rollbackSteps: string[];         // Human-readable steps
    estimatedRisk: 'LOW' | 'MEDIUM' | 'HIGH';
    expiresAt: number;               // Undo available until this time
}

/** Execution result */
export interface ExecutionResult {
    executionId: string;
    intentId: string;
    approvalId: string;
    status: 'COMPLETED' | 'FAILED' | 'ROLLED_BACK';
    snapshotRef: string;
    undoPlan: UndoPlan;
    executedAt: number;
    duration: number;                // ms
    error?: string;                  // Error message if FAILED
}

/** Append-only audit entry for execution (Phase 21A: Immutable) */
export interface ExecutionAuditEntry {
    entryId: string;
    entryType: 'EXECUTION' | 'ROLLBACK';          // Phase 21A: entry classification
    referencesEntryId?: string;                     // Phase 21A: ROLLBACK → original EXECUTION entryId
    auditVersion: number;                           // Phase 21A: v1=legacy, v2=immutable
    executionId: string;
    intentId: string;
    approvalId: string;
    snapshotRef: string;
    actionType: ActionType;
    scope: string;
    target: ResourceTarget;
    status: 'COMPLETED' | 'FAILED' | 'ROLLED_BACK'; // IMMUTABLE after creation
    executedAt: number;
    duration: number;                // ms
    undoPlan: UndoPlan;
    prevHash: string;                // Hash of previous entry (chain)
    recordHash: string;              // Hash of this entry
}

/** Snapshot for pre-execution state preservation */
export interface ExecutionSnapshot {
    id: string;
    resourceId: string;
    resourceType: string;
    state: string;                   // JSON stringified state
    createdAt: number;
    expiresAt: number;               // 30 days retention
}

/** Kill switch state */
export type KillSwitchState = 'EXECUTE_ENABLED' | 'EXECUTE_DISABLED';
