"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.HASH_ALGORITHM = exports.GENESIS_HASH = void 0;
exports.computeHash = computeHash;
exports.computeRecordHash = computeRecordHash;
exports.buildAuditRecord = buildAuditRecord;
exports.validateChain = validateChain;
exports.isRecordTampered = isRecordTampered;
const crypto_1 = require("crypto");
const serializer_1 = require("./serializer");
// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════
/** Hash value for the first record in a chain */
exports.GENESIS_HASH = 'GENESIS';
/** Hash algorithm used */
exports.HASH_ALGORITHM = 'sha256';
// ═══════════════════════════════════════════════════════════════════════════
// HASH COMPUTATION
// ═══════════════════════════════════════════════════════════════════════════
/**
 * Compute SHA-256 hash of a string
 */
function computeHash(data) {
    return (0, crypto_1.createHash)(exports.HASH_ALGORITHM).update(data).digest('hex');
}
/**
 * Compute the record hash for an audit record.
 * The hash is computed from the canonical JSON of the record WITHOUT the recordHash field.
 */
function computeRecordHash(record) {
    const canonical = (0, serializer_1.toCanonicalJson)(record);
    return computeHash(canonical);
}
/**
 * Build a complete AuditRecord with computed hash
 */
function buildAuditRecord(params) {
    const { chainId, seq, recordedAt, payload, prevHash } = params;
    const recordWithoutHash = {
        chainId,
        seq,
        recordedAt,
        eventType: 'DECISION_EXPLAINED',
        payload,
        prevHash,
        version: '1.0',
    };
    const recordHash = computeRecordHash(recordWithoutHash);
    return {
        ...recordWithoutHash,
        recordHash,
    };
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
function validateChain(records) {
    if (records.length === 0) {
        return { valid: true };
    }
    for (let i = 0; i < records.length; i++) {
        const record = records[i];
        const expectedSeq = i + 1;
        // Check sequence continuity
        if (record.seq !== expectedSeq) {
            return {
                valid: false,
                error: `Sequence mismatch at index ${i}: expected ${expectedSeq}, got ${record.seq}`,
                invalidRecordSeq: record.seq,
            };
        }
        // Check prevHash
        if (i === 0) {
            if (record.prevHash !== exports.GENESIS_HASH) {
                return {
                    valid: false,
                    error: `First record must have prevHash = "${exports.GENESIS_HASH}"`,
                    invalidRecordSeq: record.seq,
                };
            }
        }
        else {
            const prevRecord = records[i - 1];
            if (record.prevHash !== prevRecord.recordHash) {
                return {
                    valid: false,
                    error: `prevHash mismatch at seq ${record.seq}: expected ${prevRecord.recordHash}, got ${record.prevHash}`,
                    invalidRecordSeq: record.seq,
                };
            }
        }
        // Verify recordHash
        const { recordHash, ...recordWithoutHash } = record;
        const expectedHash = computeRecordHash(recordWithoutHash);
        if (recordHash !== expectedHash) {
            return {
                valid: false,
                error: `recordHash mismatch at seq ${record.seq}: record may have been tampered`,
                invalidRecordSeq: record.seq,
            };
        }
    }
    return { valid: true };
}
/**
 * Detect if a specific record has been tampered
 */
function isRecordTampered(record) {
    const { recordHash, ...recordWithoutHash } = record;
    const expectedHash = computeRecordHash(recordWithoutHash);
    return recordHash !== expectedHash;
}
//# sourceMappingURL=integrity.js.map