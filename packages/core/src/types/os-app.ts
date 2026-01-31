/**
 * OS App Definition Contracts
 * Defines the structure of an App within the APICOREDATA OS environment.
 */

export type OSAppKind = 'system' | 'business';
export type OSAppStatus = 'stable' | 'beta' | 'hidden';
export type OSNavItemType = 'link' | 'section';
export type OSAvailability = 'core' | 'addon' | 'beta';

export interface OSAppMount {
    /** Base URL path where the app is mounted (must start with /v2/) */
    basePath: string;
    /** Optional route group name for file-system organization */
    routeGroup?: string;
}

export interface OSNavItem {
    id: string;
    /** Translation key for the menu item */
    i18nKey: string;
    /** Path relative to the app's basePath (or absolute if needed) */
    path: string;
    type: OSNavItemType;
    badge?: 'new' | 'beta';
    /** Override policies required for this specific item */
    requiredPolicies?: string[];
    children?: OSNavItem[];
}

export interface OSAppAccess {
    /** Security policies required to access this app */
    requiredPolicies: string[];
}

export interface OSAppEntitlement {
    /** Feature flags required to enable this app */
    requiredFlags: string[];
    availability: OSAvailability;
}

export interface OSAppLifecycle {
    status: OSAppStatus;
}

export interface OSAppIntegration {
    apiScopes?: string[];
    mobileReady?: boolean;
    externalLaunchUrl?: string;
}

export interface OSAppDefinition {
    /** Unique identifier for the app (kebab-case) */
    appId: string;
    kind: OSAppKind;
    i18nKey: string;
    /** Icon name (internal design system icon key) */
    iconKey: string;
    mount: OSAppMount;
    nav: OSNavItem[];
    access: OSAppAccess;
    entitlement: OSAppEntitlement;
    lifecycle: OSAppLifecycle;
    integration?: OSAppIntegration;
}

export interface OSNavigationGroup {
    id: string;
    i18nKey: string;
    apps: string[]; // List of appIds
}

export interface OSAppRegistry {
    version: string;
    apps: OSAppDefinition[];
    groups?: OSNavigationGroup[];
}
