/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SYNAPSE — Manifest Index (Phase E + F)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Single source of truth for all capability manifests.
 * All manifests are imported from individual files in /coreos/manifests/
 * 
 * CORE capabilities: 6 (system-built)
 * EXPERIMENTAL capabilities: 1 (plugin.analytics — Phase F)
 * 
 * @see /docs/specs/CAPABILITY_MANIFEST_v1.md
 * @see /docs/governance/CAPABILITY_REGISTRY_v1.md
 * @module coreos/manifests
 */

// Import individual manifests
import { CORE_FINDER_MANIFEST } from './core.finder';
import { CORE_SETTINGS_MANIFEST } from './core.settings';
import { USER_MANAGE_MANIFEST } from './user.manage';
import { ORG_MANAGE_MANIFEST } from './org.manage';
import { AUDIT_VIEW_MANIFEST } from './audit.view';
import { SYSTEM_CONFIGURE_MANIFEST } from './system.configure';

// Phase 5: Operational Visibility
import { OPS_CENTER_MANIFEST } from './ops.center';

// Phase F: EXPERIMENTAL capabilities
import { PLUGIN_ANALYTICS_MANIFEST } from './plugin.analytics';

import type { CapabilityId, CapabilityManifest } from '../types';

// ═══════════════════════════════════════════════════════════════════════════
// MANIFEST REGISTRY (Single Source of Truth)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Complete capability manifest registry
 * Built from individual manifest files
 * 
 * GOVERNANCE: All capabilities here must be listed in:
 * /docs/governance/CAPABILITY_REGISTRY_v1.md
 */
export const CAPABILITY_MANIFESTS: Record<CapabilityId, CapabilityManifest> = {
    'core.finder': CORE_FINDER_MANIFEST,
    'core.settings': CORE_SETTINGS_MANIFEST,
    'user.manage': USER_MANAGE_MANIFEST,
    'org.manage': ORG_MANAGE_MANIFEST,
    'audit.view': AUDIT_VIEW_MANIFEST,
    'system.configure': SYSTEM_CONFIGURE_MANIFEST,

    // Phase 5: Operational Visibility
    'ops.center': OPS_CENTER_MANIFEST,

    // Phase F: EXPERIMENTAL
    'plugin.analytics': PLUGIN_ANALYTICS_MANIFEST,
};

// Re-export individual manifests
export {
    CORE_FINDER_MANIFEST,
    CORE_SETTINGS_MANIFEST,
    USER_MANAGE_MANIFEST,
    ORG_MANAGE_MANIFEST,
    AUDIT_VIEW_MANIFEST,
    SYSTEM_CONFIGURE_MANIFEST,
    // Phase 5: Operational Visibility
    OPS_CENTER_MANIFEST,
    // Phase F: EXPERIMENTAL
    PLUGIN_ANALYTICS_MANIFEST,
};

// ═══════════════════════════════════════════════════════════════════════════
// REGISTRY HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get all registered capability IDs
 */
export function getRegisteredCapabilityIds(): readonly CapabilityId[] {
    return Object.keys(CAPABILITY_MANIFESTS) as CapabilityId[];
}

/**
 * Get all registered manifests
 */
export function getRegisteredManifests(): readonly CapabilityManifest[] {
    return Object.values(CAPABILITY_MANIFESTS);
}

/**
 * Check if capability is registered
 */
export function isRegistered(id: CapabilityId): boolean {
    return id in CAPABILITY_MANIFESTS;
}
