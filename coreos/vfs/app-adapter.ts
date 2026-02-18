/**
 * ═══════════════════════════════════════════════════════════════════════════
 * VFS APP ADAPTER (Phase 16A)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * App-level wrapper around VFSService that enforces per-app permissions
 * via the Permission Matrix before delegating to the core VFS.
 * 
 * Defense-in-Depth Layer Stack:
 *   Layer 1 (THIS): AppVFSAdapter → Permission Matrix check
 *   Layer 2 (FROZEN): governanceCheck() → system:// protection  
 *   Layer 3 (FROZEN): VFSPath.normalize() → path traversal block
 * 
 * IMPORTANT: This file does NOT modify lib/vfs/service.ts.
 * It wraps it with additional app-level enforcement.
 * 
 * @module coreos/vfs/app-adapter
 */

import { VFSService } from '@/lib/vfs/service';
import type { VFSMetadata } from '@/lib/vfs/types';
import { VFSError } from '@/lib/vfs/types';
import {
    checkAppPermission,
    getAppPermissionSet,
    type VFSIntent,
    type VFSSchemeScope,
    type AppPermissionSet,
} from './permission-matrix';

// ─── Helpers ──────────────────────────────────────────────────────────────

/**
 * Extract scheme from a VFS path (e.g., 'user://Docs' → 'user')
 */
function extractScheme(path: string): VFSSchemeScope {
    const match = path.match(/^(\w+):\/\//);
    if (!match) {
        throw new VFSError('INVALID_PATH', `Cannot extract scheme from path: ${path}`);
    }
    return match[1] as VFSSchemeScope;
}

// ─── App VFS Adapter ──────────────────────────────────────────────────────

export class AppVFSAdapter {
    private vfs: VFSService;
    private readonly appId: string;
    private readonly userId: string;

    constructor(appId: string, userId: string) {
        this.appId = appId;
        this.userId = userId;
        this.vfs = new VFSService();
    }

    /**
     * Internal: enforce permission before calling VFSService
     */
    private enforce(intent: VFSIntent, path: string): void {
        const scheme = extractScheme(path);
        const result = checkAppPermission(this.appId, intent, scheme);

        if (!result.allowed) {
            // Emit audit log for DENY at app level
            console.info('[VFS:AppAdapter:Audit]', JSON.stringify({
                intent,
                path,
                appId: this.appId,
                userId: this.userId,
                decision: 'DENY',
                layer: 'app-adapter',
                reason: result.reason,
                timestamp: Date.now(),
            }));

            throw new VFSError(
                'PERMISSION_DENIED',
                `APP_PERMISSION_DENIED: ${result.reason}`
            );
        }

        // Log ALLOW at app level
        console.info('[VFS:AppAdapter:Audit]', JSON.stringify({
            intent,
            path,
            appId: this.appId,
            userId: this.userId,
            decision: 'ALLOW',
            layer: 'app-adapter',
            timestamp: Date.now(),
        }));
    }

    /**
     * Context object passed to VFSService
     */
    private get context() {
        return { userId: this.userId, appId: this.appId };
    }

    // ─── VFS Operations ─────────────────────────────────────────────────

    async list(path: string): Promise<VFSMetadata[]> {
        this.enforce('fs.list', path);
        return this.vfs.list(path, this.context);
    }

    async stat(path: string): Promise<VFSMetadata | null> {
        this.enforce('fs.stat', path);
        return this.vfs.stat(path, this.context);
    }

    async read(path: string): Promise<ArrayBuffer> {
        this.enforce('fs.read', path);
        return this.vfs.read(path, this.context);
    }

    async write(path: string, data: ArrayBuffer | string): Promise<VFSMetadata> {
        this.enforce('fs.write', path);
        return this.vfs.write(path, data, this.context);
    }

    async mkdir(path: string): Promise<VFSMetadata> {
        this.enforce('fs.mkdir', path);
        return this.vfs.mkdir(path, this.context);
    }

    async rename(path: string, newName: string): Promise<VFSMetadata> {
        this.enforce('fs.write', path);  // rename requires write permission
        return this.vfs.rename(path, newName, this.context);
    }

    async move(srcPath: string, dstPath: string): Promise<VFSMetadata> {
        this.enforce('fs.write', srcPath);   // move requires write on source
        this.enforce('fs.write', dstPath);   // and write on destination
        return this.vfs.move(srcPath, dstPath, this.context);
    }

    async delete(path: string): Promise<void> {
        this.enforce('fs.delete', path);
        return this.vfs.delete(path, this.context);
    }

    // ─── Permission Query (for UI) ──────────────────────────────────────

    /**
     * Get the permission set for this app (for UI badge display)
     */
    getPermissions(): AppPermissionSet {
        return getAppPermissionSet(this.appId);
    }

    /**
     * Get the app ID
     */
    getAppId(): string {
        return this.appId;
    }
}
