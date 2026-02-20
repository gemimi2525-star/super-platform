/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Sync Queue — Phase 36.4 + 15C.2 (Hardened)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Offline write-back queue for non-critical actions.
 * Stores pending actions in localStorage, replays with idempotency keys
 * when back online.
 * 
 * 15C.2 enhancements:
 * - DEAD status for items exceeding retry limit
 * - retryItem() / dropItem() for dead-letter management
 * - Multi-tab lock (localStorage TTL) to prevent concurrent processQueue
 * - Enriched metadata: lastAttemptAt, ackedAt
 * 
 * SECURITY:
 * - Only non-critical actions (intent events, audit ingestion)
 * - Tool execution ALWAYS requires online (governance engine is server-side)
 * - Idempotency keys prevent duplicate processing
 * 
 * VFS DUPLICATE-NAME SAFETY (Phase 37 / 37B):
 * - Duplicate-name constraint is enforced SERVER-SIDE during replay
 * - Server returns HTTP 409 for duplicate names → creates conflict record (Phase 37B)
 * - Conflict is marked as completed but tracked in ConflictStore for owner resolution
 * - No client-side re-validation needed; server is the authority
 */

const QUEUE_KEY = 'coreos:syncQueue';
const MAX_RETRIES = 3;

// ═══════════════════════════════════════════════════════════════════════════
// MULTI-TAB LOCK (15C.2B)
// ═══════════════════════════════════════════════════════════════════════════

const LOCK_KEY = 'coreos:outboxLock';
const LOCK_TTL_MS = 15_000; // 15 seconds

interface OutboxLock {
    ownerId: string;
    expiresAt: number;
}

