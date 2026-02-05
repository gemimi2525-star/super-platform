
import { IFileSystem, FileSystemAdapter, DirEntry, WriteOptions, FileStat, FileHandle } from './types';
import { OPFSAdapter } from './adapters/OPFSAdapter';
import { MemoryFileSystemAdapter } from './adapters/MemoryAdapter';
import { ReadOnlyAdapter } from './adapters/ReadOnlyAdapter';

/**
 * The Kernel-Level File System Service.
 * This should be the ONLY way to access file storage.
 * Direct usage of Adapters is forbidden by Architecture Guard.
 */
export class FileSystemService implements IFileSystem {
    private adapters: Map<string, FileSystemAdapter> = new Map();
    private openHandles: Map<string, any> = new Map(); // For concurrency in future

    constructor() {
        // Architecture Guard: Mount Default Schemes
        this.mount('user', new OPFSAdapter());
        this.mount('temp', new MemoryFileSystemAdapter());
        this.mount('system', new ReadOnlyAdapter());
    }

    mount(scheme: string, adapter: FileSystemAdapter): void {
        this.adapters.set(scheme, adapter);
    }

    /**
     * Resolves the correct adapter for a given path.
     * Enforces strict scheme Usage (user://, temp://, system://)
     */
    private getAdapter(path: string): FileSystemAdapter {
        // Extract scheme "scheme://..."
        const match = path.match(/^([a-z]+):\/\//);
        if (!match) {
            throw new Error(`Invalid path format: ${path}. Must start with scheme:// (e.g. user://)`);
        }
        const scheme = match[1];

        const adapter = this.adapters.get(scheme);
        if (!adapter) {
            throw new Error(`Unknown FileSystem Scheme: ${scheme}`);
        }
        return adapter;
    }

    // --- IFileSystem Implementation ---

    async writeFile(path: string, content: Blob | string, options?: WriteOptions): Promise<void> {
        // TODO: Enforce Intent/Policy check if called directly? 
        // Ideally, this service is only called BY the Intent Handler.
        return this.getAdapter(path).writeFile(path, content, options);
    }

    async readFile(path: string): Promise<Blob> {
        return this.getAdapter(path).readFile(path);
    }

    async deleteFile(path: string): Promise<void> {
        return this.getAdapter(path).deleteFile(path);
    }

    async listDir(path: string): Promise<DirEntry[]> {
        return this.getAdapter(path).listDir(path);
    }

    async createDir(path: string): Promise<void> {
        // TODO: Implement in adapters
        throw new Error("Method not implemented.");
    }

    async move(source: string, dest: string): Promise<void> {
        // TODO: Implement cross-adapter move?
        throw new Error("Method not implemented.");
    }

    async copy(source: string, dest: string): Promise<void> {
        throw new Error("Method not implemented.");
    }

    async stat(path: string): Promise<FileStat> {
        throw new Error("Method not implemented.");
    }

    async exists(path: string): Promise<boolean> {
        return this.getAdapter(path).exists(path);
    }

    // --- Handle Management (Phase 15A.3) ---
    async openHandle(path: string, mode: 'r' | 'w'): Promise<FileHandle> {
        throw new Error("Method not implemented.");
    }

    async closeHandle(handleId: string): Promise<void> {
        throw new Error("Method not implemented.");
    }

    // --- Security Lifecycle ---

    async logoutPolicy(mode: 'CLEAR' | 'SOFT_LOCK'): Promise<void> {
        console.log(`[Security] Executing Logout Policy: ${mode}`);

        if (mode === 'CLEAR') {
            const userAdapter = this.adapters.get('user');
            if (userAdapter && userAdapter.wipe) {
                await userAdapter.wipe();
                console.log('[Security] user:// wiped.');
            }
        } else {
            // SOFT_LOCK: Just invalidate handles? 
            // Logic Pending Phase 15A.4
        }

        // Always clear temp
        const tempAdapter = this.adapters.get('temp');
        if (tempAdapter && tempAdapter.wipe) {
            await tempAdapter.wipe();
        }
    }

    async lockAll(): Promise<void> {
        return this.logoutPolicy('SOFT_LOCK');
    }

    async clearCache(): Promise<void> {
        return this.logoutPolicy('CLEAR');
    }
}
