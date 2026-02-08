/**
 * ═══════════════════════════════════════════════════════════════════════════
 * APP LIFECYCLE MANAGER (Phase 24A.1)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Handles the logic for installing, updating, and uninstalling applications.
 * Enforces validation, governance checks, and VFS structure.
 * 
 * @module coreos/registry/lifecycle
 */

import type { AppPackage } from '../manifests/spec';
import { appRegistry } from './index';

// Placeholder for VFS interaction (Phase 21)
// In a real system, we'd import the VFS manager here.
const VFS_APPS_ROOT = '/apps';

import { determineTrustLevel } from '../policy/trust';
import { validateInstallPolicy } from '../policy/enforcement';

export class AppLifecycleManager {

    /**
     * Install an application
     * 1. Validate Bundle & Manifest
     * 2. Enforce Governance (Phase 24A.2)
     * 3. Provision VFS
     * 4. Register
     */
    async installApp(pkg: AppPackage): Promise<boolean> {
        console.log(`[AppLifecycle] Installing ${pkg.manifest.appId}...`);

        try {
            // 1. Validation
            this.validatePackage(pkg);

            // 2. Governance & Policy (Phase 24A.2)
            const trustLevel = determineTrustLevel(pkg.manifest.appId, pkg.signature);
            console.log(`[AppLifecycle] Trust Assessment: ${pkg.manifest.appId} = Tier ${trustLevel}`);

            const policyResult = validateInstallPolicy(pkg.manifest, trustLevel);
            if (!policyResult.allowed) {
                throw new Error(`Policy Violation: ${policyResult.reason}`);
            }

            // 3. Conflict Check
            const existing = appRegistry.getApp(pkg.manifest.appId);
            if (existing) {
                throw new Error(`App ${pkg.manifest.appId} is already installed. Use UPDATE_APP.`);
            }

            // 4. Provision VFS (Mock)
            const installPath = `${VFS_APPS_ROOT}/${pkg.manifest.appId}`;
            console.log(`[AppLifecycle] Provisioning VFS at ${installPath}`);
            // await vfs.mkdir(installPath);
            // await vfs.write(`${installPath}/manifest.json`, JSON.stringify(pkg.manifest));
            // await vfs.write(`${installPath}/bundle.js`, pkg.bundle);

            // 5. Register
            appRegistry.register(pkg, installPath);

            console.log(`[AppLifecycle] Install Complete: ${pkg.manifest.name}`);
            return true;

        } catch (error) {
            console.error(`[AppLifecycle] Install Failed:`, error);
            return false;
        }
    }

    /**
     * Uninstall an application
     */
    async uninstallApp(appId: string): Promise<boolean> {
        console.log(`[AppLifecycle] Uninstalling ${appId}...`);

        try {
            // 1. Check existence
            if (!appRegistry.isRunnable(appId)) {
                throw new Error(`App ${appId} is not installed.`);
            }

            // 2. Deprovision VFS (Mock)
            // await vfs.rm(`${VFS_APPS_ROOT}/${appId}`);

            // 3. Unregister
            const success = appRegistry.unregister(appId);
            return success;

        } catch (error) {
            console.error(`[AppLifecycle] Uninstall Failed:`, error);
            return false;
        }
    }

    /**
     * Validate the package structure and manifest
     */
    private validatePackage(pkg: AppPackage): void {
        const { manifest } = pkg;

        if (!manifest.appId) throw new Error('Missing appId in manifest');
        if (!manifest.name) throw new Error('Missing name in manifest');
        if (!manifest.version) throw new Error('Missing version in manifest');
        if (!manifest.entry) throw new Error('Missing entry point in manifest');
        if (!pkg.checksum) throw new Error('Missing checksum in package');

        // Hard constraint: AppId must be reverse domain
        if (!/^[a-z0-9]+\.[a-z0-9]+\.[a-z0-9-]+$/.test(manifest.appId)) {
            throw new Error(`Invalid appId format: ${manifest.appId}. Must be reverse-domain (e.g. com.example.app)`);
        }
    }
}

export const appLifecycle = new AppLifecycleManager();
