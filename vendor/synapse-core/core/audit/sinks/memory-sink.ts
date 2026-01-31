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

import type { AuditRecord, AuditSink, ChainHead, RetentionPolicy } from '../types';
import { toCanonicalJson } from '../serializer';
import { evaluateRetention, splitForRotation } from '../retention';
import { GENESIS_HASH } from '../integrity';

// ═══════════════════════════════════════════════════════════════════════════
// MEMORY SINK IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * MemorySink — In-memory audit storage for testing
 */
export class MemorySink implements AuditSink {
    private records: AuditRecord[] = [];
    private archivedRecords: AuditRecord[] = [];

    /**
     * Append a record (append-only, no updates)
     */
    append(record: AuditRecord): void {
        // Validate append-only: seq must be next in sequence
        const expectedSeq = this.records.length + 1;
        if (record.seq !== expectedSeq) {
            throw new Error(`Append-only violation: expected seq ${expectedSeq}, got ${record.seq}`);
        }

        // Validate prevHash chain
        const expectedPrevHash = this.records.length === 0
            ? GENESIS_HASH
            : this.records[this.records.length - 1].recordHash;
        if (record.prevHash !== expectedPrevHash) {
            throw new Error(`Hash chain violation: expected prevHash ${expectedPrevHash}`);
        }

        this.records.push(record);
    }

    /**
     * Export all records as JSONL
     */
    exportJsonl(): string {
        return this.records
            .map(r => toCanonicalJson(r))
            .join('\n');
    }

    /**
     * Get current chain head
     */
    getHead(): ChainHead {
        if (this.records.length === 0) {
            return { seq: 0, hash: GENESIS_HASH };
        }
        const last = this.records[this.records.length - 1];
        return { seq: last.seq, hash: last.recordHash };
    }

    /**
     * Get all records (immutable copy)
     */
    getRecords(): readonly AuditRecord[] {
        return [...this.records];
    }

    /**
     * Get archived records (for testing)
     */
    getArchivedRecords(): readonly AuditRecord[] {
        return [...this.archivedRecords];
    }

    /**
     * Apply retention policy (rotates, doesn't mutate old records)
     */
    rotateIfNeeded(policy: RetentionPolicy): void {
        const evaluation = evaluateRetention(this.records, policy);

        if (evaluation.shouldRotate) {
            const { archived, kept } = splitForRotation(this.records, evaluation);

            // Archive old records (immutable — original records preserved)
            this.archivedRecords = [...this.archivedRecords, ...archived];

            // Keep only recent records
            this.records = [...kept];
        }
    }

    /**
     * Clear sink (for testing only)
     */
    clear(): void {
        this.records = [];
        this.archivedRecords = [];
    }

    /**
     * Get total record count (including archived)
     */
    getTotalCount(): number {
        return this.records.length + this.archivedRecords.length;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON
// ═══════════════════════════════════════════════════════════════════════════

let instance: MemorySink | null = null;

export function getMemorySink(): MemorySink {
    if (!instance) {
        instance = new MemorySink();
    }
    return instance;
}

export function resetMemorySink(): void {
    if (instance) {
        instance.clear();
    }
    instance = null;
}
