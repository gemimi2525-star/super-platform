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
import { CORE_FINDER_MANIFEST } from './core.finder';
import { CORE_SETTINGS_MANIFEST } from './core.settings';
import { USER_MANAGE_MANIFEST } from './user.manage';
import { ORG_MANAGE_MANIFEST } from './org.manage';
import { AUDIT_VIEW_MANIFEST } from './audit.view';
import { SYSTEM_CONFIGURE_MANIFEST } from './system.configure';
import { PLUGIN_ANALYTICS_MANIFEST } from './plugin.analytics';
import type { CapabilityId, CapabilityManifest } from '../../types/index.js';
/**
 * Complete capability manifest registry
 * Built from individual manifest files
 *
 * GOVERNANCE: All capabilities here must be listed in:
 * /docs/governance/CAPABILITY_REGISTRY_v1.md
 */
export declare const CAPABILITY_MANIFESTS: Record<CapabilityId, CapabilityManifest>;
export { CORE_FINDER_MANIFEST, CORE_SETTINGS_MANIFEST, USER_MANAGE_MANIFEST, ORG_MANAGE_MANIFEST, AUDIT_VIEW_MANIFEST, SYSTEM_CONFIGURE_MANIFEST, PLUGIN_ANALYTICS_MANIFEST, };
/**
 * Get all registered capability IDs
 */
export declare function getRegisteredCapabilityIds(): readonly CapabilityId[];
/**
 * Get all registered manifests
 */
export declare function getRegisteredManifests(): readonly CapabilityManifest[];
/**
 * Check if capability is registered
 */
export declare function isRegistered(id: CapabilityId): boolean;
//# sourceMappingURL=index.d.ts.map