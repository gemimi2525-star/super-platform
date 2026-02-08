/**
 * ═══════════════════════════════════════════════════════════════════════════
 * VFS (Virtual Filesystem)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Single entry point for all client-side file operations.
 * 
 * Flow:
 * Intent -> Permission Check -> VFS.write() -> Sandbox Resolve -> OPFS Backend
 * 
 * @module coreos/vfs
 */

import { opfsBackend } from './backend/opfs';
import { VFSSandbox, SandboxContext } from './sandbox';

export class VFS {
    /**
     * Write data to the Virtual Filesystem based on URI.
     * Enforces Sandbox boundaries.
     */
    static async write(uri: string, content: string, context: SandboxContext): Promise<void> {
        console.log(`[VFS] Write: ${uri}`);

        // 1. Resolve Path (Sandbox Enforcement)
        const resolvedPath = VFSSandbox.resolvePath(uri, context);
        console.log(`[VFS] Resolved: ${resolvedPath}`);

        // 2. Execute via Backend
        await opfsBackend.write(resolvedPath, content);

        // 3. Phase 22: Enqueue Sync Job (Offline-First)
        // We do this AFTER write success to ensure local persistence first.
        try {
            // Dynamic import to avoid circular dep if bridge imports VFS (though bridge is agnostic)
            const { workerBridge } = await import('../workers/bridge');

            // Construct Job
            const jobId = `job-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
            workerBridge.enqueueJob({
                id: jobId,
                type: 'SYNC_FILE',
                payload: { path: resolvedPath },
                priority: 'NORMAL',
                createdAt: Date.now(),
                createdBy: context.userId,
                traceId: `trace-${jobId}`,
                status: 'PENDING',
                retryCount: 0
            });
            console.log(`[VFS] Sync Job Enqueued: ${jobId}`);
        } catch (e) {
            console.warn('[VFS] Failed to enqueue sync job:', e);
            // Non-blocking failure - local write is still safe
        }
    }

    /**
     * Read data from the Virtual Filesystem.
     */
    static async read(uri: string, context: SandboxContext): Promise<string> {
        console.log(`[VFS] Read: ${uri}`);

        // 1. Resolve Path
        const resolvedPath = VFSSandbox.resolvePath(uri, context);

        // 2. Execute
        return await opfsBackend.read(resolvedPath);
    }

    /**
     * Delete a file.
     */
    static async delete(uri: string, context: SandboxContext): Promise<void> {
        console.log(`[VFS] Delete: ${uri}`);
        const resolvedPath = VFSSandbox.resolvePath(uri, context);
        await opfsBackend.delete(resolvedPath);
    }
}
