/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SYNAPSE — Intelligence Observer (READ-ONLY)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Read-only observer that allows Intelligence Layer to:
 * - Subscribe to EventBus (READ-ONLY)
 * - Read snapshots of SystemState (IMMUTABLE)
 * 
 * CONSTRAINTS:
 * - ❌ Cannot mutate state
 * - ❌ Cannot dispatch actions
 * - ❌ Cannot emit intents
 * - ✅ Can observe and analyze
 * 
 * @module coreos/intelligence/observer
 * @version 1.0.0
 */

import type { SystemState, SystemEvent } from '../types';
import type { IntelligenceObserver } from './types';
import { getStateStore } from '../state';
import { getEventBus } from '../event-bus';

// ═══════════════════════════════════════════════════════════════════════════
// IMMUTABLE STATE SNAPSHOT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a deep-frozen snapshot of state
 * Ensures AI cannot accidentally mutate state
 */
function createImmutableSnapshot(state: SystemState): Readonly<SystemState> {
    // JSON parse/stringify creates a deep copy
    // Object.freeze prevents mutations
    return Object.freeze(JSON.parse(JSON.stringify(state))) as SystemState;
}

// ═══════════════════════════════════════════════════════════════════════════
// INTELLIGENCE BRIDGE (READ-ONLY ACCESS)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Intelligence Bridge — Provides READ-ONLY access to kernel
 * 
 * This is the ONLY way Intelligence Layer can access the system.
 * All access is read-only with immutable snapshots.
 */
export class IntelligenceBridge {
    private observers: Set<IntelligenceObserver> = new Set();
    private eventUnsubscribe: (() => void) | null = null;
    private stateUnsubscribe: (() => void) | null = null;
    private isConnected: boolean = false;

    /**
     * Connect to kernel (READ-ONLY)
     * Starts forwarding events and state changes to observers
     */
    connect(): void {
        if (this.isConnected) return;

        const eventBus = getEventBus();
        const stateStore = getStateStore();

        // Subscribe to events (READ-ONLY)
        this.eventUnsubscribe = eventBus.subscribe((event) => {
            // Create immutable copy before forwarding
            const frozenEvent = Object.freeze({ ...event }) as SystemEvent;
            this.notifyEvent(frozenEvent);
        });

        // Subscribe to state changes (READ-ONLY)
        this.stateUnsubscribe = stateStore.subscribe((state) => {
            // Create immutable snapshot
            const snapshot = createImmutableSnapshot(state);
            this.notifyStateChange(snapshot);
        });

        this.isConnected = true;
    }

    /**
     * Disconnect from kernel
     * Stops all observation
     */
    disconnect(): void {
        if (this.eventUnsubscribe) {
            this.eventUnsubscribe();
            this.eventUnsubscribe = null;
        }
        if (this.stateUnsubscribe) {
            this.stateUnsubscribe();
            this.stateUnsubscribe = null;
        }
        this.isConnected = false;
    }

    /**
     * Register an observer
     * Observer will receive READ-ONLY events and state
     */
    registerObserver(observer: IntelligenceObserver): () => void {
        this.observers.add(observer);
        return () => this.observers.delete(observer);
    }

    /**
     * Get current state snapshot (IMMUTABLE)
     * This is a point-in-time snapshot, not live state
     */
    getStateSnapshot(): Readonly<SystemState> {
        const state = getStateStore().getState();
        return createImmutableSnapshot(state);
    }

    /**
     * Check if connected
     */
    isActive(): boolean {
        return this.isConnected;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PRIVATE — Notification (READ-ONLY dispatch)
    // ═══════════════════════════════════════════════════════════════════════

    private notifyEvent(event: Readonly<SystemEvent>): void {
        for (const observer of this.observers) {
            try {
                // Observer receives IMMUTABLE event
                observer.onEvent(event);
            } catch (error) {
                // Observer errors don't affect system
                console.error('[IntelligenceBridge] Observer error on event:', error);
            }
        }
    }

    private notifyStateChange(state: Readonly<SystemState>): void {
        for (const observer of this.observers) {
            try {
                // Observer receives IMMUTABLE state
                observer.onStateChange(state);
            } catch (error) {
                // Observer errors don't affect system
                console.error('[IntelligenceBridge] Observer error on state:', error);
            }
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON
// ═══════════════════════════════════════════════════════════════════════════

let bridgeInstance: IntelligenceBridge | null = null;

/**
 * Get the Intelligence Bridge (singleton)
 */
export function getIntelligenceBridge(): IntelligenceBridge {
    if (!bridgeInstance) {
        bridgeInstance = new IntelligenceBridge();
    }
    return bridgeInstance;
}

/**
 * Reset the Intelligence Bridge (for testing)
 */
export function resetIntelligenceBridge(): void {
    if (bridgeInstance) {
        bridgeInstance.disconnect();
    }
    bridgeInstance = null;
}
