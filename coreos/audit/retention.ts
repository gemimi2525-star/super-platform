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

import type { AuditRecord, RetentionPolicy, RedactionPolicy } from './types';
import type { DecisionExplanation } from '../types';

// ═══════════════════════════════════════════════════════════════════════════
// RETENTION EVALUATION
// ═══════════════════════════════════════════════════════════════════════════

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
export function evaluateRetention(
    records: readonly AuditRecord[],
    policy: RetentionPolicy,
    currentTime: number = Date.now()
): RetentionEvaluation {
    const totalRecords = records.length;

    // Check maxRecords
    if (policy.maxRecords !== undefined && totalRecords > policy.maxRecords) {
        const toArchive = totalRecords - policy.maxRecords;
        return {
            shouldRotate: true,
            reason: `Exceeded maxRecords (${totalRecords} > ${policy.maxRecords})`,
            recordsToKeep: policy.maxRecords,
            recordsToArchive: toArchive,
        };
    }

    // Check maxAgeDays
    if (policy.maxAgeDays !== undefined && records.length > 0) {
        const maxAgeMs = policy.maxAgeDays * 24 * 60 * 60 * 1000;
        const cutoffTime = currentTime - maxAgeMs;

        const expiredRecords = records.filter(r => r.recordedAt < cutoffTime);
        if (expiredRecords.length > 0) {
            return {
                shouldRotate: true,
                reason: `Records older than ${policy.maxAgeDays} days exist`,
                recordsToKeep: totalRecords - expiredRecords.length,
                recordsToArchive: expiredRecords.length,
            };
        }
    }

    return {
        shouldRotate: false,
        recordsToKeep: totalRecords,
        recordsToArchive: 0,
    };
}

/**
 * Split records for rotation (archive old, keep recent)
 * Returns [toArchive, toKeep] — oldRecords are NOT mutated
 */
export function splitForRotation(
    records: readonly AuditRecord[],
    evaluation: RetentionEvaluation
): { archived: readonly AuditRecord[]; kept: readonly AuditRecord[] } {
    if (!evaluation.shouldRotate) {
        return { archived: [], kept: records };
    }

    const archived = records.slice(0, evaluation.recordsToArchive);
    const kept = records.slice(evaluation.recordsToArchive);

    return { archived, kept };
}

// ═══════════════════════════════════════════════════════════════════════════
// REDACTION
// ═══════════════════════════════════════════════════════════════════════════

const REDACTED = '[REDACTED]';

/**
 * Apply redaction policy to a DecisionExplanation
 * Returns a new object with redacted fields (immutable operation)
 */
export function redactPayload(
    payload: DecisionExplanation,
    policy: RedactionPolicy
): DecisionExplanation {
    if (policy.fieldsToRedact.length === 0 && !policy.redactCorrelationIds) {
        return payload; // No redaction needed
    }

    const redacted: Record<string, unknown> = { ...payload };

    // Redact specified fields
    for (const field of policy.fieldsToRedact) {
        if (field in redacted && redacted[field] !== undefined) {
            redacted[field] = REDACTED;
        }
    }

    // Redact correlation IDs if requested
    if (policy.redactCorrelationIds && redacted.correlationId) {
        redacted.correlationId = REDACTED;
    }

    return redacted as unknown as DecisionExplanation;
}

/**
 * Apply redaction to an entire AuditRecord
 */
export function redactRecord(
    record: AuditRecord,
    policy: RedactionPolicy
): AuditRecord {
    return {
        ...record,
        payload: redactPayload(record.payload, policy),
    };
}
