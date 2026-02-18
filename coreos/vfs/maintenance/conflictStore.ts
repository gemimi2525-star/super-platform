/**
 * ═══════════════════════════════════════════════════════════════════════════
 * VFS CONFLICT STORE (Phase 37B)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * In-memory conflict record store for VFS naming conflicts.
 * Supports conflicts from duplicate scans AND offline replay (409).
 *
 * STORAGE: In-memory only (no Firestore write in this phase).
 * Records persist for the browser session via sessionStorage fallback.
 *
 * @module coreos/vfs/maintenance/conflictStore
 */

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type ConflictType = 'DUPLICATE_NAME' | 'SYNC_CONFLICT';
export type ConflictStatus = 'OPEN' | 'RESOLVED' | 'IGNORED';
export type ConflictResolution = 'RENAMED' | 'DELETED' | 'MERGED' | 'IGNORED';

export interface ConflictRecord {
    id: string;
    type: ConflictType;
    parentPath: string;
    canonicalKey: string;
    entries: string[];           // conflicting names
    status: ConflictStatus;
    resolution?: ConflictResolution;
    createdAt: number;
    resolvedAt?: number;
    source?: string;             // 'scan' | 'sync-replay' | 'manual'
}

export interface ConflictSummary {
    open: number;
    resolved: number;
    ignored: number;
    total: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// STORAGE KEY
// ═══════════════════════════════════════════════════════════════════════════

const STORE_KEY = 'coreos:vfs:conflicts';

// ═══════════════════════════════════════════════════════════════════════════
// CONFLICT STORE
// ═══════════════════════════════════════════════════════════════════════════

type ConflictListener = (summary: ConflictSummary) => void;

class ConflictStore {
    private records: ConflictRecord[] = [];
    private listeners: Set<ConflictListener> = new Set();
    private initialized = false;

    /**
     * Initialize from sessionStorage (if available)
     */
    private init(): void {
        if (this.initialized) return;
        this.initialized = true;

        if (typeof sessionStorage === 'undefined') return;
        try {
            const raw = sessionStorage.getItem(STORE_KEY);
            if (raw) {
                this.records = JSON.parse(raw);
            }
        } catch {
            // Silently ignore parse errors
        }
    }

    /**
     * Persist to sessionStorage
     */
    private persist(): void {
        if (typeof sessionStorage === 'undefined') return;
        try {
            sessionStorage.setItem(STORE_KEY, JSON.stringify(this.records));
        } catch {
            // Quota exceeded — silently fail
        }
    }

    /**
     * Add a conflict record
     */
    add(record: Omit<ConflictRecord, 'id' | 'createdAt' | 'status'>): ConflictRecord {
        this.init();

        const newRecord: ConflictRecord = {
            ...record,
            id: `conflict-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            status: 'OPEN',
            createdAt: Date.now(),
        };

        this.records.push(newRecord);
        this.persist();
        this.notify();

        console.info('[VFS:ConflictStore] Added:', newRecord.id, newRecord.type);
        return newRecord;
    }

    /**
     * Bulk add conflict records from a scan result
     */
    addFromScan(groups: { parentPath: string; canonicalKey: string; entries: string[] }[]): number {
        this.init();
        let added = 0;

        for (const group of groups) {
            // Skip if identical conflict already exists (same key + parent)
            const exists = this.records.some(
                r => r.canonicalKey === group.canonicalKey
                    && r.parentPath === group.parentPath
                    && r.status !== 'RESOLVED',
            );
            if (exists) continue;

            this.add({
                type: 'DUPLICATE_NAME',
                parentPath: group.parentPath,
                canonicalKey: group.canonicalKey,
                entries: group.entries,
                source: 'scan',
            });
            added++;
        }

        return added;
    }

    /**
     * Resolve a conflict
     */
    resolve(id: string, resolution: ConflictResolution): boolean {
        this.init();

        const record = this.records.find(r => r.id === id);
        if (!record || record.status === 'RESOLVED') return false;

        record.status = resolution === 'IGNORED' ? 'IGNORED' : 'RESOLVED';
        record.resolution = resolution;
        record.resolvedAt = Date.now();

        this.persist();
        this.notify();

        console.info('[VFS:ConflictStore] Resolved:', id, resolution);
        return true;
    }

    /**
     * Get all records
     */
    list(filter?: { status?: ConflictStatus; type?: ConflictType }): ConflictRecord[] {
        this.init();

        if (!filter) return [...this.records];

        return this.records.filter(r => {
            if (filter.status && r.status !== filter.status) return false;
            if (filter.type && r.type !== filter.type) return false;
            return true;
        });
    }

    /**
     * Get summary counts
     */
    getSummary(): ConflictSummary {
        this.init();

        return {
            open: this.records.filter(r => r.status === 'OPEN').length,
            resolved: this.records.filter(r => r.status === 'RESOLVED').length,
            ignored: this.records.filter(r => r.status === 'IGNORED').length,
            total: this.records.length,
        };
    }

    /**
     * Get count of open conflicts
     */
    getOpenCount(): number {
        this.init();
        return this.records.filter(r => r.status === 'OPEN').length;
    }

    /**
     * Subscribe to changes
     */
    subscribe(listener: ConflictListener): () => void {
        this.listeners.add(listener);
        return () => { this.listeners.delete(listener); };
    }

    /**
     * Clear all records (for testing / reset)
     */
    clear(): void {
        this.records = [];
        this.persist();
        this.notify();
    }

    private notify(): void {
        const summary = this.getSummary();
        this.listeners.forEach(fn => {
            try { fn(summary); } catch { /* ignored */ }
        });
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON
// ═══════════════════════════════════════════════════════════════════════════

let _instance: ConflictStore | null = null;

export function getConflictStore(): ConflictStore {
    if (!_instance) {
        _instance = new ConflictStore();
    }
    return _instance;
}

export { ConflictStore };
