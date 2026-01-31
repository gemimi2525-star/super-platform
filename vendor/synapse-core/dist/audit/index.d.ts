/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CORE OS — Audit Module (Phase S)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Audit Export / Compliance Pipeline
 * No UI, no kernel behavior change — export/store/verify only.
 *
 * @module coreos/audit
 * @version 1.0.0 (Phase S)
 */
export type { AuditRecord, RetentionPolicy, RedactionPolicy, ChainHead, AuditSink, AuditCollector, } from './types.js';
export { DEFAULT_RETENTION_POLICY, DEFAULT_REDACTION_POLICY } from './types.js';
export { toCanonicalJson, fromCanonicalJson } from './serializer';
export { GENESIS_HASH, HASH_ALGORITHM, computeHash, computeRecordHash, buildAuditRecord, validateChain, isRecordTampered, type ChainValidationResult, } from './integrity';
export { evaluateRetention, splitForRotation, redactPayload, redactRecord, type RetentionEvaluation, } from './retention';
export { exportToJsonl, exportSinkToJsonl, generateExportSummary, parseJsonl, validateJsonlExport, type ExportSummary, } from './export';
export { MemorySink, getMemorySink, resetMemorySink } from './sinks/memory-sink';
export { CoreOSAuditCollector, getAuditCollector, resetAuditCollector } from './collector';
//# sourceMappingURL=index.d.ts.map