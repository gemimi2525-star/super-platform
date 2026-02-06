/**
 * Phase 16: Runtime Registry
 * 
 * Manages mapping of appId → RuntimeInstance.
 * Singleton registry for all running app instances.
 */

import type {
    RuntimeInstance,
    RuntimeState,
    AppManifest,
    Capability
} from './types';

// ═══════════════════════════════════════════════════════════════════════════
// Registry Singleton
// ═══════════════════════════════════════════════════════════════════════════

class RuntimeRegistryClass {
    private instances: Map<string, RuntimeInstance> = new Map();
    private pidToAppId: Map<string, string> = new Map();
    private listeners: Set<() => void> = new Set();

    // ─────────────────────────────────────────────────────────────────────────
    // Registration
    // ─────────────────────────────────────────────────────────────────────────

    register(
        manifest: AppManifest,
        pid: string,
        grantedCapabilities: Capability[],
        worker?: Worker
    ): RuntimeInstance {
        const instance: RuntimeInstance = {
            appId: manifest.appId,
            pid,
            state: 'LOADING',
            manifest,
            grantedCapabilities,
            worker,
            startedAt: Date.now(),
            crashCount: 0,
        };

        this.instances.set(manifest.appId, instance);
        this.pidToAppId.set(pid, manifest.appId);
        this.notifyListeners();

        console.log(`[RuntimeRegistry] Registered: ${manifest.appId} (pid=${pid})`);
        return instance;
    }

    unregister(appId: string): boolean {
        const instance = this.instances.get(appId);
        if (!instance) return false;

        // Terminate worker if exists
        if (instance.worker) {
            try {
                instance.worker.terminate();
            } catch (e) {
                console.warn(`[RuntimeRegistry] Error terminating worker for ${appId}:`, e);
            }
        }

        this.pidToAppId.delete(instance.pid);
        this.instances.delete(appId);
        this.notifyListeners();

        console.log(`[RuntimeRegistry] Unregistered: ${appId}`);
        return true;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // State Management
    // ─────────────────────────────────────────────────────────────────────────

    updateState(appId: string, state: RuntimeState, error?: string): boolean {
        const instance = this.instances.get(appId);
        if (!instance) return false;

        const previousState = instance.state;
        instance.state = state;

        if (state === 'RUNNING') {
            instance.lastHeartbeat = Date.now();
        } else if (state === 'SUSPENDED') {
            instance.suspendedAt = Date.now();
        } else if (state === 'TERMINATED') {
            instance.terminatedAt = Date.now();
        } else if (state === 'CRASHED') {
            instance.crashCount += 1;
            instance.error = error;
        }

        this.notifyListeners();
        console.log(`[RuntimeRegistry] State: ${appId} ${previousState} → ${state}`);
        return true;
    }

    updateHeartbeat(appId: string): boolean {
        const instance = this.instances.get(appId);
        if (!instance) return false;
        instance.lastHeartbeat = Date.now();
        return true;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Queries
    // ─────────────────────────────────────────────────────────────────────────

    get(appId: string): RuntimeInstance | undefined {
        return this.instances.get(appId);
    }

    getByPid(pid: string): RuntimeInstance | undefined {
        const appId = this.pidToAppId.get(pid);
        if (!appId) return undefined;
        return this.instances.get(appId);
    }

    getAll(): RuntimeInstance[] {
        return Array.from(this.instances.values());
    }

    getRunning(): RuntimeInstance[] {
        return this.getAll().filter(i => i.state === 'RUNNING');
    }

    isRunning(appId: string): boolean {
        const instance = this.instances.get(appId);
        return instance?.state === 'RUNNING';
    }

    hasCapability(appId: string, capability: Capability): boolean {
        const instance = this.instances.get(appId);
        if (!instance) return false;
        return instance.grantedCapabilities.includes(capability);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Listeners
    // ─────────────────────────────────────────────────────────────────────────

    subscribe(listener: () => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private notifyListeners(): void {
        this.listeners.forEach(fn => fn());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Stats
    // ─────────────────────────────────────────────────────────────────────────

    getStats(): {
        total: number;
        running: number;
        crashed: number;
        suspended: number;
    } {
        const all = this.getAll();
        return {
            total: all.length,
            running: all.filter(i => i.state === 'RUNNING').length,
            crashed: all.filter(i => i.state === 'CRASHED').length,
            suspended: all.filter(i => i.state === 'SUSPENDED').length,
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Cleanup
    // ─────────────────────────────────────────────────────────────────────────

    clear(): void {
        // Terminate all workers
        for (const instance of this.instances.values()) {
            if (instance.worker) {
                try {
                    instance.worker.terminate();
                } catch (e) {
                    // Ignore
                }
            }
        }
        this.instances.clear();
        this.pidToAppId.clear();
        this.notifyListeners();
        console.log('[RuntimeRegistry] Cleared all instances');
    }
}

// Export singleton
export const RuntimeRegistry = new RuntimeRegistryClass();
