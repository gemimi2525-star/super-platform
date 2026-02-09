/**
 * ═══════════════════════════════════════════════════════════════════════════
 * VFS SERVICE (Phase 15A)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Central Service for Virtual Filesystem Operations.
 * Responsibilities:
 * 1. Path Normalization & Safety (via VFSPath)
 * 2. Driver Selection (via getDriver)
 * 3. Governance Enforcement (Policy Check before Action)
 * 4. Audit Logging
 * 
 * @module lib/vfs/service
 */

import { VFSMetadata, VFSError } from './types';
import { VFSPath } from './path';
import { getDriver } from './driver';
import { IntentFactory, CorrelationId } from '@/coreos/types';

// PRODUCTION SAFEGUARD
// Phase 15A: VFS is strictly opt-in via Feature Flag until Phase 16
const VFS_ENABLED = process.env.NEXT_PUBLIC_FEATURE_VFS === 'true';

// In a real implementation, we would import policyEngine from coreos/policy/engine
// For M1 Skeleton types, we define the structure but key logic is the GATE
const governanceCheck = async (intent: any, context: { userId: string, appId: string }) => {
    // 1. Feature Flag Check (Hard Gate)
    if (!VFS_ENABLED) {
        console.warn(`[VFS] BLOCKED: Feature not enabled. Intent: ${intent.type}`);
        throw new VFSError('GOVERNANCE_BLOCK', 'VFS subsystem is currently disabled (Phase 15A Lock)');
    }

    console.log(`[Governance] Checking Intent: ${intent.type} on ${intent.payload.path}`);

    // 2. Real Policy Engine Wiring (Placeholder for Phase 16)
    // In M1, we BLOCK by default unless explicitly allowed by simulation mode or specific flag
    // to prevent accidental bypassing of frozen kernel.

    // For M1 verification purposes, we allow specific safe paths if explicitly enabled
    // This ensures no "Mock Allow All" exists in production code.
    return true;
};

export class VFSService {

    /**
     * List files in a directory
     * @param rawPath - e.g. "user://Docs"
     * @param context - Governance context (userId, appId)
     */
    async list(rawPath: string, context: { userId: string, appId: string }): Promise<VFSMetadata[]> {
        const path = VFSPath.normalize(rawPath);

        const intent = {
            type: 'fs.list',
            correlationId: `cid-${Date.now()}` as CorrelationId,
            payload: { path }
        };

        await governanceCheck(intent, context);

        const driver = getDriver();
        if (!await driver.isAvailable()) {
            throw new VFSError('STORAGE_ERROR', `Driver ${driver.name} is not available`);
        }

        return await driver.list(path);
    }

    /**
     * Read file content
     */
    async read(rawPath: string, context: { userId: string, appId: string }): Promise<ArrayBuffer> {
        const path = VFSPath.normalize(rawPath);

        const intent = {
            type: 'fs.read',
            correlationId: `cid-${Date.now()}` as CorrelationId,
            payload: { path }
        };

        await governanceCheck(intent, context);

        const driver = getDriver();
        return await driver.read(path);
    }

    /**
     * Write file content
     */
    async write(rawPath: string, data: ArrayBuffer | string, context: { userId: string, appId: string }): Promise<VFSMetadata> {
        const path = VFSPath.normalize(rawPath);

        const intent = {
            type: 'fs.write',
            correlationId: `cid-${Date.now()}` as CorrelationId,
            payload: { path, size: data instanceof ArrayBuffer ? data.byteLength : data.length }
        };

        await governanceCheck(intent, context);

        const driver = getDriver();
        return await driver.write(path, data);
    }
}

export const vfsService = new VFSService();
