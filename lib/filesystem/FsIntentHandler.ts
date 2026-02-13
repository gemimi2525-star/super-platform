/**
 * Filesystem Intent Handler
 * 
 * Phase 15A.2: Intent-only Enforcement
 * 
 * This is the SINGLE ENTRY POINT for all filesystem operations.
 * UI/App layer MUST use this handler instead of calling FileSystemService directly.
 */

import { IFileSystem, FileCapability, FileSystemError, FsError, WriteOptions } from './types';
import type { FsIntentMeta } from '../platform/types/intent-events';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export type FsIntentAction =
    | 'os.fs.read'
    | 'os.fs.write'
    | 'os.fs.delete'
    | 'os.fs.list'
    | 'os.fs.mkdir'
    | 'os.fs.stat'
    | 'os.fs.rename'
    | 'os.fs.move'
    | 'os.fs.copy'
    | 'os.fs.openHandle'
    | 'os.fs.closeHandle'
    | 'os.fs.shareHandle';

export interface FsIntent {
    action: FsIntentAction;
    meta: FsIntentMeta;
    content?: Blob | string;  // For write operations
    options?: WriteOptions;
}

export interface FsDecision {
    outcome: 'ALLOW' | 'DENY';
    errorCode?: FileSystemError;
    reason?: string;
}

export interface FsResult {
    success: boolean;
    data?: any;  // Read result, list result, etc.
    errorCode?: FileSystemError;
    traceId: string;
}

export interface FsAuditEntry {
    action: FsIntentAction;
    capability: FileCapability;
    path: string;
    scheme: string;
    decision: 'ALLOW' | 'DENY';
    result?: 'SUCCESS' | 'FAILED';
    traceId: string;
    errorCode?: string;
    fileSize?: number;
    timestamp: Date;
}

// ═══════════════════════════════════════════════════════════════════════════
// Utility
// ═══════════════════════════════════════════════════════════════════════════

function generateTraceId(): string {
    return `FS-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

function actionToCapability(action: FsIntentAction): FileCapability {
    const map: Record<FsIntentAction, FileCapability> = {
        'os.fs.read': 'fs.read',
        'os.fs.write': 'fs.write',
        'os.fs.delete': 'fs.delete',
        'os.fs.list': 'fs.list',
        'os.fs.mkdir': 'fs.mkdir',
        'os.fs.stat': 'fs.stat',
        'os.fs.rename': 'fs.rename',
        'os.fs.move': 'fs.move',
        'os.fs.copy': 'fs.copy',
        'os.fs.openHandle': 'fs.openHandle',
        'os.fs.closeHandle': 'fs.closeHandle',
        'os.fs.shareHandle': 'fs.shareHandle',
    };
    return map[action];
}

function extractScheme(path: string): 'user' | 'temp' | 'system' | null {
    const match = path.match(/^(user|temp|system):\/\//);
    return match ? (match[1] as 'user' | 'temp' | 'system') : null;
}

// ═══════════════════════════════════════════════════════════════════════════
// Policy v0
// ═══════════════════════════════════════════════════════════════════════════

const WRITE_CAPABILITIES: FileCapability[] = ['fs.write', 'fs.delete', 'fs.move', 'fs.copy', 'fs.rename', 'fs.mkdir'];

function evaluateFsPolicy(intent: FsIntent): FsDecision {
    const capability = actionToCapability(intent.action);
    const scheme = intent.meta.scheme;

    // Policy Rule 1: system:// is read-only
    if (scheme === 'system' && WRITE_CAPABILITIES.includes(capability)) {
        return {
            outcome: 'DENY',
            errorCode: FileSystemError.accessDenied,
            reason: `Write operations forbidden on system:// scheme`,
        };
    }

    // Policy Rule 2: Quota guard (soft limit 50MB per file)
    if (intent.meta.fileSize && intent.meta.fileSize > 50 * 1024 * 1024) {
        return {
            outcome: 'DENY',
            errorCode: FileSystemError.accessDenied,
            reason: `File size exceeds 50MB limit`,
        };
    }

    // Default: ALLOW
    return { outcome: 'ALLOW' };
}

// ═══════════════════════════════════════════════════════════════════════════
// Handler Class
// ═══════════════════════════════════════════════════════════════════════════

export class FsIntentHandler {
    private auditLog: FsAuditEntry[] = [];  // In-memory for now, can be sent to API

