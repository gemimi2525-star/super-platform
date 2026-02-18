/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Sync Queue — Phase 36.4
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Offline write-back queue for non-critical actions.
 * Stores pending actions in localStorage, replays with idempotency keys
 * when back online.
 * 
 * SECURITY:
 * - Only non-critical actions (intent events, audit ingestion)
 * - Tool execution ALWAYS requires online (governance engine is server-side)
 * - Idempotency keys prevent duplicate processing
 */

const QUEUE_KEY = 'coreos:syncQueue';
const MAX_RETRIES = 3;

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type SyncItemStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface SyncQueueItem {
    id: string;
    url: string;
    method: 'POST' | 'PUT' | 'PATCH';
    body: unknown;
    headers?: Record<string, string>;
    createdAt: number;
    retryCount: number;
    idempotencyKey: string;
    status: SyncItemStatus;
    lastError?: string;
}

export interface QueueStatus {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    total: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function generateId(): string {
    return `sq_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function generateIdempotencyKey(): string {
    // Crypto-safe UUID-like key
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    // Fallback
    return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// QUEUE PERSISTENCE
// ═══════════════════════════════════════════════════════════════════════════

function loadQueue(): SyncQueueItem[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = localStorage.getItem(QUEUE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveQueue(items: SyncQueueItem[]): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(QUEUE_KEY, JSON.stringify(items));
    } catch (err) {
        console.error('[SyncQueue] Failed to save queue:', err);
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// SYNC QUEUE SINGLETON
// ═══════════════════════════════════════════════════════════════════════════

type SyncQueueListener = (status: QueueStatus) => void;

class SyncQueue {
    private listeners: Set<SyncQueueListener> = new Set();
    private processing = false;

    /**
     * Enqueue an action for later sync
     */
    enqueue(url: string, method: 'POST' | 'PUT' | 'PATCH', body: unknown, headers?: Record<string, string>): string {
        const item: SyncQueueItem = {
            id: generateId(),
            url,
            method,
            body,
            headers,
            createdAt: Date.now(),
            retryCount: 0,
            idempotencyKey: generateIdempotencyKey(),
            status: 'pending',
        };

        const queue = loadQueue();
        queue.push(item);
        saveQueue(queue);
        this.notify();

        console.log(`[SyncQueue] Enqueued: ${method} ${url} (key: ${item.idempotencyKey})`);
        return item.id;
    }

    /**
     * Process all pending items in the queue
     */
    async processQueue(): Promise<{ processed: number; failed: number }> {
        if (this.processing) return { processed: 0, failed: 0 };
        this.processing = true;

        let processed = 0;
        let failed = 0;

        try {
            const queue = loadQueue();
            const pending = queue.filter(item => item.status === 'pending' || item.status === 'processing');

            for (const item of pending) {
                item.status = 'processing';
                saveQueue(queue);
                this.notify();

                try {
                    const response = await fetch(item.url, {
                        method: item.method,
                        headers: {
                            'Content-Type': 'application/json',
                            'X-Idempotency-Key': item.idempotencyKey,
                            'X-Offline-Queued': 'true',
                            ...item.headers,
                        },
                        body: JSON.stringify(item.body),
                    });

                    if (response.ok || response.status === 409) {
                        // 200 = success, 409 = duplicate (idempotent — treat as success)
                        item.status = 'completed';
                        processed++;
                        console.log(`[SyncQueue] ✅ Synced: ${item.method} ${item.url}`);
                    } else if (response.status >= 500) {
                        // Server error — retry later
                        item.retryCount++;
                        if (item.retryCount >= MAX_RETRIES) {
                            item.status = 'failed';
                            item.lastError = `HTTP ${response.status} after ${MAX_RETRIES} retries`;
                            failed++;
                        } else {
                            item.status = 'pending';
                        }
                    } else {
                        // 4xx = client error — permanent failure
                        item.status = 'failed';
                        item.lastError = `HTTP ${response.status}`;
                        failed++;
                    }
                } catch (err) {
                    // Network error — retry later
                    item.retryCount++;
                    if (item.retryCount >= MAX_RETRIES) {
                        item.status = 'failed';
                        item.lastError = err instanceof Error ? err.message : 'Network error';
                        failed++;
                    } else {
                        item.status = 'pending';
                    }
                }

                saveQueue(queue);
                this.notify();
            }
        } finally {
            this.processing = false;
        }

        // Clean up completed items older than 1 hour
        this.cleanup();

        return { processed, failed };
    }

    /**
     * Get current queue status
     */
    getStatus(): QueueStatus {
        const queue = loadQueue();
        return {
            pending: queue.filter(i => i.status === 'pending').length,
            processing: queue.filter(i => i.status === 'processing').length,
            completed: queue.filter(i => i.status === 'completed').length,
            failed: queue.filter(i => i.status === 'failed').length,
            total: queue.length,
        };
    }

    /**
     * Get all queue items (for UI display)
     */
    getItems(): SyncQueueItem[] {
        return loadQueue();
    }

    /**
     * Subscribe to queue status changes
     */
    subscribe(listener: SyncQueueListener): () => void {
        this.listeners.add(listener);
        return () => { this.listeners.delete(listener); };
    }

    /**
     * Clear completed/failed items
     */
    private cleanup(): void {
        const queue = loadQueue();
        const cutoff = Date.now() - 60 * 60 * 1000; // 1 hour
        const cleaned = queue.filter(
            item => item.status === 'pending' || item.status === 'processing' || item.createdAt > cutoff,
        );
        saveQueue(cleaned);
    }

    private notify(): void {
        const status = this.getStatus();
        this.listeners.forEach(fn => {
            try { fn(status); } catch { /* ignored */ }
        });
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON
// ═══════════════════════════════════════════════════════════════════════════

let _instance: SyncQueue | null = null;

export function getSyncQueue(): SyncQueue {
    if (!_instance) {
        _instance = new SyncQueue();
    }
    return _instance;
}

export { SyncQueue };
