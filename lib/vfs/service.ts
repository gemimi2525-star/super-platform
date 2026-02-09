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

// ═══════════════════════════════════════════════════════════════════════════
// PRODUCTION SAFEGUARD
// Phase 15A: VFS is strictly opt-in via Feature Flag until Phase 16
// ═══════════════════════════════════════════════════════════════════════════
const VFS_ENABLED = process.env.NEXT_PUBLIC_FEATURE_VFS === 'true';

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

    // 1. Feature Flag Hard Gate
    if (!VFS_ENABLED) {
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

        const driver = getDriver();
        return await driver.write(path, data);
    }

    /**
     * Create a directory
     */
    async mkdir(rawPath: string, context: { userId: string; appId: string }): Promise<VFSMetadata> {
        const path = VFSPath.normalize(rawPath);
        await governanceCheck('fs.mkdir', path, context);

        const driver = getDriver();
        return await driver.mkdir(path);
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
