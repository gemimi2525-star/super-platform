"use strict";
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CORE OS — Audit Collector (Phase S)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Subscribes to DECISION_EXPLAINED events and feeds audit sink.
 * Non-invasive: does not change kernel behavior.
 *
 * @module coreos/audit/collector
 * @version 1.0.0 (Phase S)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoreOSAuditCollector = void 0;
exports.getAuditCollector = getAuditCollector;
exports.resetAuditCollector = resetAuditCollector;
const integrity_1 = require("./integrity");
const event_bus_js_1 = require("../kernel/event-bus.js");
// ═══════════════════════════════════════════════════════════════════════════
// AUDIT COLLECTOR IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════════════
/**
 * CoreOSAuditCollector — Collects DECISION_EXPLAINED events
 *
 * Non-invasive:
 * - Subscribes to event bus
 * - Does not modify events or intent results
 * - Sink failures do not crash kernel (best-effort with failure counter)
 */
class CoreOSAuditCollector {
    sink;
    chainId;
    unsubscribe = null;
    failureCount = 0;
    currentSeq = 0;
    lastHash = integrity_1.GENESIS_HASH;
    constructor(sink, chainId) {
        this.sink = sink;
        this.chainId = chainId ?? `audit-${Date.now()}`;
        // Initialize from sink's current head
        const head = sink.getHead();
        this.currentSeq = head.seq;
        this.lastHash = head.hash;
    }
    /**
     * Start collecting DECISION_EXPLAINED events
     */
    start() {
        if (this.unsubscribe) {
            return; // Already started
        }
        const eventBus = (0, event_bus_js_1.getEventBus)();
        this.unsubscribe = eventBus.subscribe((event) => {
            if (event.type === 'DECISION_EXPLAINED') {
                this.handleDecisionExplained(event.payload);
            }
        });
    }
    /**
     * Stop collecting
     */
    stop() {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
    }
    /**
     * Handle DECISION_EXPLAINED event
     */
    handleDecisionExplained(payload) {
        try {
            this.currentSeq++;
            const record = (0, integrity_1.buildAuditRecord)({
                chainId: this.chainId,
                seq: this.currentSeq,
                recordedAt: Date.now(),
                payload,
                prevHash: this.lastHash,
            });
            this.sink.append(record);
            this.lastHash = record.recordHash;
        }
        catch (error) {
            // Best-effort: count failure but don't crash
            this.failureCount++;
            // Rollback seq on failure
            this.currentSeq--;
        }
    }
    /**
     * Get current chain head
     */
    getHead() {
        return this.sink.getHead();
    }
    /**
     * Export to JSONL
     */
    exportJsonl() {
        return this.sink.exportJsonl();
    }
    /**
     * Get failure count
     */
    getFailureCount() {
        return this.failureCount;
    }
    /**
     * Get chain ID
     */
    getChainId() {
        return this.chainId;
    }
}
exports.CoreOSAuditCollector = CoreOSAuditCollector;
// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON
// ═══════════════════════════════════════════════════════════════════════════
let instance = null;
function getAuditCollector(sink, chainId) {
    if (!instance && sink) {
        instance = new CoreOSAuditCollector(sink, chainId);
    }
    if (!instance) {
        throw new Error('AuditCollector not initialized. Provide a sink first.');
    }
    return instance;
}
function resetAuditCollector() {
    if (instance) {
        instance.stop();
    }
    instance = null;
}
//# sourceMappingURL=collector.js.map