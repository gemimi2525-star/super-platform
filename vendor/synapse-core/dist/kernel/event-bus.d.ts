/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CORE OS KERNEL — Event Bus (HARDENED)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Event bus with correlation tracking.
 * Every event carries correlationId for intent tracing.
 *
 * @module coreos/event-bus
 * @version 2.0.0 (Hardened)
 */
import type { SystemEvent, EventListener, CorrelationId } from '../types/index.js';
/**
 * Event Bus - Central pub/sub with correlation tracking
 */
export declare class CoreOSEventBus {
    private listeners;
    private history;
    private readonly maxHistory;
    /**
     * Subscribe to events
     */
    subscribe(listener: EventListener): () => void;
    /**
     * Emit an event to all listeners
     */
    emit(event: SystemEvent): void;
    /**
     * Get event history (for debugging)
     */
    getHistory(): readonly SystemEvent[];
    /**
     * Get events by correlation ID
     */
    getByCorrelation(correlationId: CorrelationId): readonly SystemEvent[];
    /**
     * Clear all listeners
     */
    clear(): void;
    /**
     * Reset history
     */
    clearHistory(): void;
}
export declare function getEventBus(): CoreOSEventBus;
export declare function resetEventBus(): void;
//# sourceMappingURL=event-bus.d.ts.map