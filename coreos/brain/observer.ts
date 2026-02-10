/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AI BRAIN OBSERVER (Phase 18)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * READ-only subscriber to the Core OS EventBus.
 * Collects system events for AI context without emitting any events.
 * 
 * Capabilities:
 * - Subscribe to EventBus (READ-only)
 * - Maintain rolling event history buffer
 * - Provide system summary, anomaly detection
 * - NEVER emit events or mutate system state
 * 
 * @module coreos/brain/observer
 * @version 1.0.0 (Phase 18)
 */

import { getEventBus } from '../event-bus';
import { getStateStore } from '../state';
import { getConnectivityMonitor } from '../connectivity';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface ObservedEvent {
    type: string;
    timestamp: number;
    correlationId?: string;
    data?: Record<string, any>;
    category: 'intent' | 'decision' | 'error' | 'lifecycle' | 'vfs' | 'unknown';
}

export interface SystemSummary {
    timestamp: number;
    windows: {
        total: number;
        focused: string | null;
        minimized: number;
    };
    connectivity: string;
    recentEvents: {
        total: number;
        errors: number;
        denies: number;
    };
    uptime: number;
}

export interface AnomalyReport {
    type: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
    timestamp: number;
    relatedEvents: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// BRAIN OBSERVER
// ═══════════════════════════════════════════════════════════════════════════

const MAX_HISTORY = 200;
const ANOMALY_THRESHOLD_DENY = 10; // 10 DENYs in buffer = anomaly
const ANOMALY_THRESHOLD_ERROR = 5; // 5 errors in buffer = anomaly

class BrainObserver {
    private history: ObservedEvent[] = [];
    private unsubscribe: (() => void) | null = null;
    private startTime: number = Date.now();
    private isActive: boolean = false;

    /**
     * Start observing the EventBus (READ-only)
     * Safe to call multiple times — will not create duplicate subscriptions
     */
    start(): void {
        if (this.isActive) return;

        try {
            const eventBus = getEventBus();
            this.unsubscribe = eventBus.subscribe((event: any) => {
                this.recordEvent(event);
            });
            this.isActive = true;
            this.startTime = Date.now();
            console.log('[BrainObserver] 🔍 Started observing (READ-only)');
        } catch (e) {
            console.warn('[BrainObserver] Could not start — EventBus not available');
        }
    }

    /**
     * Stop observing
     */
    stop(): void {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
        this.isActive = false;
        console.log('[BrainObserver] Stopped observing');
    }

    /**
     * Record an event into the rolling history buffer
     * NEVER emits events — read-only
     */
    private recordEvent(event: any): void {
        const observed: ObservedEvent = {
            type: event.type || 'unknown',
            timestamp: Date.now(),
            correlationId: event.correlationId,
            data: this.sanitizeEventData(event),
            category: this.categorizeEvent(event.type || ''),
        };

        this.history.push(observed);

        // Rolling buffer — drop oldest when full
        if (this.history.length > MAX_HISTORY) {
            this.history.shift();
        }
    }

    /**
     * Sanitize event data — remove sensitive fields
     */
    private sanitizeEventData(event: any): Record<string, any> {
        const { type, correlationId, ...rest } = event;
        // Strip potential secrets
        const sanitized: Record<string, any> = {};
        for (const [key, value] of Object.entries(rest)) {
            if (key.toLowerCase().includes('password') ||
                key.toLowerCase().includes('secret') ||
                key.toLowerCase().includes('token') ||
                key.toLowerCase().includes('apikey')) {
                sanitized[key] = '[REDACTED]';
            } else {
                sanitized[key] = value;
            }
        }
        return sanitized;
    }

