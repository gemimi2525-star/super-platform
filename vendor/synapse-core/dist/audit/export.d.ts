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
import { type ChainValidationResult } from './integrity';
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
/**
 * Export records to JSONL format
 * One record per line, canonical JSON
 */
export declare function exportToJsonl(records: readonly AuditRecord[], redactionPolicy?: RedactionPolicy): string;
/**
 * Export from sink to JSONL
 */
export declare function exportSinkToJsonl(sink: AuditSink, redactionPolicy?: RedactionPolicy): string;
/**
 * Generate export summary from records
 */
export declare function generateExportSummary(records: readonly AuditRecord[]): ExportSummary | null;
/**
 * Parse JSONL back to records
 */
export declare function parseJsonl(jsonl: string): AuditRecord[];
/**
 * Validate JSONL export
 */
export declare function validateJsonlExport(jsonl: string): ChainValidationResult;
//# sourceMappingURL=export.d.ts.map