
import { FileSystemAdapter, WriteOptions, DirEntry } from '../types';
import { FileSystemError, FsError } from '../../types';

/**
 * @internal Adapter for system:// scheme.
 * Enforces Read-Only policy at the adapter level (Deep Guard).
 */
export class ReadOnlyAdapter implements FileSystemAdapter {
    id = 'system';
    scheme: 'system' = 'system';

    // In future, this could be backed by a JSON asset or API
    private staticAssets: Map<string, Blob> = new Map();

    constructor() {
        // Hydrate with some default system files if needed
        const logContent = new Blob(["System Booted"], { type: "text/plain" });
        this.staticAssets.set("system://logs/boot.log", logContent);
    }

    async writeFile(path: string, content: Blob | string, options?: WriteOptions): Promise<void> {
        throw new FsError(FileSystemError.accessDenied, `Write operation forbidden on read-only scheme: ${this.scheme}`);
    }

    async readFile(path: string): Promise<Blob> {
        const file = this.staticAssets.get(path);
        if (!file) {
            throw new FsError(FileSystemError.notFound, "File not found");
        }
        return file;
    }

    async deleteFile(path: string): Promise<void> {
        throw new FsError(FileSystemError.accessDenied, `Delete operation forbidden on read-only scheme: ${this.scheme}`);
    }

    async listDir(path: string): Promise<DirEntry[]> {
        // Mock implementation
        return Array.from(this.staticAssets.keys()).map(k => ({
            name: k.replace('system://', ''),
            kind: 'file',
            path: k
        }));
    }

    async exists(path: string): Promise<boolean> {
        return this.staticAssets.has(path);
    }

    async wipe(): Promise<void> {
        // Deterministic error, strictly no side effects
        throw new FsError(FileSystemError.accessDenied, 'Cannot wipe system scheme');
    }
}
