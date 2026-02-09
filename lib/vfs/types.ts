/**
 * ═══════════════════════════════════════════════════════════════════════════
 * VFS TYPES (Phase 15A)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Core type definitions for the Virtual Filesystem.
 * Defines the Metadata Model and Driver Interfaces.
 * 
 * @module lib/vfs/types
 */

export type VFSScheme = 'system' | 'user' | 'workspace';

export type VFSNodeType = 'file' | 'folder';

export interface VFSMetadata {
    id: string;             // Stable UUID
    path: string;           // Canonical Path (e.g., user://Documents/Report.md)
    name: string;           // File name (e.g., Report.md)
    type: VFSNodeType;
    parentId: string | null;// Null for root of scheme
    size: number;           // Bytes
    createdAt: number;      // Timestamp
    updatedAt: number;      // Timestamp
    mimeType?: string;      // Optional for files
    hash?: string;          // Optional (SHA-256 for integrity)
    flags?: {
        trashed?: boolean;
        pinned?: boolean;
        locked?: boolean;
        hidden?: boolean;
    };
    workspaceId?: string;   // For workspace:// scheme
    tags?: string[];        // For governance/organization
}

export interface VFSStats extends VFSMetadata {
    // Extended stats if needed in future
}

export interface VFSDriver {
    name: string;
    isAvailable(): Promise<boolean>;

    // Core Operations
    list(path: string): Promise<VFSMetadata[]>;
    stat(path: string): Promise<VFSMetadata | null>;
    read(path: string): Promise<ArrayBuffer>;
    write(path: string, data: ArrayBuffer | string): Promise<VFSMetadata>;
    mkdir(path: string): Promise<VFSMetadata>;
    delete(path: string): Promise<void>; // Hard delete
    rename(path: string, newName: string): Promise<VFSMetadata>;
    move(srcPath: string, dstPath: string): Promise<VFSMetadata>;
}

export class VFSError extends Error {
    constructor(
        public code: 'NOT_FOUND' | 'ALREADY_EXISTS' | 'PERMISSION_DENIED' | 'INVALID_PATH' | 'STORAGE_ERROR' | 'GOVERNANCE_BLOCK',
        message: string
    ) {
        super(message);
        this.name = 'VFSError';
    }
}
