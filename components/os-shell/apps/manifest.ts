/**
 * ═══════════════════════════════════════════════════════════════════════════
 * OS SHELL — App Manifest Schema & Registry
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Shell-side app manifest system for Phase 9.
 * Extends SYNAPSE capabilities with shell-specific properties.
 * 
 * Phase 9.1: Added SSOT enforcement and disabled state support.
 * 
 * GOVERNANCE:
 * - SYNAPSE kernel is FROZEN - we cannot modify CapabilityId types
 * - Shell manifests provide additional metadata for dock/persona gating
 * - Manifest is SSOT for shell visibility, not capability authority
 * - Registry MUST NOT contain duplicate keys
 * 
 * @module components/os-shell/apps/manifest
 * @version 1.1.0 (Phase 9.1)
 */

import type { ComponentType } from 'react';
import type { AppProps } from './registry';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * User role hierarchy for access control
 * Maps to SYNAPSE UserRole
 */
export type UserRole = 'guest' | 'user' | 'admin' | 'owner';

/**
 * Role hierarchy for access checks
 */
const ROLE_HIERARCHY: Record<UserRole, number> = {
    guest: 0,
    user: 1,
    admin: 2,
    owner: 3,
};

/**
 * Check if a user role has access to a required role level
 */
export function roleHasAccess(userRole: UserRole | string | null, requiredRole: UserRole): boolean {
    if (!userRole) return requiredRole === 'guest';
    const userLevel = ROLE_HIERARCHY[userRole as UserRole] ?? 0;
    const requiredLevel = ROLE_HIERARCHY[requiredRole] ?? 0;
    return userLevel >= requiredLevel;
}

/**
 * App category for organization
 */
export type AppCategory = 'core' | 'utility' | 'admin' | 'experimental';

/**
 * Shell-side App Manifest
 * Extends SYNAPSE capability with shell-specific properties
 */
export interface ShellAppManifest {
    // ─────────────────────────────────────────────────────────────────────────
    // Core Identity
    // ─────────────────────────────────────────────────────────────────────────

    /** Must match SYNAPSE CapabilityId */
    appId: string;

    /** Display name */
    name: string;

    /** Emoji or icon name */
    icon: string;

    /** Semantic version */
    version: string;

    /** App category */
    category: AppCategory;

    // ─────────────────────────────────────────────────────────────────────────
    // Access Control
    // ─────────────────────────────────────────────────────────────────────────

    /** Minimum role required to see/launch this app */
    requiredRole: UserRole;

    /** SYNAPSE capability requirements (informational - enforced by kernel) */
    capabilities: readonly string[];

    // ─────────────────────────────────────────────────────────────────────────
    // Behavior
    // ─────────────────────────────────────────────────────────────────────────

    /** Only one window allowed? If true, re-launch focuses existing */
    singleInstance: boolean;

    /** Show in dock launcher? */
    showInDock: boolean;

    /** Show in Finder/Explorer? */
    showInFinder: boolean;

    /** Disabled state (grayed out but visible) */
    disabled?: boolean;

