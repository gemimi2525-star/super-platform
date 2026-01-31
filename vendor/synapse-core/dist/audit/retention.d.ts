/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CORE OS — Audit Retention & Redaction (Phase S)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Retention: Rotate segments, don't mutate old records
 * Redaction: Mask sensitive fields without losing audit meaning
 *
 * @module coreos/audit/retention
 * @version 1.0.0 (Phase S)
 */
import type { AuditRecord, RetentionPolicy, RedactionPolicy } from './types.js';
import type { DecisionExplanation } from '../types/index.js';
/**
 * Retention evaluation result
 */
export interface RetentionEvaluation {
    readonly shouldRotate: boolean;
    readonly reason?: string;
    readonly recordsToKeep: number;
    readonly recordsToArchive: number;
}
/**
 * Evaluate if retention policy requires rotation
 */
export declare function evaluateRetention(records: readonly AuditRecord[], policy: RetentionPolicy, currentTime?: number): RetentionEvaluation;
/**
 * Split records for rotation (archive old, keep recent)
 * Returns [toArchive, toKeep] — oldRecords are NOT mutated
 */
export declare function splitForRotation(records: readonly AuditRecord[], evaluation: RetentionEvaluation): {
    archived: readonly AuditRecord[];
    kept: readonly AuditRecord[];
};
/**
 * Apply redaction policy to a DecisionExplanation
 * Returns a new object with redacted fields (immutable operation)
 */
export declare function redactPayload(payload: DecisionExplanation, policy: RedactionPolicy): DecisionExplanation;
/**
 * Apply redaction to an entire AuditRecord
 */
export declare function redactRecord(record: AuditRecord, policy: RedactionPolicy): AuditRecord;
//# sourceMappingURL=retention.d.ts.map