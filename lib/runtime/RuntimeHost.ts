/**
 * Phase 16: Runtime Host
 * 
 * Spawns and manages app runtime instances (Worker-based).
 * Handles lifecycle, capability grants, and IPC setup.
 */

import type {
    AppManifest,
    Capability,
    RuntimeSpawnResult,
    RuntimeIntentResult,
    IPCMessage,
    IPCIntentRequest,
    TrustLevel,
} from './types';
import { RuntimeError, DEFAULT_CAPABILITY_POLICIES } from './types';
import { RuntimeRegistry } from './RuntimeRegistry';
import {
    createInitMessage,
    handleIPCMessage,
    validateIPCMessage,
    generateTraceId,
} from './RuntimeIPC';

// ═══════════════════════════════════════════════════════════════════════════
// Capability Granting
// ═══════════════════════════════════════════════════════════════════════════

function determineTrustLevel(appId: string): TrustLevel {
    // First-party apps start with "os." or "core."
    if (appId.startsWith('os.') || appId.startsWith('core.')) {
        return 'first-party';
    }
    // For now, all other apps are third-party-unverified
    // TODO: Add verification system in future phase
    return 'third-party-unverified';
}

function grantCapabilities(
    manifest: AppManifest,
    trustLevel: TrustLevel,
    isAdmin: boolean
): { granted: Capability[]; denied: Capability[] } {
    const granted: Capability[] = [];
    const denied: Capability[] = [];

    for (const requested of manifest.requestedCapabilities) {
        const policy = DEFAULT_CAPABILITY_POLICIES.find(p => p.capability === requested);

        if (!policy) {
            console.warn(`[RuntimeHost] Unknown capability: ${requested}`);
            denied.push(requested);
            continue;
        }

        // Check admin requirement
        if (policy.requiresAdmin && !isAdmin) {
            denied.push(requested);
            continue;
        }

        // Check trust level
        if (!policy.allowedTrustLevels.includes(trustLevel)) {
            denied.push(requested);
            continue;
        }

        granted.push(requested);
    }

    return { granted, denied };
}

// ═══════════════════════════════════════════════════════════════════════════
// Manifest Validation
// ═══════════════════════════════════════════════════════════════════════════

function validateManifest(manifest: AppManifest): { valid: boolean; error?: string } {
    if (!manifest.appId || typeof manifest.appId !== 'string') {
        return { valid: false, error: 'Invalid appId' };
    }
    if (!manifest.name || typeof manifest.name !== 'string') {
        return { valid: false, error: 'Invalid name' };
    }
    if (!manifest.version || typeof manifest.version !== 'string') {
        return { valid: false, error: 'Invalid version' };
    }
    if (!manifest.entry || typeof manifest.entry !== 'string') {
        return { valid: false, error: 'Invalid entry' };
    }
    if (manifest.runtime !== 'worker' && manifest.runtime !== 'iframe') {
        return { valid: false, error: 'Invalid runtime type' };
    }
    if (!Array.isArray(manifest.requestedCapabilities)) {
        return { valid: false, error: 'Invalid requestedCapabilities' };
    }
    // Check for .. in entry path (security)
    if (manifest.entry.includes('..')) {
        return { valid: false, error: 'Entry path cannot contain ..' };
    }
    return { valid: true };
}

// ═══════════════════════════════════════════════════════════════════════════
// Runtime Host Class
// ═══════════════════════════════════════════════════════════════════════════

export class RuntimeHost {
    private intentDispatcher?: (request: IPCIntentRequest) => Promise<RuntimeIntentResult>;

    constructor(intentDispatcher?: (request: IPCIntentRequest) => Promise<RuntimeIntentResult>) {
        this.intentDispatcher = intentDispatcher;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Spawn App Runtime
    // ─────────────────────────────────────────────────────────────────────────

    async spawn(manifest: AppManifest, isAdmin: boolean = false): Promise<RuntimeSpawnResult> {
        const traceId = generateTraceId();
        console.log(`[RuntimeHost] Spawning app: ${manifest.appId} (trace=${traceId})`);

        // Validate manifest
        const validation = validateManifest(manifest);
        if (!validation.valid) {
            return {
                success: false,
                error: RuntimeError.INVALID_MANIFEST,
                reason: validation.error,
            };
        }

        // Check if already running
        if (RuntimeRegistry.isRunning(manifest.appId)) {
            return {
                success: false,
                error: RuntimeError.ALREADY_RUNNING,
                reason: `App ${manifest.appId} is already running`,
            };
        }

        // Determine trust level and grant capabilities
        const trustLevel = determineTrustLevel(manifest.appId);
        const { granted, denied } = grantCapabilities(manifest, trustLevel, isAdmin);

        console.log(`[RuntimeHost] Trust=${trustLevel}, Granted=${granted.length}, Denied=${denied.length}`);

        // Only Worker runtime supported in v1
        if (manifest.runtime !== 'worker') {
            return {
                success: false,
                error: RuntimeError.SPAWN_FAILED,
                reason: 'Only worker runtime supported in v1',
            };
        }

        // Generate PID
        const pid = `runtime-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

        try {
            // Create worker
            const worker = new Worker(manifest.entry, { type: 'module' });

            // Register in registry
            const instance = RuntimeRegistry.register(manifest, pid, granted, worker);

            // Setup message handler
            worker.addEventListener('message', async (event) => {
                const data = event.data;
                if (!validateIPCMessage(data)) {
                    console.warn('[RuntimeHost] Invalid IPC message:', data);
                    return;
                }

                if (!this.intentDispatcher) {
                    console.error('[RuntimeHost] No intent dispatcher configured');
                    return;
                }

                const response = await handleIPCMessage(data, this.intentDispatcher);
                if (response) {
                    worker.postMessage(response);
                }
            });

            // Setup error handler
            worker.addEventListener('error', (error) => {
                console.error(`[RuntimeHost] Worker error for ${manifest.appId}:`, error);
                RuntimeRegistry.updateState(manifest.appId, 'CRASHED', error.message);
            });

            // Send INIT message
            const initMsg = createInitMessage(manifest.appId, granted);
            worker.postMessage(initMsg);

            // Update state to RUNNING (will be updated when worker sends READY)
            RuntimeRegistry.updateState(manifest.appId, 'RUNNING');

            return {
                success: true,
                appId: manifest.appId,
                pid,
                grantedCapabilities: granted,
            };

        } catch (e) {
            const error = e as Error;
            console.error(`[RuntimeHost] Spawn failed for ${manifest.appId}:`, error);
            return {
                success: false,
                error: RuntimeError.SPAWN_FAILED,
                reason: error.message,
            };
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Terminate Runtime
    // ─────────────────────────────────────────────────────────────────────────

    terminate(appId: string): boolean {
        console.log(`[RuntimeHost] Terminating: ${appId}`);
        const instance = RuntimeRegistry.get(appId);
        if (!instance) return false;

        RuntimeRegistry.updateState(appId, 'TERMINATED');
        return RuntimeRegistry.unregister(appId);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Get Runtime Info
    // ─────────────────────────────────────────────────────────────────────────

    getRuntime(appId: string) {
        return RuntimeRegistry.get(appId);
    }

    getAllRuntimes() {
        return RuntimeRegistry.getAll();
    }

    getStats() {
        return RuntimeRegistry.getStats();
    }
}

// Export singleton instance
export const runtimeHost = new RuntimeHost();
