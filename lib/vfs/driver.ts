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

import { VFSDriver, VFSMetadata, VFSError } from './types';

export abstract class BaseVFSDriver implements VFSDriver {
    abstract name: string;

    abstract isAvailable(): Promise<boolean>;

    async list(path: string): Promise<VFSMetadata[]> {
        throw new Error('Method not implemented.');
    }

    async stat(path: string): Promise<VFSMetadata | null> {
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

    async rename(path: string, newName: string): Promise<VFSMetadata> {
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
}

/**
 * Driver Factory
 */
export const getDriver = (): VFSDriver => {
    // In M2, we will detect OPFS and return OPFSDriver
    return new MockVFSDriver();
};
