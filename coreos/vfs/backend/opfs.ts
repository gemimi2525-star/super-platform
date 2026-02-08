/**
 * ═══════════════════════════════════════════════════════════════════════════
 * VFS BACKEND: OPFS (Origin Private File System)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Adapter for interactions with the browser's Origin Private File System.
 * Provides low-level file operations mapped from VFS paths.
 * 
 * @module coreos/vfs/backend/opfs
 */

export class OPFSBackend {
    private rootHandle: FileSystemDirectoryHandle | null = null;

    /**
     * Initialize connection to OPFS
     */
    async connect(): Promise<void> {
        if (!this.rootHandle) {
            try {
                this.rootHandle = await navigator.storage.getDirectory();
                console.log('[OPFS] Connected to Origin Private File System');
            } catch (e) {
                console.error('[OPFS] Failed to connect:', e);
                throw new Error('OPFS_CONNECTION_FAILED');
            }
        }
    }

    /**
     * Resolve a path to a FileHandle or DirectoryHandle
     * Path must be absolute relative to OPFS root, e.g., "apps/app-id/data.txt"
     */
    private async resolvePath(path: string, create: boolean = false): Promise<FileSystemHandle> {
        await this.connect();
        if (!this.rootHandle) throw new Error('OPFS_NOT_READY');

        const parts = path.split('/').filter(p => p.length > 0);
        const fileName = parts.pop();
        let currentDir = this.rootHandle;

        // Traverse directories
        for (const part of parts) {
            try {
                currentDir = await currentDir.getDirectoryHandle(part, { create });
            } catch (e) {
                throw new Error(`DIRECTORY_NOT_FOUND: ${part}`);
            }
        }

        if (!fileName) return currentDir; // Returned root if path empty?

        // Get File (or Dir if intended, but this method implies generic handle)
        // For simplicity, we assume generic resolution logic is split in write/read
        return currentDir;
    }

    /**
     * Write content to a file
     */
    async write(path: string, content: string | Uint8Array): Promise<void> {
        await this.connect();
        if (!this.rootHandle) throw new Error('OPFS_NOT_READY');

        const parts = path.split('/').filter(p => p.length > 0);
        const fileName = parts.pop();

        if (!fileName) throw new Error('INVALID_PATH');

        // Traverse to parent dir
        let currentDir = this.rootHandle;
        for (const part of parts) {
            currentDir = await currentDir.getDirectoryHandle(part, { create: true });
        }

        // Get file handle
        const fileHandle = await currentDir.getFileHandle(fileName, { create: true });

        // Write
        // @ts-ignore - TS might optionally need types for createWritable depending on env
        const writable = await fileHandle.createWritable();
        await writable.write(content as any);
        await writable.close();
    }

    /**
     * Read content from a file
     */
    async read(path: string): Promise<string> {
        await this.connect();
        if (!this.rootHandle) throw new Error('OPFS_NOT_READY');

        const parts = path.split('/').filter(p => p.length > 0);
        const fileName = parts.pop();

        if (!fileName) throw new Error('INVALID_PATH');

        // Traverse
        let currentDir = this.rootHandle;
        for (const part of parts) {
            try {
                currentDir = await currentDir.getDirectoryHandle(part, { create: false });
            } catch {
                throw new Error('FILE_NOT_FOUND');
            }
        }

        // Get file
        try {
            const fileHandle = await currentDir.getFileHandle(fileName, { create: false });
            const file = await fileHandle.getFile();
            return await file.text();
        } catch {
            throw new Error('FILE_NOT_FOUND');
        }
    }

    /**
     * Delete a file
     */
    async delete(path: string): Promise<void> {
        await this.connect();
        if (!this.rootHandle) throw new Error('OPFS_NOT_READY');

        const parts = path.split('/').filter(p => p.length > 0);
        const fileName = parts.pop();

        if (!fileName) throw new Error('INVALID_PATH');

        // Traverse
        let currentDir = this.rootHandle;
        for (const part of parts) {
            currentDir = await currentDir.getDirectoryHandle(part, { create: false });
        }

        await currentDir.removeEntry(fileName);
    }
}

export const opfsBackend = new OPFSBackend();
