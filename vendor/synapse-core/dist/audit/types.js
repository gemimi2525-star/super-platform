"use strict";
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CORE OS — Audit Module Types (Phase S)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Canonical types for audit export and compliance pipeline.
 * No UI, no kernel behavior change — export/store/verify only.
 *
 * @module coreos/audit/types
 * @version 1.0.0 (Phase S)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_REDACTION_POLICY = exports.DEFAULT_RETENTION_POLICY = void 0;
/**
 * Default retention policy
 */
exports.DEFAULT_RETENTION_POLICY = {
    maxRecords: 10000,
    maxAgeDays: 90,
};
/**
 * Default redaction policy (no redaction)
 */
exports.DEFAULT_REDACTION_POLICY = {
    fieldsToRedact: [],
    redactCorrelationIds: false,
};
//# sourceMappingURL=types.js.map