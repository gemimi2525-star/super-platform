/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SNAPSHOT STORE (Phase 20)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Pre-execution state preservation for rollback/undo.
 * Every execute MUST create a snapshot before applying changes.
 * 
 * Retention: 30 days (configurable)
 * Storage: In-memory for Phase 20 (will move to persistent store later)
 * 
 * @module coreos/brain/snapshot
 */

import { ExecutionSnapshot, ResourceTarget } from './types';

const RETENTION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

class SnapshotStore {
    private snapshots: Map<string, ExecutionSnapshot> = new Map();

    /**
     * Save a snapshot of the current state before execution
     * R2: ทุก execute ต้องสร้าง Snapshot ก่อน
     */
    async save(
        target: ResourceTarget,
        currentState: string
    ): Promise<string> {
        const now = Date.now();
        const snapshotId = `snap-${now}-${target.resourceId}`;

        const snapshot: ExecutionSnapshot = {
            id: snapshotId,
            resourceId: target.resourceId,
            resourceType: target.resourceType,
            state: currentState,
            createdAt: now,
            expiresAt: now + RETENTION_MS,
        };

        this.snapshots.set(snapshotId, snapshot);

        console.log(`[Snapshot] Created: ${snapshotId} for ${target.resourceType}:${target.resourceId}`);
        return snapshotId;
    }

    /**
     * Retrieve a snapshot by reference
     */
    async get(snapshotRef: string): Promise<ExecutionSnapshot | null> {
        const snapshot = this.snapshots.get(snapshotRef);
        if (!snapshot) {
            return null;
        }

        // Check expiry
        if (Date.now() > snapshot.expiresAt) {
            console.warn(`[Snapshot] Expired: ${snapshotRef}`);
            this.snapshots.delete(snapshotRef);
            return null;
        }

        return snapshot;
    }

    /**
     * Check if a snapshot exists and is valid
     */
    async exists(snapshotRef: string): Promise<boolean> {
        const snapshot = await this.get(snapshotRef);
        return snapshot !== null;
    }

    /**
     * Cleanup expired snapshots
     */
    async cleanup(): Promise<number> {
        const now = Date.now();
        let removed = 0;

        for (const [id, snapshot] of this.snapshots.entries()) {
            if (now > snapshot.expiresAt) {
                this.snapshots.delete(id);
                removed++;
            }
        }

        if (removed > 0) {
            console.log(`[Snapshot] Cleanup: removed ${removed} expired snapshots`);
        }
        return removed;
    }

    /**
     * Get total count of stored snapshots
     */
    getCount(): number {
        return this.snapshots.size;
    }

    /**
     * List all snapshots for a resource (for debugging/admin)
     */
    listForResource(resourceId: string): ExecutionSnapshot[] {
        return Array.from(this.snapshots.values())
            .filter(s => s.resourceId === resourceId && Date.now() <= s.expiresAt)
            .sort((a, b) => b.createdAt - a.createdAt);
    }
}

export const snapshotStore = new SnapshotStore();
