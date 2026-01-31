/**
 * ═══════════════════════════════════════════════════════════════════════════
 * APICOREDATA OS — Core Apps Registry
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * PHASE 7.3: Single source of truth for OS Core Apps
 * 
 * This registry defines all apps available in the Core Hub launcher.
 * NO DB fetching, NO API calls — pure static configuration.
 * 
 * RULES:
 * - labelKey must map to i18n messages.json
 * - iconName must be a valid Lucide icon name
 * - appQuery is the ?app= value for OS Shell routing
 * - kind: 'core' = main apps, 'system' = settings/preferences
 * 
 * @version 1.0.0
 * @date 2026-01-29
 */

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type CoreAppKind = 'core' | 'system';

export interface CoreAppDefinition {
    /** Unique app identifier (matches OSAppId) */
    id: string;
    /** i18n key for the label (e.g., 'v2.apps.users') */
    labelKey: string;
    /** Fallback label if i18n not found */
    labelFallback: string;
    /** Lucide icon name or custom icon identifier */
    iconName: string;
    /** Query param for OS Shell routing (?app=<appQuery>) */
    appQuery: string;
    /** App category */
    kind: CoreAppKind;
    /** Display order in the grid */
    order: number;
    /** Whether the app is enabled/visible */
    enabled: boolean;
    /** Optional description key */
    descriptionKey?: string;
    /** Optional badge (for notifications, etc.) */
    badge?: number | 'dot';
}

// ═══════════════════════════════════════════════════════════════════════════
// CORE APPS REGISTRY
// ═══════════════════════════════════════════════════════════════════════════

export const CORE_APPS_REGISTRY: CoreAppDefinition[] = [
    // ─────────────────────────────────────────────────────────────────────────
    // CORE APPS (Main workspace apps)
    // ─────────────────────────────────────────────────────────────────────────
    {
        id: 'users',
        labelKey: 'v2.apps.users',
        labelFallback: 'Users',
        iconName: 'Users',
        appQuery: 'users',
        kind: 'core',
        order: 1,
        enabled: true,
        descriptionKey: 'v2.apps.usersDesc',
    },
    {
        id: 'organizations',
        labelKey: 'v2.apps.organizations',
        labelFallback: 'Organizations',
        iconName: 'Building2',
        appQuery: 'organizations',
        kind: 'core',
        order: 2,
        enabled: true,
        descriptionKey: 'v2.apps.organizationsDesc',
    },
    {
        id: 'audit-logs',
        labelKey: 'v2.apps.auditLogs',
        labelFallback: 'Audit Logs',
        iconName: 'ScrollText',
        appQuery: 'audit-logs',
        kind: 'core',
        order: 3,
        enabled: true,
        descriptionKey: 'v2.apps.auditLogsDesc',
    },

    // ─────────────────────────────────────────────────────────────────────────
    // SYSTEM APPS (Settings, preferences, utilities)
    // ─────────────────────────────────────────────────────────────────────────
    {
        id: 'settings',
        labelKey: 'v2.apps.settings',
        labelFallback: 'Settings',
        iconName: 'Settings',
        appQuery: 'settings',
        kind: 'system',
        order: 100,
        enabled: true,
        descriptionKey: 'v2.apps.settingsDesc',
    },
];

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get all enabled apps, sorted by order
 */
export function getEnabledApps(): CoreAppDefinition[] {
    return CORE_APPS_REGISTRY
        .filter(app => app.enabled)
        .sort((a, b) => a.order - b.order);
}

/**
 * Get apps by kind
 */
export function getAppsByKind(kind: CoreAppKind): CoreAppDefinition[] {
    return getEnabledApps().filter(app => app.kind === kind);
}

/**
 * Get a single app by ID
 */
export function getAppById(id: string): CoreAppDefinition | undefined {
    return CORE_APPS_REGISTRY.find(app => app.id === id);
}

/**
 * Get core apps only (for main grid)
 */
export function getCoreApps(): CoreAppDefinition[] {
    return getAppsByKind('core');
}

/**
 * Get system apps only (for settings/utilities section)
 */
export function getSystemApps(): CoreAppDefinition[] {
    return getAppsByKind('system');
}

export default CORE_APPS_REGISTRY;
