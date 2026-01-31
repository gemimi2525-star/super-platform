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
export class CoreOSEventBus {
    private listeners: Set<EventListener> = new Set();
    private history: SystemEvent[] = [];
    private readonly maxHistory = 100;

    /**
     * Subscribe to events
     */
    subscribe(listener: EventListener): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    /**
     * Emit an event to all listeners
     */
    emit(event: SystemEvent): void {
        // Track history
        this.history.push(event);
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }

        // Notify all listeners
        for (const listener of this.listeners) {
            try {
                listener(event);
            } catch (error) {
                console.error('[EventBus] Listener error:', error);
            }
        }
    }

    /**
     * Get event history (for debugging)
     */
    getHistory(): readonly SystemEvent[] {
        return [...this.history];
    }

    /**
     * Get events by correlation ID
     */
    getByCorrelation(correlationId: CorrelationId): readonly SystemEvent[] {
        return this.history.filter(e => e.correlationId === correlationId);
    }

    /**
     * Clear all listeners
     */
    clear(): void {
        this.listeners.clear();
    }

    /**
     * Reset history
     */
    clearHistory(): void {
        this.history = [];
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON
// ═══════════════════════════════════════════════════════════════════════════

let instance: CoreOSEventBus | null = null;

export function getEventBus(): CoreOSEventBus {
    if (!instance) {
        instance = new CoreOSEventBus();
    }
    return instance;
}

export function resetEventBus(): void {
    if (instance) {
        instance.clear();
        instance.clearHistory();
    }
    instance = null;
}
