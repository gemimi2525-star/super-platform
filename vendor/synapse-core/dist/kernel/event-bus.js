"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoreOSEventBus = void 0;
exports.getEventBus = getEventBus;
exports.resetEventBus = resetEventBus;
/**
 * Event Bus - Central pub/sub with correlation tracking
 */
class CoreOSEventBus {
    listeners = new Set();
    history = [];
    maxHistory = 100;
    /**
     * Subscribe to events
     */
    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
    /**
     * Emit an event to all listeners
     */
    emit(event) {
        // Track history
        this.history.push(event);
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }
        // Notify all listeners
        for (const listener of this.listeners) {
            try {
                listener(event);
            }
            catch (error) {
                console.error('[EventBus] Listener error:', error);
            }
        }
    }
    /**
     * Get event history (for debugging)
     */
    getHistory() {
        return [...this.history];
    }
    /**
     * Get events by correlation ID
     */
    getByCorrelation(correlationId) {
        return this.history.filter(e => e.correlationId === correlationId);
    }
    /**
     * Clear all listeners
     */
    clear() {
        this.listeners.clear();
    }
    /**
     * Reset history
     */
    clearHistory() {
        this.history = [];
    }
}
exports.CoreOSEventBus = CoreOSEventBus;
// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON
// ═══════════════════════════════════════════════════════════════════════════
let instance = null;
function getEventBus() {
    if (!instance) {
        instance = new CoreOSEventBus();
    }
    return instance;
}
function resetEventBus() {
    if (instance) {
        instance.clear();
        instance.clearHistory();
    }
    instance = null;
}
//# sourceMappingURL=event-bus.js.map