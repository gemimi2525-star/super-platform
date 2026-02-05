
// Phase 15A: OS-Grade Virtual Filesystem Types

export type FilePath = string; // e.g., "user://documents/report.pdf", "system://logs/kernel.log"
export type FileSchema = 'user' | 'temp' | 'system';

export enum FileSystemError {
    accessDenied = 'FS_ACCESS_DENIED',
    notFound = 'FS_NOT_FOUND',
    invalidPath = 'FS_INVALID_PATH',
    unknownScheme = 'FS_UNKNOWN_SCHEME',
    locked = 'FS_LOCKED_BY_OTHER_PROCESS',
    authRequired = 'FS_AUTH_REQUIRED',
    systemLocked = 'FS_SYSTEM_LOCKED',
    wipeFailed = 'FS_WIPE_FAILED'
}

export class FsError extends Error {
    constructor(public code: FileSystemError, message?: string) {
        super(message || code);
        this.name = 'FsError';
    }
}

export type FileCapability =
    | 'fs.read'
    | 'fs.write'
    | 'fs.delete'
    | 'fs.list'
    | 'fs.shareHandle'
    | 'fs.mkdir'
    | 'fs.stat'
    | 'fs.rename'
    | 'fs.move'
    | 'fs.copy'
    | 'fs.openHandle'
    | 'fs.closeHandle';

export interface WriteOptions {
    create?: boolean;
    overwrite?: boolean;
    mimeType?: string;
}

export interface FileStat {
    size: number;
    lastModified: number;
    created: number;
    kind: 'file' | 'directory';
}

export interface FileHandle {
    id: string; // UUID
    path: string;
    mode: 'r' | 'w';
    pid: string; // Ownership
}

export interface DirEntry {
    name: string;
    kind: 'file' | 'directory';
    path: string;
    size?: number;
    lastModified?: number;
}

// Low-level Adapter Interface (Kernel Abstraction)
export interface FileSystemAdapter {
    id: string; // 'opfs', 'memory', etc.
    scheme: 'user' | 'system' | 'temp';

    writeFile(path: string, content: Blob | string, options?: WriteOptions): Promise<void>;
    readFile(path: string): Promise<Blob>;
    deleteFile(path: string): Promise<void>;
    listDir(path: string): Promise<DirEntry[]>;
    exists(path: string): Promise<boolean>;
    wipe?(): Promise<void>; // Security v0: Clear all data
}

// High-level OS Service Interface
export interface IFileSystem {
    // Basic CRUD
    writeFile(path: string, content: Blob | string, options?: WriteOptions): Promise<void>;
    readFile(path: string): Promise<Blob>;
    deleteFile(path: string): Promise<void>;
    listDir(path: string): Promise<DirEntry[]>;
    createDir(path: string): Promise<void>;
    move(source: string, dest: string): Promise<void>;
    copy(source: string, dest: string): Promise<void>;
    stat(path: string): Promise<FileStat>;
    exists(path: string): Promise<boolean>;

    // Handle Management (Phase 15A.3)
    openHandle(path: string, mode: 'r' | 'w'): Promise<FileHandle>;
    closeHandle(handleId: string): Promise<void>;

    // Internal OS Operations
    mount(scheme: string, adapter: FileSystemAdapter): void;
    logoutPolicy(mode: 'CLEAR' | 'SOFT_LOCK'): Promise<void>;
}

// Audit Payload Structure for FS
export interface FSOperationPayload {
    capability: FileCapability;
    path: FilePath;
    fileSize?: number;
    mimeType?: string;
    checksum?: string; // SHA-256 for integrity check
    scheme?: string;
}
