/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CORE OS — Audit Integrity Hash Chain (Phase S)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Tamper-evident hash chain for audit records.
 * Uses SHA-256 for cryptographic hashing.
 *
 * @module coreos/audit/integrity
 * @version 1.0.0 (Phase S)
 */
import type { AuditRecord } from './types.js';
/** Hash value for the first record in a chain */
export declare const GENESIS_HASH = "GENESIS";
/** Hash algorithm used */
export declare const HASH_ALGORITHM = "sha256";
/**
 * Compute SHA-256 hash of a string
 */
export declare function computeHash(data: string): string;
/**
 * Compute the record hash for an audit record.
 * The hash is computed from the canonical JSON of the record WITHOUT the recordHash field.
 */
export declare function computeRecordHash(record: Omit<AuditRecord, 'recordHash'>): string;
/**
 * Build a complete AuditRecord with computed hash
 */
export declare function buildAuditRecord(params: {
    chainId: string;
    seq: number;
    recordedAt: number;
    payload: AuditRecord['payload'];
    prevHash: string;
}): AuditRecord;
/**
 * Chain validation result
 */
export interface ChainValidationResult {
    readonly valid: boolean;
    readonly error?: string;
    readonly invalidRecordSeq?: number;
}
/**
 * Validate an audit chain for integrity.
 *
 * Checks:
 * 1. First record has prevHash = GENESIS
 * 2. Sequence numbers are continuous (1, 2, 3, ...)
 * 3. Each record's prevHash matches previous record's recordHash
 * 4. Each record's recordHash is correctly computed
 */
export declare function validateChain(records: readonly AuditRecord[]): ChainValidationResult;
/**
 * Detect if a specific record has been tampered
 */
export declare function isRecordTampered(record: AuditRecord): boolean;
//# sourceMappingURL=integrity.d.ts.map