    constructor(private fs: IFileSystem) { }

    /**
     * Execute a filesystem intent with policy evaluation and audit logging
     */
    async execute(intent: FsIntent): Promise<FsResult> {
        const traceId = generateTraceId();
        const capability = actionToCapability(intent.action);

        // 1. Evaluate Policy
        const decision = evaluateFsPolicy(intent);

        // 2. Log Intent (Pre-execution)
        const auditEntry: FsAuditEntry = {
            action: intent.action,
            capability,
            path: intent.meta.path,
            scheme: intent.meta.scheme,
            decision: decision.outcome,
            traceId,
            fileSize: intent.meta.fileSize,
            timestamp: new Date(),
        };

        // 3. If DENIED, return immediately
        if (decision.outcome === 'DENY') {
            auditEntry.result = 'FAILED';
            auditEntry.errorCode = decision.errorCode;
            this.auditLog.push(auditEntry);

            return {
                success: false,
                errorCode: decision.errorCode,
                traceId,
            };
        }

        // 4. Execute Operation
        try {
            const data = await this.executeOp(intent);
            auditEntry.result = 'SUCCESS';
            this.auditLog.push(auditEntry);

            return { success: true, data, traceId };
        } catch (e: any) {
            auditEntry.result = 'FAILED';
            auditEntry.errorCode = (e as FsError).code || FileSystemError.accessDenied;
            this.auditLog.push(auditEntry);

            return {
                success: false,
                errorCode: (e as FsError).code || FileSystemError.accessDenied,
                traceId,
            };
        }
    }

    /**
     * Get audit log (for verification and debugging)
     */
    getAuditLog(): FsAuditEntry[] {
        return [...this.auditLog];
    }

    /**
     * Get last audit entry (for immediate verification)
     */
    getLastAuditEntry(): FsAuditEntry | undefined {
        return this.auditLog[this.auditLog.length - 1];
    }

    /**
     * Clear audit log
     */
    clearAuditLog(): void {
        this.auditLog = [];
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Private: Operation Dispatch
    // ═══════════════════════════════════════════════════════════════════════

    private async executeOp(intent: FsIntent): Promise<any> {
        switch (intent.action) {
            case 'os.fs.read':
                return this.fs.readFile(intent.meta.path);

            case 'os.fs.write':
                if (!intent.content) throw new FsError(FileSystemError.invalidPath, 'No content provided');
                await this.fs.writeFile(intent.meta.path, intent.content, intent.options);
                return null;

            case 'os.fs.delete':
                await this.fs.deleteFile(intent.meta.path);
                return null;

            case 'os.fs.list':
                return this.fs.listDir(intent.meta.path);

            case 'os.fs.mkdir':
                await this.fs.createDir(intent.meta.path);
                return null;

            case 'os.fs.stat':
                return this.fs.stat(intent.meta.path);

            case 'os.fs.move':
                if (!intent.meta.destPath) throw new FsError(FileSystemError.invalidPath, 'No destPath provided');
                await this.fs.move(intent.meta.path, intent.meta.destPath);
                return null;

            case 'os.fs.copy':
                if (!intent.meta.destPath) throw new FsError(FileSystemError.invalidPath, 'No destPath provided');
                await this.fs.copy(intent.meta.path, intent.meta.destPath);
                return null;

            case 'os.fs.rename':
                if (!intent.meta.destPath) throw new FsError(FileSystemError.invalidPath, 'No destPath provided');
                await this.fs.move(intent.meta.path, intent.meta.destPath);
                return null;

            case 'os.fs.openHandle':
                return this.fs.openHandle(intent.meta.path, 'r');

            case 'os.fs.closeHandle':
                // Requires handle ID in meta (future extension)
                throw new FsError(FileSystemError.invalidPath, 'closeHandle requires handleId');

            case 'os.fs.shareHandle':
                throw new FsError(FileSystemError.accessDenied, 'shareHandle not implemented');

            default:
                throw new FsError(FileSystemError.invalidPath, `Unknown action: ${intent.action}`);
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// React Hook (Client-side convenience)
// ═══════════════════════════════════════════════════════════════════════════

import { useMemo } from 'react';
import { useFileSystem } from './FileSystemProvider';

export function useFsIntent(): FsIntentHandler {
    const fs = useFileSystem();
    return useMemo(() => new FsIntentHandler(fs), [fs]);
}
