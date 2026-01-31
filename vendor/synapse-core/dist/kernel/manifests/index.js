"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PLUGIN_ANALYTICS_MANIFEST = exports.SYSTEM_CONFIGURE_MANIFEST = exports.AUDIT_VIEW_MANIFEST = exports.ORG_MANAGE_MANIFEST = exports.USER_MANAGE_MANIFEST = exports.CORE_SETTINGS_MANIFEST = exports.CORE_FINDER_MANIFEST = exports.CAPABILITY_MANIFESTS = void 0;
exports.getRegisteredCapabilityIds = getRegisteredCapabilityIds;
exports.getRegisteredManifests = getRegisteredManifests;
exports.isRegistered = isRegistered;
// Import individual manifests
const core_finder_1 = require("./core.finder");
Object.defineProperty(exports, "CORE_FINDER_MANIFEST", { enumerable: true, get: function () { return core_finder_1.CORE_FINDER_MANIFEST; } });
const core_settings_1 = require("./core.settings");
Object.defineProperty(exports, "CORE_SETTINGS_MANIFEST", { enumerable: true, get: function () { return core_settings_1.CORE_SETTINGS_MANIFEST; } });
const user_manage_1 = require("./user.manage");
Object.defineProperty(exports, "USER_MANAGE_MANIFEST", { enumerable: true, get: function () { return user_manage_1.USER_MANAGE_MANIFEST; } });
const org_manage_1 = require("./org.manage");
Object.defineProperty(exports, "ORG_MANAGE_MANIFEST", { enumerable: true, get: function () { return org_manage_1.ORG_MANAGE_MANIFEST; } });
const audit_view_1 = require("./audit.view");
Object.defineProperty(exports, "AUDIT_VIEW_MANIFEST", { enumerable: true, get: function () { return audit_view_1.AUDIT_VIEW_MANIFEST; } });
const system_configure_1 = require("./system.configure");
Object.defineProperty(exports, "SYSTEM_CONFIGURE_MANIFEST", { enumerable: true, get: function () { return system_configure_1.SYSTEM_CONFIGURE_MANIFEST; } });
// Phase F: EXPERIMENTAL capabilities
const plugin_analytics_1 = require("./plugin.analytics");
Object.defineProperty(exports, "PLUGIN_ANALYTICS_MANIFEST", { enumerable: true, get: function () { return plugin_analytics_1.PLUGIN_ANALYTICS_MANIFEST; } });
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
exports.CAPABILITY_MANIFESTS = {
    'core.finder': core_finder_1.CORE_FINDER_MANIFEST,
    'core.settings': core_settings_1.CORE_SETTINGS_MANIFEST,
    'user.manage': user_manage_1.USER_MANAGE_MANIFEST,
    'org.manage': org_manage_1.ORG_MANAGE_MANIFEST,
    'audit.view': audit_view_1.AUDIT_VIEW_MANIFEST,
    'system.configure': system_configure_1.SYSTEM_CONFIGURE_MANIFEST,
    // Phase F: EXPERIMENTAL
    'plugin.analytics': plugin_analytics_1.PLUGIN_ANALYTICS_MANIFEST,
};
// ═══════════════════════════════════════════════════════════════════════════
// REGISTRY HELPERS
// ═══════════════════════════════════════════════════════════════════════════
/**
 * Get all registered capability IDs
 */
function getRegisteredCapabilityIds() {
    return Object.keys(exports.CAPABILITY_MANIFESTS);
}
/**
 * Get all registered manifests
 */
function getRegisteredManifests() {
    return Object.values(exports.CAPABILITY_MANIFESTS);
}
/**
 * Check if capability is registered
 */
function isRegistered(id) {
    return id in exports.CAPABILITY_MANIFESTS;
}
//# sourceMappingURL=index.js.map