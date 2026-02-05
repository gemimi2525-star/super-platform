
import { FileSystemAdapter, WriteOptions, DirEntry } from '../types';

/**
 * @internal This class should not be used directly. Use FileSystemService.
 */
export class MemoryFileSystemAdapter implements FileSystemAdapter {
    id = 'memory';
    scheme: 'temp' = 'temp';
    private storage: Map<string, Blob | string> = new Map();

    async writeFile(path: string, content: Blob | string, options?: WriteOptions): Promise<void> {
        this.storage.set(path, content);
    }

    async readFile(path: string): Promise<Blob> {
        const content = this.storage.get(path);
        if (content === undefined) {
            throw new Error(`File not found: ${path}`);
        }
        if (content instanceof Blob) {
            return content;
        }
        return new Blob([content]);
    }

    async deleteFile(path: string): Promise<void> {
        this.storage.delete(path);
    }

    async listDir(path: string): Promise<DirEntry[]> {
        const entries: DirEntry[] = [];
        const cleanPath = path.replace('temp://', '');

        // Naive iteration
        for (const key of this.storage.keys()) {
            const cleanKey = key.replace('temp://', '');
            if (cleanKey.startsWith(cleanPath)) {
                // Check if direct child (simple logic)
                const relative = cleanKey.slice(cleanPath.length).replace(/^\//, '');
                if (!relative.includes('/')) {
                    entries.push({
                        name: relative,
                        kind: 'file',
                        path: key
                    });
                }
            }
        }
        return entries;
    }

    async exists(path: string): Promise<boolean> {
        return this.storage.has(path);
    }

    async wipe(): Promise<void> {
        this.storage.clear();
    }
}
