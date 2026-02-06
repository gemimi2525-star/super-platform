
import { IFileSystem, FileSystemAdapter, DirEntry, WriteOptions, FileStat, FileHandle, FileSystemError, FsError, FsSystemState } from './types';
import { OPFSAdapter } from './adapters/OPFSAdapter';
import { MemoryFileSystemAdapter } from './adapters/MemoryAdapter';
import { ReadOnlyAdapter } from './adapters/ReadOnlyAdapter';

/**
 * Handle Information for tracking open file handles
 */
interface HandleInfo {
    id: string;
    path: string;
    mode: 'r' | 'w';
    openedAt: number;
}

/**
 * The Kernel-Level File System Service.
 * This should be the ONLY way to access file storage.
 * Direct usage of Adapters is forbidden by Architecture Guard.
 * 
 * Phase 15A.3: Enhanced with systemState + handle management
 */
export class FileSystemService implements IFileSystem {
    private adapters: Map<string, FileSystemAdapter> = new Map();

    // Phase 15A.3: Kernel State
    private systemState: FsSystemState = 'ACTIVE';
    private openHandles: Map<string, HandleInfo> = new Map();

    constructor() {
        // Architecture Guard: Mount Default Schemes
        this.mount('user', new OPFSAdapter());
        this.mount('temp', new MemoryFileSystemAdapter());
        this.mount('system', new ReadOnlyAdapter());
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // State Management (Phase 15A.3)
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Get current system state
     */
    getSystemState(): FsSystemState {
        return this.systemState;
    }

    /**
     * Check if filesystem is locked - throws if locked
     */
    private checkState(): void {
        if (this.systemState === 'LOCKED') {
            throw new FsError(FileSystemError.authRequired, 'Filesystem is locked. Authentication required.');
        }
    }

    /**
     * Get current open handle count
     */
    getOpenHandleCount(): number {
        return this.openHandles.size;
    }

    /**
     * Close all open handles
     * @returns Number of handles closed
     */
    closeAllHandles(): number {
        const count = this.openHandles.size;
        this.openHandles.clear();
        return count;
    }

    /**
     * Lock the filesystem (for logout)
     */
    lock(): number {
        const closedHandles = this.closeAllHandles();
        this.systemState = 'LOCKED';
        console.log(`[FileSystemService] LOCKED. Closed ${closedHandles} handles.`);
        return closedHandles;
    }

    /**
     * Unlock the filesystem (for re-authentication)
     */
    unlock(): void {
        this.systemState = 'ACTIVE';
        console.log('[FileSystemService] UNLOCKED.');
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Scheme Management
    // ═══════════════════════════════════════════════════════════════════════════

    mount(scheme: string, adapter: FileSystemAdapter): void {
        this.adapters.set(scheme, adapter);
    }

    /**
     * Resolves the correct adapter for a given path.
     * Enforces strict scheme Usage (user://, temp://, system://)
     */
    private getAdapter(path: string): FileSystemAdapter {
        const match = path.match(/^([a-z]+):\/\//);
        if (!match) {
            throw new FsError(FileSystemError.invalidPath, `Invalid path format: ${path}. Must start with scheme:// (e.g. user://)`);
        }
        const scheme = match[1];

        const adapter = this.adapters.get(scheme);
        if (!adapter) {
            throw new FsError(FileSystemError.unknownScheme, `Unknown FileSystem Scheme: ${scheme}`);
        }
        return adapter;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // IFileSystem Implementation (with state check)
    // ═══════════════════════════════════════════════════════════════════════════

    async writeFile(path: string, content: Blob | string, options?: WriteOptions): Promise<void> {
        this.checkState();
        return this.getAdapter(path).writeFile(path, content, options);
    }

    async readFile(path: string): Promise<Blob> {
        this.checkState();
        return this.getAdapter(path).readFile(path);
    }

    async deleteFile(path: string): Promise<void> {
        this.checkState();
        return this.getAdapter(path).deleteFile(path);
    }

    async listDir(path: string): Promise<DirEntry[]> {
        this.checkState();
        return this.getAdapter(path).listDir(path);
    }

    async createDir(path: string): Promise<void> {
        this.checkState();
        throw new Error("Method not implemented.");
    }

    async move(source: string, dest: string): Promise<void> {
        this.checkState();
        throw new Error("Method not implemented.");
    }

    async copy(source: string, dest: string): Promise<void> {
        this.checkState();
        throw new Error("Method not implemented.");
    }

    async stat(path: string): Promise<FileStat> {
        this.checkState();
        throw new Error("Method not implemented.");
    }

    async exists(path: string): Promise<boolean> {
        this.checkState();
        return this.getAdapter(path).exists(path);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Handle Management (Phase 15A.3)
    // ═══════════════════════════════════════════════════════════════════════════

    async openHandle(path: string, mode: 'r' | 'w'): Promise<FileHandle> {
        this.checkState();

        const id = `handle-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const handle: HandleInfo = {
            id,
            path,
            mode,
            openedAt: Date.now(),
        };

        this.openHandles.set(id, handle);

        return {
            id,
            path,
            mode,
            pid: 'kernel',
        };
    }

    async closeHandle(handleId: string): Promise<void> {
        if (!this.openHandles.has(handleId)) {
            throw new FsError(FileSystemError.notFound, `Handle not found: ${handleId}`);
        }
        this.openHandles.delete(handleId);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Security Lifecycle (Phase 15A.3)
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Execute logout policy
     * @param mode - 'CLEAR' wipes data, 'SOFT_LOCK' just locks
     * @returns Result with handle counts and wiped schemes
     */
    async logoutPolicy(mode: 'CLEAR' | 'SOFT_LOCK'): Promise<{
        openHandlesBefore: number;
        openHandlesAfter: number;
        wipedSchemes: string[];
    }> {
        console.log(`[Security] Executing Logout Policy: ${mode}`);

        const openHandlesBefore = this.openHandles.size;
        const wipedSchemes: string[] = [];

        // Close all handles first
        this.closeAllHandles();

        if (mode === 'CLEAR') {
            // Wipe user://
            const userAdapter = this.adapters.get('user');
            if (userAdapter?.wipe) {
                await userAdapter.wipe();
                wipedSchemes.push('user');
                console.log('[Security] user:// wiped.');
            }

            // Wipe temp://
            const tempAdapter = this.adapters.get('temp');
            if (tempAdapter?.wipe) {
                await tempAdapter.wipe();
                wipedSchemes.push('temp');
                console.log('[Security] temp:// wiped.');
            }
        }

        // Lock the filesystem
        this.systemState = 'LOCKED';
        console.log('[Security] Filesystem LOCKED.');

        return {
            openHandlesBefore,
            openHandlesAfter: 0,
            wipedSchemes,
        };
    }

    async lockAll(): Promise<void> {
        await this.logoutPolicy('SOFT_LOCK');
    }

    async clearCache(): Promise<void> {
        await this.logoutPolicy('CLEAR');
    }
}
