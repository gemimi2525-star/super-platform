/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MANIFEST TYPES — Re-export Module
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Provides type re-exports used by UI components that reference
 * capability and permission manifest types.
 * 
 * @module coreos/manifests/types
 */

import type { CapabilityId, PermissionScope } from '../types';

// Re-export core types
export type { CapabilityId } from '../types';
export type { CapabilityManifest } from '../types';

/**
 * PermissionManifest — Shape returned by permissionStore.getAll()
 * Used by SettingsPermissionPanel to display granted permissions.
 */
export interface PermissionManifest {
    capabilityId: CapabilityId;
    scope: PermissionScope;
    grantedAt: number;
    appName: string;
}
