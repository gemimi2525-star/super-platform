
import { FileSystemAdapter, WriteOptions, DirEntry } from '../types';

/**
 * @internal This class should not be used directly. Use FileSystemService.
 */
export class OPFSAdapter implements FileSystemAdapter {
    id = 'opfs';
    scheme: 'user' = 'user';
    private rootHandle: FileSystemDirectoryHandle | null = null;

    constructor() { }

    private async getRoot(): Promise<FileSystemDirectoryHandle> {
        if (!this.rootHandle) {
            this.rootHandle = await navigator.storage.getDirectory();
        }
        return this.rootHandle;
    }

    // Helper to traverse path and get handle
    private async getHandle(path: string, create: boolean = false): Promise<FileSystemFileHandle | FileSystemDirectoryHandle | undefined> {
        if (!path.startsWith('user://')) {
            throw new Error(`Invalid path for OPFSAdapter: ${path}`);
        }
        const cleanPath = path.replace('user://', '');
        const parts = cleanPath.split('/').filter(p => p.length > 0);

        let current: FileSystemDirectoryHandle = await this.getRoot();

        // Traverse directories
        for (let i = 0; i < parts.length - 1; i++) {
            try {
                current = await current.getDirectoryHandle(parts[i], { create });
            } catch (e) {
                return undefined;
            }
        }

        const fileName = parts[parts.length - 1];
        if (!fileName) return current; // Root

        try {
            return await current.getFileHandle(fileName, { create });
        } catch (e) {
            try {
                return await current.getDirectoryHandle(fileName, { create });
            } catch (e2) {
                return undefined;
            }
        }
    }

    async writeFile(path: string, content: Blob | string, options?: WriteOptions): Promise<void> {
        const root = await this.getRoot();
        const cleanPath = path.replace('user://', '');
        const parts = cleanPath.split('/').filter(p => p.length > 0);
        const fileName = parts.pop()!;

        let current = root;
        // Create directories if needed
        for (const part of parts) {
            current = await current.getDirectoryHandle(part, { create: true });
        }

        const fileHandle = await current.getFileHandle(fileName, { create: true });
        // @ts-ignore - createWritable exists on FileSystemFileHandle in OPFS
        const writable = await fileHandle.createWritable();
        await writable.write(content);
        await writable.close();
    }

    async readFile(path: string): Promise<Blob> {
        const handle = await this.getHandle(path);
        if (!handle || handle.kind !== 'file') {
            throw new Error(`File not found: ${path}`);
        }
        const file = await (handle as FileSystemFileHandle).getFile();
        return file;
    }

    async deleteFile(path: string): Promise<void> {
        const cleanPath = path.replace('user://', '');
        const parts = cleanPath.split('/').filter(p => p.length > 0);
        const fileName = parts.pop()!;

        let current = await this.getRoot();
        for (const part of parts) {
            current = await current.getDirectoryHandle(part);
        }

        await current.removeEntry(fileName);
    }

    async listDir(path: string): Promise<DirEntry[]> {
        let current: FileSystemDirectoryHandle;
        try {
            const handle = await this.getHandle(path);
            if (handle && handle.kind === 'directory') {
                current = handle as FileSystemDirectoryHandle;
            } else {
                // Try root if path is just user://
                if (path === 'user://' || path === 'user:/') {
                    current = await this.getRoot();
                } else {
                    throw new Error('Not a directory');
                }
            }
        } catch (e) {
            throw new Error(`Path not found: ${path}`);
        }

        const entries: DirEntry[] = [];
        // @ts-ignore
        for await (const entry of current.values()) {
            entries.push({
                name: entry.name,
                kind: entry.kind,
                path: `${path.endsWith('/') ? path : path + '/'}${entry.name}`,
            });
        }
        return entries;
    }


    async exists(path: string): Promise<boolean> {
        const handle = await this.getHandle(path);
        return !!handle;
    }

    async wipe(): Promise<void> {
        const root = await this.getRoot();
        // @ts-ignore
        for await (const entry of root.values()) {
            await root.removeEntry(entry.name, { recursive: true });
        }
    }
}