function generateOwnerId(): string {
    return `tab_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function acquireOutboxLock(ownerId: string): boolean {
    if (typeof window === 'undefined') return true;
    try {
        const raw = localStorage.getItem(LOCK_KEY);
        if (raw) {
            const lock: OutboxLock = JSON.parse(raw);
            // Lock exists and not expired — check owner
            if (lock.expiresAt > Date.now() && lock.ownerId !== ownerId) {
                return false; // locked by another tab
            }
        }
        // Acquire or renew
        const lock: OutboxLock = { ownerId, expiresAt: Date.now() + LOCK_TTL_MS };
        localStorage.setItem(LOCK_KEY, JSON.stringify(lock));
        return true;
    } catch {
        return true; // localStorage failure → allow (fail-open)
    }
}

function refreshOutboxLock(ownerId: string): void {
    if (typeof window === 'undefined') return;
    try {
        const lock: OutboxLock = { ownerId, expiresAt: Date.now() + LOCK_TTL_MS };
        localStorage.setItem(LOCK_KEY, JSON.stringify(lock));
    } catch { /* ignored */ }
}

function releaseOutboxLock(ownerId: string): void {
    if (typeof window === 'undefined') return;
    try {
        const raw = localStorage.getItem(LOCK_KEY);
        if (raw) {
            const lock: OutboxLock = JSON.parse(raw);
            if (lock.ownerId === ownerId) {
                localStorage.removeItem(LOCK_KEY);
            }
        }
    } catch { /* ignored */ }
}

export function isOutboxLockedByOther(): boolean {
    if (typeof window === 'undefined') return false;
    try {
        const raw = localStorage.getItem(LOCK_KEY);
        if (!raw) return false;
        const lock: OutboxLock = JSON.parse(raw);
        return lock.expiresAt > Date.now();
    } catch {
        return false;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type SyncItemStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'dead';

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
    /** Timestamp of last replay attempt (15C.2) */
    lastAttemptAt?: number;
    /** Timestamp when server acknowledged (15C.2) */
    ackedAt?: number;
}

export interface QueueStatus {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    dead: number;
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
    private readonly ownerId = generateOwnerId();

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
     * Process all pending items in the queue (15C.2B: multi-tab lock)
     */
    async processQueue(): Promise<{ processed: number; failed: number; locked: boolean }> {
        if (this.processing) return { processed: 0, failed: 0, locked: false };

        // 15C.2B: Acquire multi-tab lock
        if (!acquireOutboxLock(this.ownerId)) {
            console.log('[SyncQueue] Locked by another tab, skipping processQueue');
            return { processed: 0, failed: 0, locked: true };
        }

        this.processing = true;
        let processed = 0;
        let failed = 0;

        try {
            const queue = loadQueue();
            const pending = queue.filter(item => item.status === 'pending' || item.status === 'processing');

            for (const item of pending) {
                item.status = 'processing';
                item.lastAttemptAt = Date.now();
                saveQueue(queue);
                this.notify();

                // Refresh lock between items
                refreshOutboxLock(this.ownerId);

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
                        // 200 = success, 409 = duplicate (idempotent — completed but tracked)
                        item.status = 'completed';
                        item.ackedAt = Date.now();
                        processed++;

                        if (response.status === 409) {
                            // Phase 37B: Track naming conflict for owner resolution
                            item.lastError = 'NAMING_CONFLICT';
                            try {
                                const { getConflictStore } = await import('@/coreos/vfs/maintenance/conflictStore');
                                getConflictStore().add({
                                    type: 'SYNC_CONFLICT',
                                    parentPath: item.url,
                                    canonicalKey: item.idempotencyKey,
                                    entries: [item.url],
                                    source: 'sync-replay',
                                });
                            } catch {
                                // ConflictStore unavailable — log only
                                console.warn('[SyncQueue] Could not create conflict record for 409');
                            }
                            console.log(`[SyncQueue] ⚠️ Naming conflict (409): ${item.method} ${item.url}`);
                        } else {
                            console.log(`[SyncQueue] ✅ Synced: ${item.method} ${item.url}`);
                        }
                    } else if (response.status >= 500) {
                        // Server error — retry later
                        item.retryCount++;
                        if (item.retryCount >= MAX_RETRIES) {
                            item.status = 'dead';
                            item.lastError = `HTTP ${response.status} after ${MAX_RETRIES} retries`;
                            failed++;
                            console.log(`[SyncQueue] 💀 Dead-lettered: ${item.method} ${item.url}`);
                        } else {
                            item.status = 'pending';
                        }
                    } else {
                        // 4xx = client error — permanent failure → dead
                        item.status = 'dead';
                        item.lastError = `HTTP ${response.status}`;
                        failed++;
                        console.log(`[SyncQueue] 💀 Dead-lettered (4xx): ${item.method} ${item.url}`);
                    }
                } catch (err) {
                    // Network error — retry later
                    item.retryCount++;
                    if (item.retryCount >= MAX_RETRIES) {
                        item.status = 'dead';
                        item.lastError = err instanceof Error ? err.message : 'Network error';
                        failed++;
                        console.log(`[SyncQueue] 💀 Dead-lettered (network): ${item.method} ${item.url}`);
                    } else {
                        item.status = 'pending';
                    }
                }

                saveQueue(queue);
                this.notify();
            }
        } finally {
            this.processing = false;
            releaseOutboxLock(this.ownerId);
        }

        // Clean up completed items older than 1 hour
        this.cleanup();

        return { processed, failed, locked: false };
    }

    /**
     * Retry a dead/failed item — reset to pending (15C.2D)
     */
    retryItem(id: string): boolean {
        const queue = loadQueue();
        const item = queue.find(i => i.id === id);
        if (!item || (item.status !== 'dead' && item.status !== 'failed')) return false;

        item.status = 'pending';
        item.retryCount = 0;
        item.lastError = undefined;
        item.lastAttemptAt = undefined;
        saveQueue(queue);
        this.notify();
        console.log(`[SyncQueue] ♻️ Retrying: ${item.method} ${item.url}`);
        return true;
    }

    /**
     * Drop/remove an item from the queue (15C.2D)
     */
    dropItem(id: string): boolean {
        const queue = loadQueue();
        const idx = queue.findIndex(i => i.id === id);
        if (idx === -1) return false;

        const item = queue[idx];
        queue.splice(idx, 1);
        saveQueue(queue);
        this.notify();
        console.log(`[SyncQueue] 🗑️ Dropped: ${item.method} ${item.url}`);
        return true;
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
            dead: queue.filter(i => i.status === 'dead').length,
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
     * Clear completed items older than 1 hour (keep dead for inspection)
     */
    private cleanup(): void {
        const queue = loadQueue();
        const cutoff = Date.now() - 60 * 60 * 1000; // 1 hour
        const cleaned = queue.filter(
            item => item.status === 'pending' || item.status === 'processing'
                || item.status === 'dead' || item.createdAt > cutoff,
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
