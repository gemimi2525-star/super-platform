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

// Types
export type {
    AuditRecord,
    RetentionPolicy,
    RedactionPolicy,
    ChainHead,
    AuditSink,
    AuditCollector,
} from './types.js';
export { DEFAULT_RETENTION_POLICY, DEFAULT_REDACTION_POLICY } from './types.js';

// Serializer
export { toCanonicalJson, fromCanonicalJson } from './serializer';

// Integrity
export {
    GENESIS_HASH,
    HASH_ALGORITHM,
    computeHash,
    computeRecordHash,
    buildAuditRecord,
    validateChain,
    isRecordTampered,
    type ChainValidationResult,
} from './integrity';

// Retention
export {
    evaluateRetention,
    splitForRotation,
    redactPayload,
    redactRecord,
    type RetentionEvaluation,
} from './retention';

// Export
export {
    exportToJsonl,
    exportSinkToJsonl,
    generateExportSummary,
    parseJsonl,
    validateJsonlExport,
    type ExportSummary,
} from './export';

// Sinks
export { MemorySink, getMemorySink, resetMemorySink } from './sinks/memory-sink';

// Collector
export { CoreOSAuditCollector, getAuditCollector, resetAuditCollector } from './collector';
