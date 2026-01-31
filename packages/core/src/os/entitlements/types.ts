/**
 * OS Entitlement Types
 * Defines data structures for organization feature flags and access rights.
 */

export type EntitlementFlag = string;

export interface OrgEntitlements {
    /** List of active feature flags for the organization */
    flags: EntitlementFlag[];
    /** Source of the entitlement data */
    source: 'mock' | 'db';
    /** Last update timestamp (if available) */
    updatedAt?: string;
}

export const FALLBACK_CORE_FLAGS: EntitlementFlag[] = [
    'app.users',
    'app.orgs',
    'app.settings'
];

// Fallback for when entitlements cannot be loaded (minimal safe mode)
export const MINIMAL_ENTITLEMENTS: OrgEntitlements = {
    flags: FALLBACK_CORE_FLAGS,
    source: 'mock',
    updatedAt: new Date().toISOString()
};
