/**
 * ═══════════════════════════════════════════════════════════════════════════
 * VFS DRIVER BASE (Phase 15A)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Abstract base class for VFS drivers.
 * Drivers implement the low-level storage logic (OPFS/IDB).
 * 
 * @module lib/vfs/driver
 */

import { IVFSDriver, VFSMetadata, VFSError } from './types';
import { OPFSDriver } from './drivers/opfs';

export abstract class BaseVFSDriver implements IVFSDriver {
    abstract name: string;

    abstract isAvailable(): Promise<boolean>;

    async list(path: string): Promise<VFSMetadata[]> {
        throw new Error('Method not implemented.');
    }

    async stat(path: string): Promise<VFSMetadata> {
        throw new Error('Method not implemented.');
    }

    async read(path: string): Promise<ArrayBuffer> {
        throw new Error('Method not implemented.');
    }

    async write(path: string, data: ArrayBuffer | string): Promise<VFSMetadata> {
        throw new Error('Method not implemented.');
    }

    async mkdir(path: string): Promise<VFSMetadata> {
        throw new Error('Method not implemented.');
    }

    async delete(path: string): Promise<void> {
        throw new Error('Method not implemented.');
    }

    async rename(oldPath: string, newPath: string): Promise<VFSMetadata> {
        throw new Error('Method not implemented.');
    }

    async move(srcPath: string, dstPath: string): Promise<VFSMetadata> {
        throw new Error('Method not implemented.');
    }
}

/**
 * Mock Driver for Milestone 1 (Skeleton)
 */
export class MockVFSDriver extends BaseVFSDriver {
    name = 'MockDriver';

    async isAvailable(): Promise<boolean> {
        return true;
    }

    async list(path: string): Promise<VFSMetadata[]> {
        // Return empty list for root
        return [];
    }

    // Stub other methods for M1 completeness
    async stat(path: string): Promise<VFSMetadata> { throw new VFSError('NOT_FOUND', 'File not found'); }
    async read(path: string): Promise<ArrayBuffer> { return new ArrayBuffer(0); }
    async write(path: string, data: ArrayBuffer | string): Promise<VFSMetadata> { throw new VFSError('STORAGE_ERROR', 'Mock write'); }
    async mkdir(path: string): Promise<VFSMetadata> { throw new VFSError('STORAGE_ERROR', 'Mock mkdir'); }
    async delete(path: string): Promise<void> { }
    async rename(oldPath: string, newPath: string): Promise<VFSMetadata> { throw new VFSError('STORAGE_ERROR', 'Mock rename'); }
    async move(srcPath: string, dstPath: string): Promise<VFSMetadata> { throw new VFSError('STORAGE_ERROR', 'Mock move'); }
}

let instance: IVFSDriver | null = null;

/**
 * Driver Factory
 */
export const getDriver = (): IVFSDriver => {
    if (instance) return instance;

    // Phase 15A M2: Logic to select driver
    // Priority: OPFS > IndexedDB (Future) > Mock
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.getDirectory) {
        // We use a simplified check here, or instantiate and check isAvailable()
        // For M2, we default to OPFS if in browser
        console.log('[VFS] Initializing OPFS Driver');
        instance = new OPFSDriver();
    } else {
        console.log('[VFS] Fallback to Mock Driver (SSR or Unsupported)');
        instance = new MockVFSDriver();
    }

    return instance!;
};
