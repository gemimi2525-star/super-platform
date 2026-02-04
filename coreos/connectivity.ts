/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NEXUS Shell — Connectivity Monitor (Phase 7.2)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * System-level connectivity state management.
 * Detects: ONLINE / DEGRADED / OFFLINE
 * 
 * Part of: NEXUS Shell → ORBIT Window System → SYNAPSE Kernel
 * 
 * @module coreos/connectivity
 * @version 1.0.0 (Phase 7.2)
 * @see /coreos/naming.ts for canonical naming constants
 */

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type ConnectivityStatus = 'ONLINE' | 'DEGRADED' | 'OFFLINE';

export interface ConnectivityState {
    status: ConnectivityStatus;
    lastChangeAt: number;
    lastCheckAt: number;
    consecutiveFailures: number;
}

export type ConnectivityListener = (state: ConnectivityState) => void;

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const HEALTH_CHECK_URL = '/api/platform/health';
const HEALTH_CHECK_TIMEOUT_MS = 8000;
const HEALTH_CHECK_INTERVAL_MS = 30000; // Check every 30s
const DEGRADED_THRESHOLD = 2; // Consecutive failures before degraded
const OFFLINE_THRESHOLD = 3; // Consecutive failures before offline

// ═══════════════════════════════════════════════════════════════════════════
// CONNECTIVITY MONITOR (SINGLETON)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * ConnectivityMonitor — System-level connectivity state
 * 
 * Features:
 * - Uses navigator.onLine as base signal
 * - Health check ping for degraded detection
 * - Event-driven updates (no polling when offline)
 */
class ConnectivityMonitor {
    private state: ConnectivityState;
    private listeners: Set<ConnectivityListener> = new Set();
    private checkIntervalId: ReturnType<typeof setInterval> | null = null;
    private isClient: boolean;

    constructor() {
        this.isClient = typeof window !== 'undefined';

        this.state = {
            status: this.isClient && navigator.onLine ? 'ONLINE' : 'OFFLINE',
            lastChangeAt: Date.now(),
            lastCheckAt: Date.now(),
            consecutiveFailures: 0,
        };

        if (this.isClient) {
            this.setupEventListeners();
            this.startHealthCheck();
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PUBLIC API
    // ─────────────────────────────────────────────────────────────────────────

    getState(): ConnectivityState {
        return { ...this.state };
    }

    subscribe(listener: ConnectivityListener): () => void {
        this.listeners.add(listener);
        // Immediately notify with current state
        listener(this.getState());
        return () => this.listeners.delete(listener);
    }

    /**
     * Force a connectivity check (e.g., user clicked Retry)
     */
    async forceCheck(): Promise<ConnectivityStatus> {
        await this.performHealthCheck();
        return this.state.status;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE METHODS
    // ─────────────────────────────────────────────────────────────────────────

    private setupEventListeners(): void {
        window.addEventListener('online', this.handleOnline);
        window.addEventListener('offline', this.handleOffline);
    }

    private handleOnline = (): void => {
        // Browser says online — verify with health check
        this.performHealthCheck();
    };

    private handleOffline = (): void => {
        this.updateStatus('OFFLINE');
    };

    private startHealthCheck(): void {
        // Initial check
        this.performHealthCheck();

        // Periodic checks
        this.checkIntervalId = setInterval(() => {
            if (navigator.onLine) {
                this.performHealthCheck();
            }
        }, HEALTH_CHECK_INTERVAL_MS);
    }

    private async performHealthCheck(): Promise<void> {
        if (!this.isClient) return;

        // If browser says offline, don't bother checking
        if (!navigator.onLine) {
            this.updateStatus('OFFLINE');
            return;
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT_MS);

            const response = await fetch(HEALTH_CHECK_URL, {
                method: 'GET',
                signal: controller.signal,
                cache: 'no-store',
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                // Success — reset failures, go online
                this.state.consecutiveFailures = 0;
                this.updateStatus('ONLINE');
            } else {
                // Server error — count as failure
                this.handleCheckFailure();
            }
        } catch {
            // Network error or timeout
            this.handleCheckFailure();
        }

        this.state.lastCheckAt = Date.now();
    }

    private handleCheckFailure(): void {
        this.state.consecutiveFailures++;

        if (this.state.consecutiveFailures >= OFFLINE_THRESHOLD) {
            this.updateStatus('OFFLINE');
        } else if (this.state.consecutiveFailures >= DEGRADED_THRESHOLD) {
            this.updateStatus('DEGRADED');
        }
        // If < DEGRADED_THRESHOLD, stay at current status (might still be ONLINE)
    }

    private updateStatus(newStatus: ConnectivityStatus): void {
        if (this.state.status !== newStatus) {
            this.state.status = newStatus;
            this.state.lastChangeAt = Date.now();
            this.notifyListeners();

            // Log for ops visibility (read-only)
            if (typeof console !== 'undefined') {
                console.info(`[NEXUS] Connectivity: ${newStatus}`);
            }
        }
    }

    private notifyListeners(): void {
        const currentState = this.getState();
        this.listeners.forEach(listener => {
            try {
                listener(currentState);
            } catch (err) {
                console.error('[NEXUS] Connectivity listener error:', err);
            }
        });
    }

    // Cleanup (for testing)
    destroy(): void {
        if (this.checkIntervalId) {
            clearInterval(this.checkIntervalId);
        }
        if (this.isClient) {
            window.removeEventListener('online', this.handleOnline);
            window.removeEventListener('offline', this.handleOffline);
        }
        this.listeners.clear();
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON INSTANCE
// ═══════════════════════════════════════════════════════════════════════════

let instance: ConnectivityMonitor | null = null;

export function getConnectivityMonitor(): ConnectivityMonitor {
    if (!instance) {
        instance = new ConnectivityMonitor();
    }
    return instance;
}

// For testing
export function resetConnectivityMonitor(): void {
    if (instance) {
        instance.destroy();
        instance = null;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// CONVENIENCE EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export function getConnectivityStatus(): ConnectivityStatus {
    return getConnectivityMonitor().getState().status;
}

export function subscribeToConnectivity(listener: ConnectivityListener): () => void {
    return getConnectivityMonitor().subscribe(listener);
}

export function forceConnectivityCheck(): Promise<ConnectivityStatus> {
    return getConnectivityMonitor().forceCheck();
}
