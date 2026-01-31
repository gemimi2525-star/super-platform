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
import type { AuditSink, AuditCollector, ChainHead } from './types.js';
/**
 * CoreOSAuditCollector — Collects DECISION_EXPLAINED events
 *
 * Non-invasive:
 * - Subscribes to event bus
 * - Does not modify events or intent results
 * - Sink failures do not crash kernel (best-effort with failure counter)
 */
export declare class CoreOSAuditCollector implements AuditCollector {
    private readonly sink;
    private readonly chainId;
    private unsubscribe;
    private failureCount;
    private currentSeq;
    private lastHash;
    constructor(sink: AuditSink, chainId?: string);
    /**
     * Start collecting DECISION_EXPLAINED events
     */
    start(): void;
    /**
     * Stop collecting
     */
    stop(): void;
    /**
     * Handle DECISION_EXPLAINED event
     */
    private handleDecisionExplained;
    /**
     * Get current chain head
     */
    getHead(): ChainHead;
    /**
     * Export to JSONL
     */
    exportJsonl(): string;
    /**
     * Get failure count
     */
    getFailureCount(): number;
    /**
     * Get chain ID
     */
    getChainId(): string;
}
export declare function getAuditCollector(sink?: AuditSink, chainId?: string): CoreOSAuditCollector;
export declare function resetAuditCollector(): void;
//# sourceMappingURL=collector.d.ts.map