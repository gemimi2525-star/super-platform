"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportToJsonl = exportToJsonl;
exports.exportSinkToJsonl = exportSinkToJsonl;
exports.generateExportSummary = generateExportSummary;
exports.parseJsonl = parseJsonl;
exports.validateJsonlExport = validateJsonlExport;
const types_js_1 = require("./types.js");
const serializer_1 = require("./serializer");
const retention_1 = require("./retention");
const integrity_1 = require("./integrity");
// ═══════════════════════════════════════════════════════════════════════════
// EXPORT FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════
/**
 * Export records to JSONL format
 * One record per line, canonical JSON
 */
function exportToJsonl(records, redactionPolicy = types_js_1.DEFAULT_REDACTION_POLICY) {
    return records
        .map(r => (0, retention_1.redactRecord)(r, redactionPolicy))
        .map(r => (0, serializer_1.toCanonicalJson)(r))
        .join('\n');
}
/**
 * Export from sink to JSONL
 */
function exportSinkToJsonl(sink, redactionPolicy = types_js_1.DEFAULT_REDACTION_POLICY) {
    return exportToJsonl(sink.getRecords(), redactionPolicy);
}
/**
 * Generate export summary from records
 */
function generateExportSummary(records) {
    if (records.length === 0) {
        return null;
    }
    const first = records[0];
    const last = records[records.length - 1];
    const validation = (0, integrity_1.validateChain)(records);
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
function parseJsonl(jsonl) {
    if (!jsonl.trim()) {
        return [];
    }
    return jsonl
        .split('\n')
        .filter(line => line.trim())
        .map(line => JSON.parse(line));
}
/**
 * Validate JSONL export
 */
function validateJsonlExport(jsonl) {
    const records = parseJsonl(jsonl);
    return (0, integrity_1.validateChain)(records);
}
//# sourceMappingURL=export.js.map