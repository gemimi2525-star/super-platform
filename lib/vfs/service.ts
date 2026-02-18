/**
 * ═══════════════════════════════════════════════════════════════════════════
 * VFS SERVICE (Phase 15A — Milestone 3)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Central Service for Virtual Filesystem Operations.
 * Responsibilities:
 * 1. Path Normalization & Safety (via VFSPath)
 * 2. Driver Selection (via getDriver)
 * 3. Governance Enforcement (Feature Flag + Audit)
 * 4. Structured Audit Logging
 * 
 * @module lib/vfs/service
 */

import { VFSMetadata, VFSError, VFSAuditEvent } from './types';
import { VFSPath } from './path';
import { getDriver } from './driver';
import { checkUniqueSibling } from '@/coreos/vfs/constraints';

// ═══════════════════════════════════════════════════════════════════════════
// PRODUCTION SAFEGUARD
// Phase 15A: VFS is strictly opt-in via Feature Flag until Phase 16
// Phase 37B: Dev override for localhost testing only
// ═══════════════════════════════════════════════════════════════════════════
const VFS_ENABLED = process.env.NEXT_PUBLIC_FEATURE_VFS === 'true';

/**
 * Dev-only override: allows VFS operations on localhost for gate testing.
 * SAFETY: Only effective when hostname is localhost/127.0.0.1 AND
 *         sessionStorage flag 'DEV_VFS_OVERRIDE' is explicitly 'true'.
 * PRODUCTION: window.location.hostname is never localhost → always false.
 */
