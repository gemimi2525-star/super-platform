"use strict";
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CORE OS — Audit Memory Sink (Phase S)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * In-memory audit sink for development and testing.
 * Append-only, no mutations to existing records.
 *
 * @module coreos/audit/sinks/memory-sink
 * @version 1.0.0 (Phase S)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemorySink = void 0;
exports.getMemorySink = getMemorySink;
exports.resetMemorySink = resetMemorySink;
const serializer_1 = require("../serializer");
const retention_1 = require("../retention");
const integrity_1 = require("../integrity");
// ═══════════════════════════════════════════════════════════════════════════
// MEMORY SINK IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════════════
/**
 * MemorySink — In-memory audit storage for testing
 */
class MemorySink {
    records = [];
    archivedRecords = [];
    /**
     * Append a record (append-only, no updates)
     */
    append(record) {
        // Validate append-only: seq must be next in sequence
        const expectedSeq = this.records.length + 1;
        if (record.seq !== expectedSeq) {
            throw new Error(`Append-only violation: expected seq ${expectedSeq}, got ${record.seq}`);
        }
        // Validate prevHash chain
        const expectedPrevHash = this.records.length === 0
            ? integrity_1.GENESIS_HASH
            : this.records[this.records.length - 1].recordHash;
        if (record.prevHash !== expectedPrevHash) {
            throw new Error(`Hash chain violation: expected prevHash ${expectedPrevHash}`);
        }
        this.records.push(record);
    }
    /**
     * Export all records as JSONL
     */
    exportJsonl() {
        return this.records
            .map(r => (0, serializer_1.toCanonicalJson)(r))
            .join('\n');
    }
    /**
     * Get current chain head
     */
    getHead() {
        if (this.records.length === 0) {
            return { seq: 0, hash: integrity_1.GENESIS_HASH };
        }
        const last = this.records[this.records.length - 1];
        return { seq: last.seq, hash: last.recordHash };
    }
    /**
     * Get all records (immutable copy)
     */
    getRecords() {
        return [...this.records];
    }
    /**
     * Get archived records (for testing)
     */
    getArchivedRecords() {
        return [...this.archivedRecords];
    }
    /**
     * Apply retention policy (rotates, doesn't mutate old records)
     */
    rotateIfNeeded(policy) {
        const evaluation = (0, retention_1.evaluateRetention)(this.records, policy);
        if (evaluation.shouldRotate) {
            const { archived, kept } = (0, retention_1.splitForRotation)(this.records, evaluation);
            // Archive old records (immutable — original records preserved)
            this.archivedRecords = [...this.archivedRecords, ...archived];
            // Keep only recent records
            this.records = [...kept];
        }
    }
    /**
     * Clear sink (for testing only)
     */
    clear() {
        this.records = [];
        this.archivedRecords = [];
    }
    /**
     * Get total record count (including archived)
     */
    getTotalCount() {
        return this.records.length + this.archivedRecords.length;
    }
}
exports.MemorySink = MemorySink;
// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON
// ═══════════════════════════════════════════════════════════════════════════
let instance = null;
function getMemorySink() {
    if (!instance) {
        instance = new MemorySink();
    }
    return instance;
}
function resetMemorySink() {
    if (instance) {
        instance.clear();
    }
    instance = null;
}
//# sourceMappingURL=memory-sink.js.map