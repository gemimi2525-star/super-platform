/**
 * Core OS Recycle Bin System (Phase 27A)
 * Provides "Soft Delete" capability with restoration and metadata tracking.
 */

export interface RecycleItem {
    id: string;
    originalPath: string;
    fileName: string;
    deletedBy: string; // 'user' | 'ai-shadow' | 'ai-assist' | 'system-auto'
    deletedAt: number;
    size: number;
}

class RecycleBin {
    private items: Map<string, RecycleItem> = new Map();

    /**
     * Soft delete a file (Move to Recycle Bin)
     */
    async deleteFile(path: string, by: string): Promise<RecycleItem> {
        const id = `bin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const fileName = path.split('/').pop() || 'unknown';

        const item: RecycleItem = {
            id,
            originalPath: path,
            fileName,
            deletedBy: by,
            deletedAt: Date.now(),
            size: 1024 // Mock size
        };

        this.items.set(id, item);
        console.log(`[RecycleBin] Moved to bin: ${path} (ID: ${id})`);
        return item;
    }

    /**
     * Restore a file from Recycle Bin
     */
    async restoreFile(id: string): Promise<boolean> {
        const item = this.items.get(id);
        if (!item) {
            throw new Error(`Recycle bin item not found: ${id}`);
        }

        console.log(`[RecycleBin] Restoring ${item.fileName} to ${item.originalPath}`);
        this.items.delete(id);
        return true;
    }

    /**
     * Permanently delete (Purge)
     */
    async purge(id: string): Promise<boolean> {
        if (!this.items.has(id)) return false;
        console.log(`[RecycleBin] Permanently deleting ${id}`);
        this.items.delete(id);
        return true;
    }

    list(): RecycleItem[] {
        return Array.from(this.items.values());
    }
}

export const recycleBin = new RecycleBin();