function isDevVFSOverride(): boolean {
    if (typeof window === 'undefined') return false;
    try {
        const host = window.location?.hostname;
        if (host !== 'localhost' && host !== '127.0.0.1') return false;
        return sessionStorage?.getItem('DEV_VFS_OVERRIDE') === 'true';
    } catch {
        return false;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// GOVERNANCE + AUDIT
// ═══════════════════════════════════════════════════════════════════════════

let requestCounter = 0;

function emitAudit(event: VFSAuditEvent): void {
    console.info('[VFS:Audit]', JSON.stringify(event));
}

/**
 * Governance Gate — enforces feature flag + audit logging.
 * NOT an allow-all: blocks when VFS is disabled.
 */
async function governanceCheck(
    intentType: string,
    path: string,
    context: { userId: string; appId: string }
): Promise<{ correlationId: string; requestId: string }> {
    const requestId = `req-${++requestCounter}-${Date.now()}`;
    const correlationId = `cid-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // 1. Feature Flag Hard Gate (Phase 37B: dev override for localhost)
    if (!VFS_ENABLED && !isDevVFSOverride()) {
        const audit: VFSAuditEvent = {
            requestId,
            correlationId,
            intent: intentType,
            path,
            userId: context.userId,
            appId: context.appId,
            decision: 'DENY',
            reason: 'VFS subsystem disabled (Feature Flag OFF)',
            timestamp: Date.now(),
        };
        emitAudit(audit);
        throw new VFSError('GOVERNANCE_BLOCK', 'VFS subsystem is currently disabled (Phase 15A Lock)');
    }

    // 2. system:// write protection (soft-block)
    const { scheme } = VFSPath.parse(path);
    if (scheme === 'system' && ['fs.write', 'fs.mkdir', 'fs.delete'].includes(intentType)) {
        const audit: VFSAuditEvent = {
            requestId,
            correlationId,
            intent: intentType,
            path,
            userId: context.userId,
            appId: context.appId,
            decision: 'DENY',
            reason: 'Write operations to system:// are forbidden',
            timestamp: Date.now(),
        };
        emitAudit(audit);
        throw new VFSError('PERMISSION_DENIED', 'Cannot write to system:// (read-only)');
    }

    // 3. ALLOW — audit the successful check
    const audit: VFSAuditEvent = {
        requestId,
        correlationId,
        intent: intentType,
        path,
        userId: context.userId,
        appId: context.appId,
        decision: 'ALLOW',
        timestamp: Date.now(),
    };
    emitAudit(audit);

    return { correlationId, requestId };
}

// ═══════════════════════════════════════════════════════════════════════════
// VFS SERVICE CLASS
// ═══════════════════════════════════════════════════════════════════════════

export class VFSService {

    /**
     * List files in a directory
     */
    async list(rawPath: string, context: { userId: string; appId: string }): Promise<VFSMetadata[]> {
        const path = VFSPath.normalize(rawPath);
        await governanceCheck('fs.list', path, context);

        const driver = getDriver();
        if (!await driver.isAvailable()) {
            throw new VFSError('STORAGE_ERROR', `Driver ${driver.name} is not available`);
        }

        return await driver.list(path);
    }

    /**
     * Stat a path (get metadata)
     */
    async stat(rawPath: string, context: { userId: string; appId: string }): Promise<VFSMetadata | null> {
        const path = VFSPath.normalize(rawPath);
        await governanceCheck('fs.stat', path, context);

        const driver = getDriver();
        return await driver.stat(path);
    }

    /**
     * Read file content
     */
    async read(rawPath: string, context: { userId: string; appId: string }): Promise<ArrayBuffer> {
        const path = VFSPath.normalize(rawPath);
        await governanceCheck('fs.read', path, context);

        const driver = getDriver();
        return await driver.read(path);
    }

    /**
     * Write file content
     */
    async write(rawPath: string, data: ArrayBuffer | string, context: { userId: string; appId: string }): Promise<VFSMetadata> {
        const path = VFSPath.normalize(rawPath);
        await governanceCheck('fs.write', path, context);

        // Phase 37: Kernel constraint — reject duplicate names
        const driver = getDriver();
        const parentPath = VFSPath.dirname(path);
        const fileName = VFSPath.basename(path);
        await checkUniqueSibling(parentPath, fileName, driver);

        return await driver.write(path, data);
    }

    /**
     * Create a directory
     */
    async mkdir(rawPath: string, context: { userId: string; appId: string }): Promise<VFSMetadata> {
        const path = VFSPath.normalize(rawPath);
        await governanceCheck('fs.mkdir', path, context);

        // Phase 37: Kernel constraint — reject duplicate names
        const driver = getDriver();
        const parentPath = VFSPath.dirname(path);
        const dirName = VFSPath.basename(path);
        await checkUniqueSibling(parentPath, dirName, driver);

        return await driver.mkdir(path);
    }

    /**
     * Rename a file or directory (same parent, new name)
     */
    async rename(rawPath: string, newName: string, context: { userId: string; appId: string }): Promise<VFSMetadata> {
        const path = VFSPath.normalize(rawPath);
        await governanceCheck('fs.rename', path, context);

        // Phase 37: Kernel constraint — reject duplicate names in same parent
        const driver = getDriver();
        const parentPath = VFSPath.dirname(path);
        await checkUniqueSibling(parentPath, newName, driver);

        return await driver.rename(path, newName);
    }

    /**
     * Move a file or directory to a new location
     */
    async move(srcPath: string, dstPath: string, context: { userId: string; appId: string }): Promise<VFSMetadata> {
        const src = VFSPath.normalize(srcPath);
        const dst = VFSPath.normalize(dstPath);
        await governanceCheck('fs.move', dst, context);

        // Phase 37: Kernel constraint — reject duplicate names at destination parent
        const driver = getDriver();
        const dstParent = VFSPath.dirname(dst);
        const dstName = VFSPath.basename(dst);
        await checkUniqueSibling(dstParent, dstName, driver);

        return await driver.move(src, dst);
    }

    /**
     * Delete a file or directory
     */
    async delete(rawPath: string, context: { userId: string; appId: string }): Promise<void> {
        const path = VFSPath.normalize(rawPath);
        await governanceCheck('fs.delete', path, context);

        const driver = getDriver();
        return await driver.delete(path);
    }
}

export const vfsService = new VFSService();
