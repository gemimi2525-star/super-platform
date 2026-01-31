"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetAuditCollector = exports.getAuditCollector = exports.CoreOSAuditCollector = exports.resetMemorySink = exports.getMemorySink = exports.MemorySink = exports.validateJsonlExport = exports.parseJsonl = exports.generateExportSummary = exports.exportSinkToJsonl = exports.exportToJsonl = exports.redactRecord = exports.redactPayload = exports.splitForRotation = exports.evaluateRetention = exports.isRecordTampered = exports.validateChain = exports.buildAuditRecord = exports.computeRecordHash = exports.computeHash = exports.HASH_ALGORITHM = exports.GENESIS_HASH = exports.fromCanonicalJson = exports.toCanonicalJson = exports.DEFAULT_REDACTION_POLICY = exports.DEFAULT_RETENTION_POLICY = void 0;
var types_js_1 = require("./types.js");
Object.defineProperty(exports, "DEFAULT_RETENTION_POLICY", { enumerable: true, get: function () { return types_js_1.DEFAULT_RETENTION_POLICY; } });
Object.defineProperty(exports, "DEFAULT_REDACTION_POLICY", { enumerable: true, get: function () { return types_js_1.DEFAULT_REDACTION_POLICY; } });
// Serializer
var serializer_1 = require("./serializer");
Object.defineProperty(exports, "toCanonicalJson", { enumerable: true, get: function () { return serializer_1.toCanonicalJson; } });
Object.defineProperty(exports, "fromCanonicalJson", { enumerable: true, get: function () { return serializer_1.fromCanonicalJson; } });
// Integrity
var integrity_1 = require("./integrity");
Object.defineProperty(exports, "GENESIS_HASH", { enumerable: true, get: function () { return integrity_1.GENESIS_HASH; } });
Object.defineProperty(exports, "HASH_ALGORITHM", { enumerable: true, get: function () { return integrity_1.HASH_ALGORITHM; } });
Object.defineProperty(exports, "computeHash", { enumerable: true, get: function () { return integrity_1.computeHash; } });
Object.defineProperty(exports, "computeRecordHash", { enumerable: true, get: function () { return integrity_1.computeRecordHash; } });
Object.defineProperty(exports, "buildAuditRecord", { enumerable: true, get: function () { return integrity_1.buildAuditRecord; } });
Object.defineProperty(exports, "validateChain", { enumerable: true, get: function () { return integrity_1.validateChain; } });
Object.defineProperty(exports, "isRecordTampered", { enumerable: true, get: function () { return integrity_1.isRecordTampered; } });
// Retention
var retention_1 = require("./retention");
Object.defineProperty(exports, "evaluateRetention", { enumerable: true, get: function () { return retention_1.evaluateRetention; } });
Object.defineProperty(exports, "splitForRotation", { enumerable: true, get: function () { return retention_1.splitForRotation; } });
Object.defineProperty(exports, "redactPayload", { enumerable: true, get: function () { return retention_1.redactPayload; } });
Object.defineProperty(exports, "redactRecord", { enumerable: true, get: function () { return retention_1.redactRecord; } });
// Export
var export_1 = require("./export");
Object.defineProperty(exports, "exportToJsonl", { enumerable: true, get: function () { return export_1.exportToJsonl; } });
Object.defineProperty(exports, "exportSinkToJsonl", { enumerable: true, get: function () { return export_1.exportSinkToJsonl; } });
Object.defineProperty(exports, "generateExportSummary", { enumerable: true, get: function () { return export_1.generateExportSummary; } });
Object.defineProperty(exports, "parseJsonl", { enumerable: true, get: function () { return export_1.parseJsonl; } });
Object.defineProperty(exports, "validateJsonlExport", { enumerable: true, get: function () { return export_1.validateJsonlExport; } });
// Sinks
var memory_sink_1 = require("./sinks/memory-sink");
Object.defineProperty(exports, "MemorySink", { enumerable: true, get: function () { return memory_sink_1.MemorySink; } });
Object.defineProperty(exports, "getMemorySink", { enumerable: true, get: function () { return memory_sink_1.getMemorySink; } });
Object.defineProperty(exports, "resetMemorySink", { enumerable: true, get: function () { return memory_sink_1.resetMemorySink; } });
// Collector
var collector_1 = require("./collector");
Object.defineProperty(exports, "CoreOSAuditCollector", { enumerable: true, get: function () { return collector_1.CoreOSAuditCollector; } });
Object.defineProperty(exports, "getAuditCollector", { enumerable: true, get: function () { return collector_1.getAuditCollector; } });
Object.defineProperty(exports, "resetAuditCollector", { enumerable: true, get: function () { return collector_1.resetAuditCollector; } });
//# sourceMappingURL=index.js.map