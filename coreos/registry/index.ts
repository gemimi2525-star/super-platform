/**
 * ═══════════════════════════════════════════════════════════════════════════
 * APP REGISTRY (Phase 24A.1)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * System-wide source of truth for installed applications.
 * Maintains the state of all third-party apps, their manifests, and status.
 * 
 * @module coreos/registry
 */

import type { AppManifest, AppPackage } from '../manifests/spec';

/**
 * Status of an installed application
 */
export type AppInstallStatus =
    | 'INSTALLED'   // Ready to run
    | 'DISABLED'    // Installed but disabled by policy/user
    | 'BROKEN'      // Verification failed
    | 'INSTALLING'; // Currently installing

/**
 * Metadata for a registered app
 */
export interface RegisteredApp {
    readonly manifest: AppManifest;
    readonly status: AppInstallStatus;
    readonly installedAt: number;
    readonly updatedAt: number;
    readonly location: string; // VFS path to app root
    readonly checksum: string;
}

class AppRegistry {
    // In-memory registry (would be persisted to VFS /system/registry.json in production)
    private apps: Map<string, RegisteredApp> = new Map();

    constructor() {
        console.log('[AppRegistry] Initialized');
    }

    /**
     * Register a new application (Install)
     */
    register(pkg: AppPackage, location: string): void {
        const { appId } = pkg.manifest;

        if (this.apps.has(appId)) {
            console.warn(`[AppRegistry] Overwriting existing app: ${appId}`);
        }

        const record: RegisteredApp = {
            manifest: pkg.manifest,
            status: 'INSTALLED',
            installedAt: Date.now(),
            updatedAt: Date.now(),
            location,
            checksum: pkg.checksum
        };

        this.apps.set(appId, record);
        console.log(`[AppRegistry] Registered: ${appId} v${pkg.manifest.version}`);
    }

    /**
     * Unregister an application (Uninstall)
     */
    unregister(appId: string): boolean {
        if (!this.apps.has(appId)) return false;
        this.apps.delete(appId);
        console.log(`[AppRegistry] Unregistered: ${appId}`);
        return true;
    }

    /**
     * Get app record by ID
     */
    getApp(appId: string): RegisteredApp | undefined {
        return this.apps.get(appId);
    }

    /**
     * List all registered apps
     */
    listApps(): RegisteredApp[] {
        return Array.from(this.apps.values());
    }

    /**
     * Disable an application
     */
    setAppStatus(appId: string, status: AppInstallStatus): void {
        const app = this.apps.get(appId);
        if (app) {
            this.apps.set(appId, { ...app, status, updatedAt: Date.now() });
        }
    }

    /**
     * Check if app is installed and enabled
     */
    isRunnable(appId: string): boolean {
        const app = this.apps.get(appId);
        return app?.status === 'INSTALLED';
    }
}

// Singleton Instance
export const appRegistry = new AppRegistry();