    /**
     * Categorize an event by its type string
     */
    private categorizeEvent(type: string): ObservedEvent['category'] {
        if (type.includes('intent') || type.includes('INTENT')) return 'intent';
        if (type.includes('deny') || type.includes('DENY') || type.includes('allow') || type.includes('ALLOW')) return 'decision';
        if (type.includes('error') || type.includes('ERROR') || type.includes('fail')) return 'error';
        if (type.includes('window') || type.includes('WINDOW') || type.includes('boot') || type.includes('BOOT')) return 'lifecycle';
        if (type.includes('vfs') || type.includes('VFS') || type.includes('fs')) return 'vfs';
        return 'unknown';
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PUBLIC READ APIS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Get recent events (newest first)
     */
    getRecentEvents(count: number = 20): ObservedEvent[] {
        return this.history.slice(-count).reverse();
    }

    /**
     * Get events filtered by category
     */
    getEventsByCategory(category: ObservedEvent['category'], count: number = 20): ObservedEvent[] {
        return this.history
            .filter(e => e.category === category)
            .slice(-count)
            .reverse();
    }

    /**
     * Get system summary for AI context
     */
    getSystemSummary(): SystemSummary {
        let windowTotal = 0;
        let focusedWindow: string | null = null;
        let minimizedCount = 0;
        let connectivity = 'unknown';

        try {
            const state = getStateStore().getState() as any;
            const stateWindows: any[] = Array.isArray(state.windows) ? state.windows : [];
            windowTotal = stateWindows.length;
            focusedWindow = state.focusedWindowId || null;
            minimizedCount = stateWindows.filter((w: any) => w.minimized).length;
        } catch (e) {
            // State store may not be available (server-side)
        }

        try {
            const monitor = getConnectivityMonitor();
            connectivity = monitor.getState().status;
        } catch (e) {
            // Connectivity monitor may not be available
        }

        const errors = this.history.filter(e => e.category === 'error').length;
        const denies = this.history.filter(e =>
            e.category === 'decision' &&
            (e.type.includes('DENY') || e.type.includes('deny'))
        ).length;

        return {
            timestamp: Date.now(),
            windows: {
                total: windowTotal,
                focused: focusedWindow,
                minimized: minimizedCount,
            },
            connectivity,
            recentEvents: {
                total: this.history.length,
                errors,
                denies,
            },
            uptime: Date.now() - this.startTime,
        };
    }

    /**
     * Detect anomalies from event patterns
     */
    getAnomalies(): AnomalyReport[] {
        const anomalies: AnomalyReport[] = [];

        // Check: Excessive DENY events
        const denies = this.history.filter(e =>
            e.category === 'decision' &&
            (e.type.includes('DENY') || e.type.includes('deny'))
        );
        if (denies.length >= ANOMALY_THRESHOLD_DENY) {
            anomalies.push({
                type: 'EXCESSIVE_DENY',
                severity: 'medium',
                description: `ตรวจพบ DENY ${denies.length} ครั้ง — อาจมีปัญหา permission configuration`,
                timestamp: Date.now(),
                relatedEvents: denies.length,
            });
        }

        // Check: Excessive errors
        const errors = this.history.filter(e => e.category === 'error');
        if (errors.length >= ANOMALY_THRESHOLD_ERROR) {
            anomalies.push({
                type: 'EXCESSIVE_ERRORS',
                severity: 'high',
                description: `ตรวจพบ error ${errors.length} ครั้ง — ควรตรวจสอบระบบ`,
                timestamp: Date.now(),
                relatedEvents: errors.length,
            });
        }

        return anomalies;
    }

    /**
     * Get total event count
     */
    getEventCount(): number {
        return this.history.length;
    }

    /**
     * Check if observer is active
     */
    getIsActive(): boolean {
        return this.isActive;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON INSTANCE
// ═══════════════════════════════════════════════════════════════════════════

let instance: BrainObserver | null = null;

export function getBrainObserver(): BrainObserver {
    if (!instance) {
        instance = new BrainObserver();
    }
    return instance;
}

export function resetBrainObserver(): void {
    if (instance) {
        instance.stop();
    }
    instance = null;
}
