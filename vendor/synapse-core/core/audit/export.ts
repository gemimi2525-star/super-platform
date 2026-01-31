/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CORE OS — Audit Export (Phase S)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Export utilities for audit records.
 * Supports JSONL format for SIEM/compliance tool integration.
 * 
 * @module coreos/audit/export
 * @version 1.0.0 (Phase S)
 */

import type { AuditRecord, AuditSink, RedactionPolicy } from './types.js';
import { DEFAULT_REDACTION_POLICY } from './types.js';
import { toCanonicalJson } from './serializer';
import { redactRecord } from './retention';
import { validateChain, type ChainValidationResult } from './integrity';

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT FORMATS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Export summary statistics
 */
export interface ExportSummary {
    readonly chainId: string;
    readonly totalRecords: number;
    readonly firstSeq: number;
    readonly lastSeq: number;
    readonly firstTimestamp: number;
    readonly lastTimestamp: number;
    readonly chainValid: boolean;
    readonly decisionCounts: {
        readonly ALLOW: number;
        readonly DENY: number;
        readonly SKIP: number;
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Export records to JSONL format
 * One record per line, canonical JSON
 */
export function exportToJsonl(
    records: readonly AuditRecord[],
    redactionPolicy: RedactionPolicy = DEFAULT_REDACTION_POLICY
): string {
    return records
        .map(r => redactRecord(r, redactionPolicy))
        .map(r => toCanonicalJson(r))
        .join('\n');
}

/**
 * Export from sink to JSONL
 */
export function exportSinkToJsonl(
    sink: AuditSink,
    redactionPolicy: RedactionPolicy = DEFAULT_REDACTION_POLICY
): string {
    return exportToJsonl(sink.getRecords(), redactionPolicy);
}

/**
 * Generate export summary from records
 */
export function generateExportSummary(records: readonly AuditRecord[]): ExportSummary | null {
    if (records.length === 0) {
        return null;
    }

    const first = records[0];
    const last = records[records.length - 1];

    const validation = validateChain(records);

    const decisionCounts = {
        ALLOW: 0,
        DENY: 0,
        SKIP: 0,
    };

    for (const record of records) {
        const decision = record.payload.decision;
        decisionCounts[decision]++;
    }

    return {
        chainId: first.chainId,
        totalRecords: records.length,
        firstSeq: first.seq,
        lastSeq: last.seq,
        firstTimestamp: first.recordedAt,
        lastTimestamp: last.recordedAt,
        chainValid: validation.valid,
        decisionCounts,
    };
}

/**
 * Parse JSONL back to records
 */
export function parseJsonl(jsonl: string): AuditRecord[] {
    if (!jsonl.trim()) {
        return [];
    }

    return jsonl
        .split('\n')
        .filter(line => line.trim())
        .map(line => JSON.parse(line) as AuditRecord);
}

/**
 * Validate JSONL export
 */
export function validateJsonlExport(jsonl: string): ChainValidationResult {
    const records = parseJsonl(jsonl);
    return validateChain(records);
}
