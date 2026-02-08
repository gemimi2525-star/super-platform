/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PERMISSION STORE (Phase 20)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Manages the storage and retrieval of permission grants.
 * Supports multiple scopes:
 * - Session: Memory-only (lost on reload)
 * - Persistent: LocalStorage (survives reload)
 * 
 * @module coreos/permissions/store
 */

import type { CapabilityId, PermissionScope } from '../types';

interface PermissionRecord {
    capabilityId: CapabilityId;
    scope: PermissionScope;
    grantedAt: number;
    appName: string; // For UI display
}

const STORAGE_PREFIX = 'synapse_perm_';

class PermissionStore {
    private sessionStore: Map<string, PermissionRecord> = new Map();

    constructor() {
        // Load persistent permissions (if any) could be done here or lazily
        console.log('[PermissionStore] Initialized');
    }

    private getKey(appName: string, capabilityId: CapabilityId): string {
        return `${appName}:${capabilityId}`;
    }

    /**
     * Check if a permission exists
     */
    check(appName: string, capabilityId: CapabilityId): PermissionRecord | null {
        const key = this.getKey(appName, capabilityId);

        // 1. Check Session
        if (this.sessionStore.has(key)) {
            return this.sessionStore.get(key)!;
        }

        // 2. Check Persistent (LocalStorage)
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem(STORAGE_PREFIX + key);
            if (stored) {
                try {
                    return JSON.parse(stored) as PermissionRecord;
                } catch (e) {
                    console.error('[PermissionStore] Failed to parse persistent record', e);
                }
            }
        }

        return null;
    }

    /**
     * Grant a permission
     */
    grant(appName: string, capabilityId: CapabilityId, scope: PermissionScope) {
        const key = this.getKey(appName, capabilityId);
        const record: PermissionRecord = {
            capabilityId,
            scope,
            grantedAt: Date.now(),
            appName,
        };

        if (scope === 'session') {
            this.sessionStore.set(key, record);
        } else if (scope === 'persistent_app' || scope === 'persistent_org') {
            if (typeof window !== 'undefined') {
                localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(record));
            }
        }

        console.log(`[PermissionStore] Granted ${capabilityId} to ${appName} (${scope})`);
    }

    /**
     * Revoke a specific permission
     */
    revoke(appName: string, capabilityId: CapabilityId) {
        const key = this.getKey(appName, capabilityId);

        // Remove from Session
        this.sessionStore.delete(key);

        // Remove from Persistent
        if (typeof window !== 'undefined') {
            localStorage.removeItem(STORAGE_PREFIX + key);
        }

        console.log(`[PermissionStore] Revoked ${capabilityId} from ${appName}`);
    }

    /**
     * Get all permissions (for Management UI)
     */
    getAll(): PermissionRecord[] {
        const results: PermissionRecord[] = [];

        // 1. Session
        this.sessionStore.forEach(record => results.push(record));

        // 2. Persistent
        if (typeof window !== 'undefined') {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(STORAGE_PREFIX)) {
                    try {
                        const record = JSON.parse(localStorage.getItem(key)!);
                        // Avoid duplicates if in both (though shouldn't happen with correct logic)
                        if (!results.find(r => r.capabilityId === record.capabilityId && r.appName === record.appName)) {
                            results.push(record);
                        }
                    } catch (e) { /* ignore */ }
                }
            }
        }

        return results;
    }
}

// Singleton Instance
export const permissionStore = new PermissionStore();
