/**
 * ═══════════════════════════════════════════════════════════════════════════
 * OPFS DRIVER (Phase 15A M2)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Implements IVFSDriver using the Origin Private File System (OPFS).
 * Provides low-latency, local-first storage for the VFS.
 * 
 * @module lib/vfs/drivers/opfs
 */

import { IVFSDriver, VFSMetadata, VFSNodeType, VFSError, VFSScheme } from '../types';
import { VFSPath } from '../path';

export class OPFSDriver implements IVFSDriver {
    name = 'OPFS';

    async isAvailable(): Promise<boolean> {
        return typeof navigator !== 'undefined' &&
            !!navigator.storage &&
            !!navigator.storage.getDirectory;
    }

    private async getRoot(): Promise<FileSystemDirectoryHandle> {
        if (!await this.isAvailable()) {
            throw new VFSError('STORAGE_ERROR', 'OPFS is not available in this environment');
        }
        return await navigator.storage.getDirectory();
    }

    private async getHandle(path: string, create = false): Promise<FileSystemFileHandle | FileSystemDirectoryHandle> {
        const { segments } = VFSPath.parse(path);
        let current = await this.getRoot();

        // Navigate to the parent of the target
        for (let i = 0; i < segments.length - 1; i++) {
            const segment = segments[i];
            try {
                current = await current.getDirectoryHandle(segment, { create });
            } catch (e) {
                throw new VFSError('NOT_FOUND', `Directory not found: ${segment}`);
            }
        }

        // Get the final target
        const lastSegment = segments[segments.length - 1];
        if (!lastSegment) return current; // Root

        // Try file first, then directory
        try {
            return await current.getFileHandle(lastSegment, { create });
        } catch (e) {
            try {
                return await current.getDirectoryHandle(lastSegment, { create });
            } catch (e2) {
                throw new VFSError('NOT_FOUND', `Path not found: ${path}`);
            }
        }
    }

    async stat(path: string): Promise<VFSMetadata> {
        const handle = await this.getHandle(path);
        const { scheme, segments } = VFSPath.parse(path);
        const name = segments[segments.length - 1] || 'root';

        const type: VFSNodeType = handle.kind === 'directory' ? 'directory' : 'file';
        let size = 0;
        let updatedAt = Date.now(); // OPFS handles don't give easy metadata without file access

        if (handle.kind === 'file') {
            const file = await (handle as FileSystemFileHandle).getFile();
            size = file.size;
            updatedAt = file.lastModified;
        }

        return {
            id: path, // Use path as ID for simplicity in M2
            parentId: VFSPath.dirname(path),
            name,
            type,
            size,
            path,
            createdAt: updatedAt,
            updatedAt,
            permissions: {
                read: true,
                write: true,
                execute: false,
                owner: 'user',
                group: 'staff'
            }
        };
    }

    async list(path: string): Promise<VFSMetadata[]> {
        const handle = await this.getHandle(path);
        if (handle.kind !== 'directory') {
            throw new VFSError('INVALID_OP', 'Not a directory');
        }

        const dirHandle = handle as FileSystemDirectoryHandle;
        const results: VFSMetadata[] = [];

        // @ts-ignore - TS doesn't fully know async iterator for handles yet in all envs
        for await (const [name, entry] of dirHandle.entries()) {
            const entryPath = VFSPath.join(path, name);
            // We do a lightweight stat here (mocking some details for speed)
            results.push({
                id: entryPath,
                parentId: path,
                name,
                type: entry.kind === 'directory' ? 'directory' : 'file',
                size: 0, // Deep stat needed for size
                path: entryPath,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                permissions: { read: true, write: true, execute: false, owner: 'user', group: 'staff' }
            });
        }

        return results;
    }

    async read(path: string): Promise<ArrayBuffer> {
        const handle = await this.getHandle(path);
        if (handle.kind !== 'file') {
            throw new VFSError('INVALID_OP', 'Not a file');
        }
        const file = await (handle as FileSystemFileHandle).getFile();
        return await file.arrayBuffer();
    }

    async write(path: string, data: ArrayBuffer | string): Promise<VFSMetadata> {
        const { segments } = VFSPath.parse(path);
        const fileName = segments[segments.length - 1];
        const dirPath = VFSPath.dirname(path);

        // Ensure parent exists
        // NOTE: In a real implementation we might need recursive mkdir. 
        // For M2 we assume flat or existing structure for simplicity, or we rely on getHandle's create loop if we implemented it recursively.
        // Let's implement robust getParentHandle for write.

        let current = await this.getRoot();
        for (let i = 0; i < segments.length - 1; i++) {
            current = await current.getDirectoryHandle(segments[i], { create: true });
        }

        const fileHandle = await current.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();

        await writable.write(data);
        await writable.close();

        return this.stat(path);
    }

    async mkdir(path: string): Promise<VFSMetadata> {
        const { segments } = VFSPath.parse(path);
        let current = await this.getRoot();

        // Recursive create
        for (const segment of segments) {
            current = await current.getDirectoryHandle(segment, { create: true });
        }

        return this.stat(path);
    }

    async delete(path: string): Promise<void> {
        const { segments } = VFSPath.parse(path);
        const name = segments[segments.length - 1];
        const dirPath = VFSPath.dirname(path);

        // Get parent
        // TODO: Reuse a getDirHandle helper
        let current = await this.getRoot();
        for (let i = 0; i < segments.length - 1; i++) {
            try {
                current = await current.getDirectoryHandle(segments[i]);
            } catch (e) { throw new VFSError('NOT_FOUND', 'Parent directory not found'); }
        }

        await current.removeEntry(name);
    }

    async rename(oldPath: string, newPath: string): Promise<VFSMetadata> {
        // OPFS rename is tricky (move), requires reading and writing to new location usually before move() method availability
        // For M2, we skip rename or implement copy+delete
        throw new VFSError('NOT_SUPPORTED', 'Rename not yet supported in OPFS M2');
    }

    async move(srcPath: string, dstPath: string): Promise<VFSMetadata> {
        throw new VFSError('NOT_SUPPORTED', 'Move not yet supported in OPFS M2');
    }
}
