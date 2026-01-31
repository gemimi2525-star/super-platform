/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CORE OS — Audit Module Types (Phase S)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Canonical types for audit export and compliance pipeline.
 * No UI, no kernel behavior change — export/store/verify only.
 * 
 * @module coreos/audit/types
 * @version 1.0.0 (Phase S)
 */

import type { DecisionExplanation, CorrelationId } from '../types/index.js';

// ═══════════════════════════════════════════════════════════════════════════
// AUDIT RECORD (Envelope)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * AuditRecord — Immutable envelope wrapping DecisionExplanation
 * Contains integrity chain fields for tamper-evident logging
 */
export interface AuditRecord {
    /** Unique identifier for this audit chain (e.g., session or instance ID) */
    readonly chainId: string;
    /** Sequence number within chain (starts at 1, increments by 1) */
    readonly seq: number;
    /** Timestamp when record was created (epoch ms) */
    readonly recordedAt: number;
    /** Event type (always DECISION_EXPLAINED for Phase S) */
    readonly eventType: 'DECISION_EXPLAINED';
    /** The original DecisionExplanation payload */
    readonly payload: DecisionExplanation;
    /** Hash of previous record (or "GENESIS" for first record) */
    readonly prevHash: string;
    /** Hash of this record (computed from canonical JSON) */
    readonly recordHash: string;
    /** Schema version for forward compatibility */
    readonly version: '1.0';
}

// ═══════════════════════════════════════════════════════════════════════════
// RETENTION & REDACTION POLICIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Retention policy configuration
 */
export interface RetentionPolicy {
    /** Maximum number of records to keep (oldest removed when exceeded) */
    readonly maxRecords?: number;
    /** Maximum age in days (records older than this are rotated) */
    readonly maxAgeDays?: number;
    /** Maximum file size in MB before rotation (for file sinks) */
    readonly maxFileSizeMB?: number;
}

/**
 * Redaction policy configuration
 */
export interface RedactionPolicy {
    /** Fields to redact (mask with "[REDACTED]") */
    readonly fieldsToRedact: readonly string[];
    /** Whether to redact correlation IDs */
    readonly redactCorrelationIds: boolean;
}

/**
 * Default retention policy
 */
export const DEFAULT_RETENTION_POLICY: RetentionPolicy = {
    maxRecords: 10000,
    maxAgeDays: 90,
};

/**
 * Default redaction policy (no redaction)
 */
export const DEFAULT_REDACTION_POLICY: RedactionPolicy = {
    fieldsToRedact: [],
    redactCorrelationIds: false,
};

// ═══════════════════════════════════════════════════════════════════════════
// AUDIT SINK INTERFACE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Chain head information
 */
export interface ChainHead {
    readonly seq: number;
    readonly hash: string;
}

/**
 * AuditSink — Interface for audit record storage backends
 * Implementations: MemorySink, FileJsonlSink, (future) RemoteSink
 */
export interface AuditSink {
    /** Append a record to the sink (append-only, no updates) */
    append(record: AuditRecord): void;

    /** Export all records as JSONL string */
    exportJsonl(): string;

    /** Get current chain head (latest seq and hash) */
    getHead(): ChainHead;

    /** Get all records (for testing/validation) */
    getRecords(): readonly AuditRecord[];

    /** Apply retention policy if needed (rotates, doesn't mutate old records) */
    rotateIfNeeded(policy: RetentionPolicy): void;

    /** Clear sink (for testing only) */
    clear(): void;
}

// ═══════════════════════════════════════════════════════════════════════════
// AUDIT COLLECTOR INTERFACE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * AuditCollector — Subscribes to events and feeds audit sink
 */
export interface AuditCollector {
    /** Start collecting DECISION_EXPLAINED events */
    start(): void;

    /** Stop collecting */
    stop(): void;

    /** Get current chain head */
    getHead(): ChainHead;

    /** Export to JSONL */
    exportJsonl(): string;

    /** Get failure count (for monitoring) */
    getFailureCount(): number;
}
