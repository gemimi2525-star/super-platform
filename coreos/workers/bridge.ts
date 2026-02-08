/**
 * ═══════════════════════════════════════════════════════════════════════════
 * WORKER BRIDGE (Main Thread)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Manages the Background Worker instance.
 * Provides API to enqueue jobs and listen for updates.
 * 
 * @module coreos/workers/bridge
 */

import type { Job, WorkerMessage, GlobalSyncState, JobUpdatePayload, SyncConflict, ResolutionStrategy } from './types';

type StateListener = (state: GlobalSyncState) => void;

export class WorkerBridge {
    private worker: Worker | null = null;
    private isReady: boolean = false;
    private listeners: Set<StateListener> = new Set();

    // Internal State
    private state: GlobalSyncState = {
        connectivity: typeof navigator !== 'undefined' && navigator.onLine ? 'ONLINE' : 'OFFLINE',
        syncStatus: 'IDLE',
        pendingCount: 0,
        activeConflict: undefined
    };

    constructor() {
        // Setup network listeners
        if (typeof window !== 'undefined') {
            window.addEventListener('online', () => this.updateConnectivity('ONLINE'));
            window.addEventListener('offline', () => this.updateConnectivity('OFFLINE'));
        }
    }

    /**
     * Start the worker
     */
    init() {
        if (this.worker) return;

        // In a real build setup, you might need a specific loader for workers.
        // For standard Vite/Webpack, new Worker(new URL(...)) works.
        // Here we assume a path that builds correctly.
        // NOTE: In some setups, this needs to be a separate entry point.
        // For this Prototype, we might need to bundle it or references might break if imports aren't handled.

        try {
            this.worker = new Worker(new URL('./host.ts', import.meta.url), {
                type: 'module'
            });

            this.worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
                const { type, payload } = event.data;
                // console.log(`[WorkerBridge] Msg: ${type}`, payload);

                switch (type) {
                    case 'WORKER_READY':
                        this.isReady = true;
                        break;

                    case 'JOB_UPDATE':
                        this.handleJobUpdate(payload as JobUpdatePayload);
                        break;

                    case 'WORKER_ERROR':
                        this.state = { ...this.state, syncStatus: 'ERROR', lastError: payload.toString() };
                        this.notifyListeners();
                        break;

                    case 'CONFLICT_DETECTED': // Phase 23B
                        this.state = { ...this.state, activeConflict: payload as SyncConflict };
                        this.notifyListeners();
                        break;
                }
            };

            console.log('[WorkerBridge] Worker Started');
        } catch (e) {
            console.error('[WorkerBridge] Failed to start worker:', e);
        }
    }

    /**
     * Send a job to the worker
     */
    enqueueJob(job: Job) {
        if (!this.worker) this.init();

        // Optimistic update
        this.state = {
            ...this.state,
            pendingCount: this.state.pendingCount + 1,
            syncStatus: this.state.connectivity === 'ONLINE' ? 'SYNCING' : 'PENDING_RETRY'
        };
        this.notifyListeners();

        const message: WorkerMessage = {
            type: 'ENQUEUE_JOB',
            payload: job
        };
        this.worker?.postMessage(message);
    }

    terminate() {
        this.worker?.terminate();
        this.worker = null;
        this.isReady = false;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CONFLICT RESOLUTION (Phase 23B)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Resolve a conflict (Phase 23B)
     */
    resolveConflict(conflictId: string, strategy: ResolutionStrategy) {
        if (!this.worker) return;

        console.log(`[WorkerBridge] Resolving Conflict ${conflictId} with ${strategy}`);

        // Optimistic clear
        this.state = { ...this.state, activeConflict: undefined };
        this.notifyListeners();

        this.worker.postMessage({
            type: 'RESOLVE_CONFLICT',
            payload: { conflictId, strategy }
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STATE MANAGEMENT (Phase 23A)
    // ─────────────────────────────────────────────────────────────────────────

    subscribe(listener: StateListener): () => void {
        this.listeners.add(listener);
        listener(this.state); // Initial emission
        return () => this.listeners.delete(listener);
    }

    private notifyListeners() {
        // Broadcast a copy to prevent mutation
        const snapshot = { ...this.state };
        this.listeners.forEach(l => l(snapshot));
    }

    private updateConnectivity(status: 'ONLINE' | 'OFFLINE') {
        this.state = { ...this.state, connectivity: status };

        // Auto-recover logic
        if (status === 'ONLINE' && this.state.pendingCount > 0) {
            this.state.syncStatus = 'SYNCING';
            // Trigger worker resume if needed
            this.worker?.postMessage({ type: 'RESUME_WORKER', payload: {} });
        } else if (status === 'OFFLINE') {
            if (this.state.syncStatus === 'SYNCING') {
                this.state.syncStatus = 'PENDING_RETRY';
            }
        }

        this.notifyListeners();
    }

    private handleJobUpdate(payload: JobUpdatePayload) {
        const { status, pendingCount } = payload;

        if (pendingCount !== undefined) {
            this.state.pendingCount = pendingCount;
        } else {
            // Fallback if worker doesn't send count
            if (status === 'COMPLETED' || status === 'FAILED') {
                this.state.pendingCount = Math.max(0, this.state.pendingCount - 1);
            }
        }

        if (this.state.pendingCount === 0) {
            this.state.syncStatus = 'IDLE';
            this.state.lastSyncedAt = Date.now();
        } else {
            this.state.syncStatus = 'SYNCING';
        }

        if (status === 'FAILED') {
            this.state.syncStatus = 'ERROR';
            this.state.lastError = payload.error;
        }

        this.notifyListeners();
    }
}

export const workerBridge = new WorkerBridge();