    /** Disabled reason message */
    disabledReason?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// APP MANIFEST REGISTRY
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Shell App Manifest Registry
 * 
 * SSOT for shell-level app visibility and behavior.
 * Note: SYNAPSE manifests handle capability authority.
 */
export const APP_MANIFESTS: Record<string, ShellAppManifest> = {
    // ─────────────────────────────────────────────────────────────────────────
    // CORE APPS (Always visible to authenticated users)
    // ─────────────────────────────────────────────────────────────────────────

    'core.finder': {
        appId: 'core.finder',
        name: 'Finder',
        icon: '📁',
        version: '1.0.0',
        category: 'core',
        requiredRole: 'user',
        capabilities: ['core.finder'],
        singleInstance: true,
        showInDock: true,
        showInFinder: false, // Don't show Finder inside Finder
    },

    'core.settings': {
        appId: 'core.settings',
        name: 'System Settings',
        icon: '⚙️',
        version: '1.0.0',
        category: 'core',
        requiredRole: 'user',
        capabilities: ['core.settings'],
        singleInstance: true,
        showInDock: true,
        showInFinder: true,
    },

    'system.explorer': {
        appId: 'system.explorer',
        name: 'Files (Legacy)',
        icon: '🗂️',
        version: '1.0.0',
        category: 'core',
        requiredRole: 'user',
        capabilities: [],
        singleInstance: true,
        showInDock: false,
        showInFinder: false,
    },

    'core.files': { // Phase 15A M3: VFS Finder
        appId: 'core.files',
        name: 'Files (VFS BE)',
        icon: '🗂️',
        version: '3.0.0',
        category: 'core',
        requiredRole: 'user',
        capabilities: [],
        singleInstance: true,
        showInDock: false,
        showInFinder: false,
    },

    'brain.assist': {
        appId: 'brain.assist',
        name: 'Brain',
        icon: '🧠',
        version: '1.0.0',
        category: 'core',
        requiredRole: 'user',
        capabilities: ['brain.assist'],
        singleInstance: true,
        showInDock: true,
        showInFinder: true,
    },

    // ─────────────────────────────────────────────────────────────────────────
    // ADMIN APPS (Require admin or owner role)
    // ─────────────────────────────────────────────────────────────────────────

    'user.manage': {
        appId: 'user.manage',
        name: 'Users',
        icon: '👥',
        version: '1.0.0',
        category: 'admin',
        requiredRole: 'admin',
        capabilities: ['user.manage'],
        singleInstance: false, // Can open multiple user profiles
        showInDock: true,
        showInFinder: true,
    },

    'org.manage': {
        appId: 'org.manage',
        name: 'Organizations',
        icon: '🏢',
        version: '1.0.0',
        category: 'admin',
        requiredRole: 'admin',
        capabilities: ['org.manage'],
        singleInstance: false,
        showInDock: true,
        showInFinder: true,
    },

    'audit.view': {
        appId: 'audit.view',
        name: 'Audit Logs',
        icon: '📋',
        version: '1.0.0',
        category: 'admin',
        requiredRole: 'admin',
        capabilities: ['audit.view'],
        singleInstance: true,
        showInDock: true,
        showInFinder: true,
    },

    'system.configure': {
        appId: 'system.configure',
        name: 'System Configure',
        icon: '🔧',
        version: '1.0.0',
        category: 'admin',
        requiredRole: 'owner',
        capabilities: ['system.configure'],
        singleInstance: true,
        showInDock: true,
        showInFinder: true,
    },

    // ─────────────────────────────────────────────────────────────────────────
    // MONITOR HUB (Phase 26A — replaces Ops Center + Brain Dashboard)
    // ─────────────────────────────────────────────────────────────────────────

    'ops.center': {
        appId: 'ops.center',
        name: 'Monitor Hub',
        icon: '◈',
        version: '3.0.0',
        category: 'admin',
        requiredRole: 'owner',
        capabilities: [],
        singleInstance: true,
        showInDock: true,
        showInFinder: true,
    },

    // Phase 26A: brain.dashboard merged into Monitor Hub → Brain tab
    // (entry removed — Brain is accessed via Monitor Hub internal tabs)

    // ─────────────────────────────────────────────────────────────────────────
    // SYSTEM HUB (Phase 27A — consolidates Settings/Config/Users/Orgs)
    // ─────────────────────────────────────────────────────────────────────────

    'system.hub': {
        appId: 'system.hub',
        name: 'System Hub',
        icon: '🖥️',
        version: '1.0.0',
        category: 'admin',
        requiredRole: 'admin',
        capabilities: ['system.hub'],
        singleInstance: true,
        showInDock: true,
        showInFinder: true,
    },

    // ─────────────────────────────────────────────────────────────────────────
    // UTILITY APPS
    // ─────────────────────────────────────────────────────────────────────────

    'intent.browser': {
        appId: 'intent.browser',
        name: 'Browser',
        icon: '🌐',
        version: '1.0.0',
        category: 'utility',
        requiredRole: 'user',
        capabilities: [],
        singleInstance: false, // Can open multiple tabs as windows
        showInDock: true,
        showInFinder: true,
    },

    // ─────────────────────────────────────────────────────────────────────────
    // EXPERIMENTAL APPS (Hidden from regular users)
    // ─────────────────────────────────────────────────────────────────────────

    'plugin.analytics': {
        appId: 'plugin.analytics',
        name: 'Analytics',
        icon: '📈',
        version: '0.1.0',
        category: 'experimental',
        requiredRole: 'owner',
        capabilities: ['plugin.analytics'],
        singleInstance: true,
        showInDock: false, // Hidden from dock
        showInFinder: true,
    },
};

// ═══════════════════════════════════════════════════════════════════════════
// REGISTRY HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get manifest by app ID
 */
export function getAppManifest(appId: string): ShellAppManifest | undefined {
    return APP_MANIFESTS[appId];
}

/**
 * Get all registered app IDs
 */
export function getRegisteredAppIds(): string[] {
    return Object.keys(APP_MANIFESTS);
}

/**
 * Get apps visible in dock for a given role
 */
export function getDockApps(userRole: UserRole | string | null): ShellAppManifest[] {
    return Object.values(APP_MANIFESTS)
        .filter(m => m.showInDock && !m.disabled)
        .filter(m => roleHasAccess(userRole, m.requiredRole));
}

/**
 * Get apps visible in Finder for a given role
 */
export function getFinderApps(userRole: UserRole | string | null): ShellAppManifest[] {
    return Object.values(APP_MANIFESTS)
        .filter(m => m.showInFinder && !m.disabled)
        .filter(m => roleHasAccess(userRole, m.requiredRole));
}

/**
 * Get apps by category
 */
export function getAppsByCategory(category: AppCategory): ShellAppManifest[] {
    return Object.values(APP_MANIFESTS).filter(m => m.category === category);
}

/**
 * Check if app should enforce single instance
 */
export function isSingleInstance(appId: string): boolean {
    return APP_MANIFESTS[appId]?.singleInstance ?? false;
}

/**
 * Validate manifest (build-time check)
 */
export function validateManifest(manifest: ShellAppManifest): string[] {
    const errors: string[] = [];

    if (!manifest.appId) {
        errors.push('Missing appId');
    }
    if (!manifest.name) {
        errors.push('Missing name');
    }
    if (!manifest.version || !/^\d+\.\d+\.\d+/.test(manifest.version)) {
        errors.push('Invalid version (must be semver)');
    }
    if (!manifest.requiredRole) {
        errors.push('Missing requiredRole');
    }
    if (!manifest.category) {
        errors.push('Missing category');
    }

    return errors;
}

/**
 * Validate all manifests in registry
 */
export function validateAllManifests(): Record<string, string[]> {
    const results: Record<string, string[]> = {};

    for (const [appId, manifest] of Object.entries(APP_MANIFESTS)) {
        const errors = validateManifest(manifest);
        if (errors.length > 0) {
            results[appId] = errors;
        }
    }

    return results;
}
