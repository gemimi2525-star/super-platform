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
import { CORE_FILES_MANIFEST } from './core.files'; // Phase 26.1.x
import { CORE_SETTINGS_MANIFEST } from './core.settings';
import { USER_MANAGE_MANIFEST } from './user.manage';
import { ORG_MANAGE_MANIFEST } from './org.manage';
import { AUDIT_VIEW_MANIFEST } from './audit.view';
import { SYSTEM_CONFIGURE_MANIFEST } from './system.configure';
// Phase 18: Utility Tools
// Phase 18: Utility Tools
import { CORE_TOOLS_MANIFEST } from './core.tools';
// Phase 19: Permission System
import { CORE_PERMISSIONS_MANIFEST } from './core.permissions';

// Phase 5: Operational Visibility
import { OPS_CENTER_MANIFEST } from './ops.center';

// Phase 39: AI Brain Assistant
import { BRAIN_ASSIST_MANIFEST } from './brain.assist';

// Phase F: EXPERIMENTAL capabilities
import { PLUGIN_ANALYTICS_MANIFEST } from './plugin.analytics';

// Phase 27A: System Hub (Control Plane Consolidation)
import { SYSTEM_HUB_MANIFEST } from './system.hub';

// Phase 15B: Task Manager
import { SYSTEM_TASKMANAGER_MANIFEST } from './system.taskmanager';

// Phase 18: Notification Center
import { SYSTEM_NOTIFICATIONS_MANIFEST } from './system.notifications';

// Phase 16A: VFS App Integration
import { CORE_NOTES_MANIFEST } from './core.notes';

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
    'core.files': CORE_FILES_MANIFEST, // Phase 26.1.x
    'core.settings': CORE_SETTINGS_MANIFEST,
    'user.manage': USER_MANAGE_MANIFEST,
    // Phase 24B: App Store (placeholder — no component yet)
    'core.store': {
        id: 'core.store',
        title: 'App Store',
        icon: '🛍️',
        hasUI: true,
        windowMode: 'single',
        windowDisplay: 'window',
        contextsSupported: ['global'],
        requiredPolicies: [],
        requiresStepUp: false,
        dependencies: [],
        showInDock: false, // Phase 38: hidden — no component exists yet
        certificationTier: 'core'
    },
    'org.manage': ORG_MANAGE_MANIFEST,
    'audit.view': AUDIT_VIEW_MANIFEST,
    'system.configure': SYSTEM_CONFIGURE_MANIFEST,
    // Phase 18: Utility Tools
    // Phase 18: Utility Tools
    'core.tools': CORE_TOOLS_MANIFEST,
    // Phase 19: Permission System
    'core.permissions': CORE_PERMISSIONS_MANIFEST,

    // Phase 5: Operational Visibility
    'ops.center': OPS_CENTER_MANIFEST,

    // Phase F: EXPERIMENTAL
    'plugin.analytics': PLUGIN_ANALYTICS_MANIFEST,

    // Phase 39: AI Brain Assistant
    'brain.assist': BRAIN_ASSIST_MANIFEST,

    // Phase 16A: VFS App Integration
    'core.notes': CORE_NOTES_MANIFEST,

    // Phase 27A: System Hub
    'system.hub': SYSTEM_HUB_MANIFEST,

    // Phase 15B: Task Manager
    'system.taskmanager': SYSTEM_TASKMANAGER_MANIFEST,

    // Phase 18: Notification Center
    'system.notifications': SYSTEM_NOTIFICATIONS_MANIFEST,

    // Phase 39: AI Governance Brain
    'core.admin': {
        id: 'core.admin',
        title: 'Administration',
        icon: '🔐',
        hasUI: false,
        windowMode: 'backgroundOnly',
        contextsSupported: ['global'],
        requiredPolicies: ['admin.access'],
        requiresStepUp: true,
        stepUpMessage: 'Administrative access requires verification',
        dependencies: [],
        showInDock: false,
        certificationTier: 'core',
        requiredRole: 'admin',
    },
    'core.finance': {
        id: 'core.finance',
        title: 'Finance',
        icon: '💰',
        hasUI: false,
        windowMode: 'backgroundOnly',
        contextsSupported: ['organization'],
        requiredPolicies: ['finance.access'],
        requiresStepUp: true,
        stepUpMessage: 'Financial operations require verification',
        dependencies: [],
        showInDock: false,
        certificationTier: 'core',
        requiredRole: 'admin',
    },

    // Phase 25B → Phase 26A: brain.dashboard merged into Monitor Hub → Brain tab
    // Phase 38: showInDock disabled — access via Monitor Hub internal tabs only
    'brain.dashboard': {
        id: 'brain.dashboard',
        title: 'Brain Dashboard (Legacy)',
        icon: '🧠',
        hasUI: false, // Phase 38: no standalone UI — merged into Monitor Hub
        windowMode: 'backgroundOnly',
        contextsSupported: ['global'],
        requiredPolicies: ['owner.access'],
        requiresStepUp: true,
        stepUpMessage: 'Brain Dashboard requires owner verification',
        dependencies: [],
        showInDock: false, // Phase 38: merged into Monitor Hub
        certificationTier: 'core',
        requiredRole: 'owner',
    },
};

// Re-export individual manifests
export {
    CORE_FINDER_MANIFEST,
    CORE_FILES_MANIFEST,
    CORE_SETTINGS_MANIFEST,
    USER_MANAGE_MANIFEST,
    ORG_MANAGE_MANIFEST,
    AUDIT_VIEW_MANIFEST,
    SYSTEM_CONFIGURE_MANIFEST,
    CORE_PERMISSIONS_MANIFEST, // Already present, ensuring it's correctly handled
    // Phase 18: Utility Tools
    CORE_TOOLS_MANIFEST,
    // Phase 5: Operational Visibility
    OPS_CENTER_MANIFEST,
    // Phase 39: Best Practices
    BRAIN_ASSIST_MANIFEST,
    // Phase 16A: VFS App Integration
    CORE_NOTES_MANIFEST,
    // Phase 27A: System Hub
    SYSTEM_HUB_MANIFEST,
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
