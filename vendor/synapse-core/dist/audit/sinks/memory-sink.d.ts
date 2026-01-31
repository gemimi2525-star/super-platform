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
/**
 * MemorySink — In-memory audit storage for testing
 */
export declare class MemorySink implements AuditSink {
    private records;
    private archivedRecords;
    /**
     * Append a record (append-only, no updates)
     */
    append(record: AuditRecord): void;
    /**
     * Export all records as JSONL
     */
    exportJsonl(): string;
    /**
     * Get current chain head
     */
    getHead(): ChainHead;
    /**
     * Get all records (immutable copy)
     */
    getRecords(): readonly AuditRecord[];
    /**
     * Get archived records (for testing)
     */
    getArchivedRecords(): readonly AuditRecord[];
    /**
     * Apply retention policy (rotates, doesn't mutate old records)
     */
    rotateIfNeeded(policy: RetentionPolicy): void;
    /**
     * Clear sink (for testing only)
     */
    clear(): void;
    /**
     * Get total record count (including archived)
     */
    getTotalCount(): number;
}
export declare function getMemorySink(): MemorySink;
export declare function resetMemorySink(): void;
//# sourceMappingURL=memory-sink.d.ts.map