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

import type { SystemEvent, DecisionExplanation } from '../types/index.js';
import type { AuditRecord, AuditSink, AuditCollector, ChainHead } from './types.js';
import { buildAuditRecord, GENESIS_HASH } from './integrity';
import { getEventBus } from '../kernel/event-bus.js';

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
export class CoreOSAuditCollector implements AuditCollector {
    private readonly sink: AuditSink;
    private readonly chainId: string;
    private unsubscribe: (() => void) | null = null;
    private failureCount: number = 0;
    private currentSeq: number = 0;
    private lastHash: string = GENESIS_HASH;

    constructor(sink: AuditSink, chainId?: string) {
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
    start(): void {
        if (this.unsubscribe) {
            return; // Already started
        }

        const eventBus = getEventBus();
        this.unsubscribe = eventBus.subscribe((event: SystemEvent) => {
            if (event.type === 'DECISION_EXPLAINED') {
                this.handleDecisionExplained(event.payload);
            }
        });
    }

    /**
     * Stop collecting
     */
    stop(): void {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
    }

    /**
     * Handle DECISION_EXPLAINED event
     */
    private handleDecisionExplained(payload: DecisionExplanation): void {
        try {
            this.currentSeq++;

            const record = buildAuditRecord({
                chainId: this.chainId,
                seq: this.currentSeq,
                recordedAt: Date.now(),
                payload,
                prevHash: this.lastHash,
            });

            this.sink.append(record);
            this.lastHash = record.recordHash;
        } catch (error) {
            // Best-effort: count failure but don't crash
            this.failureCount++;
            // Rollback seq on failure
            this.currentSeq--;
        }
    }

    /**
     * Get current chain head
     */
    getHead(): ChainHead {
        return this.sink.getHead();
    }

    /**
     * Export to JSONL
     */
    exportJsonl(): string {
        return this.sink.exportJsonl();
    }

    /**
     * Get failure count
     */
    getFailureCount(): number {
        return this.failureCount;
    }

    /**
     * Get chain ID
     */
    getChainId(): string {
        return this.chainId;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON
// ═══════════════════════════════════════════════════════════════════════════

let instance: CoreOSAuditCollector | null = null;

export function getAuditCollector(sink?: AuditSink, chainId?: string): CoreOSAuditCollector {
    if (!instance && sink) {
        instance = new CoreOSAuditCollector(sink, chainId);
    }
    if (!instance) {
        throw new Error('AuditCollector not initialized. Provide a sink first.');
    }
    return instance;
}

export function resetAuditCollector(): void {
    if (instance) {
        instance.stop();
    }
    instance = null;
}
