import { APP_REGISTRY, NAV_GROUPS } from '../../../../../config/app-registry';
import { OSAppDefinition, OSNavItem, OSNavigationGroup } from '../../types/os-app';
import { validateRegistry } from '../registry/validate-registry';

export interface ResolveNavigationOptions {
    /** Feature flags enabled for the current context (e.g. org entitlements) */
    enabledFlags: string[];
    /** Security policies possessed by the current user */
    userPolicies: string[];
    /** Current locale for constructing paths (if needed, though registry paths are usually locale-agnostic or handled by middleware) */
    locale?: string;
}

export interface ResolvedNavigationItem extends OSNavItem {
    appId: string;
}

export interface ResolvedNavigationGroup extends OSNavigationGroup {
    items: ResolvedNavigationItem[];
}

export interface ResolvedNavigation {
    /** Flat list of navigation items not in any group */
    ungroupedItems: ResolvedNavigationItem[];
    /** Grouped navigation items */
    groups: ResolvedNavigationGroup[];
}

/**
 * Resolves the navigation structure based on the App Registry and user context.
 * Filters out hidden apps and apps the user is not entitled to or authorized for.
 */
export function resolveNavigation(options: ResolveNavigationOptions): ResolvedNavigation {
    // Validate registry (optional here, but good practice to ensure integrity before processing)
    // In production, this might be done at build time or startup, but here we do it runtime for safety.
    // Catching error to avoid crashing the whole nav if one app is bad (though validateRegistry throws).
    try {
        validateRegistry(APP_REGISTRY);
    } catch (error) {
        console.error('Registry validation failed:', error);
        // We might choose to continue with valid apps or return empty.
        // For now, let's log and proceed, assuming the registry is mostly correct.
    }

    const { enabledFlags, userPolicies } = options;

    // 1. Filter accessible apps
    const accessibleApps = APP_REGISTRY.filter(app => {
        // Lifecycle check
        if (app.lifecycle.status === 'hidden') return false;

        // Entitlement check (Feature Flags)
        // If app requires flags, ALL must be present in enabledFlags
        if (app.entitlement.requiredFlags.length > 0) {
            const hasAllFlags = app.entitlement.requiredFlags.every(flag => enabledFlags.includes(flag));
            if (!hasAllFlags) return false;
        }

        // Security check (Policies)
        // If app requires policies, ALL must be present in userPolicies (OR logic can be discussed, assuming AND for now)
        if (app.access.requiredPolicies.length > 0) {
            const hasAllPolicies = app.access.requiredPolicies.every(policy => userPolicies.includes(policy));
            if (!hasAllPolicies) return false;
        }

        return true;
    });

    // 2. Extract Navigation Items from accessible apps
    const allNavItems: ResolvedNavigationItem[] = [];

    for (const app of accessibleApps) {
        for (const navItem of app.nav) {
            // Per-item policy check
            if (navItem.requiredPolicies && navItem.requiredPolicies.length > 0) {
                const hasItemPolicies = navItem.requiredPolicies.every(policy => userPolicies.includes(policy));
                if (!hasItemPolicies) continue;
            }

            allNavItems.push({
                ...navItem,
                appId: app.appId
            });
        }
    }

    // 3. Group Items
    const groups: ResolvedNavigationGroup[] = [];
    const usedAppIds = new Set<string>();

    if (NAV_GROUPS) {
        for (const group of NAV_GROUPS) {
            const groupItems = allNavItems.filter(item => group.apps.includes(item.appId));
            if (groupItems.length > 0) {
                groups.push({
                    ...group,
                    items: groupItems
                });
                groupItems.forEach(item => usedAppIds.add(item.appId));
            }
        }
    }

    // 4. Collect Ungrouped Items
    const ungroupedItems = allNavItems.filter(item => !usedAppIds.has(item.appId));

    return {
        groups,
        ungroupedItems,
        apps: accessibleApps // Return the full app objects for Launcher
    };
}

export interface ResolvedOSApp extends OSAppDefinition { } // Re-export for convenience

export interface ResolvedNavigation {
    /** Flat list of navigation items not in any group */
    ungroupedItems: ResolvedNavigationItem[];
    /** Grouped navigation items */
    groups: ResolvedNavigationGroup[];
    /** Full list of accessible apps (for Launcher) */
    apps: OSAppDefinition[];
}
