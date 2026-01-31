/**
 * ═══════════════════════════════════════════════════════════════════════════
 * OS SHELL — App Registry
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Maps capabilityId to React component for rendering inside windows.
 * 
 * @module components/os-shell/apps/registry
 * @version 1.0.0
 */

import React, { lazy, Suspense, type ComponentType } from 'react';
import type { CapabilityId } from '@/governance/synapse';
import { tokens } from '../tokens';

// ═══════════════════════════════════════════════════════════════════════════
// APP COMPONENT PROPS
// ═══════════════════════════════════════════════════════════════════════════

export interface AppProps {
    windowId: string;
    capabilityId: CapabilityId;
    isFocused: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// LAZY LOADED APPS
// ═══════════════════════════════════════════════════════════════════════════

const UsersAppLazy = lazy(() =>
    import('./users/UsersApp').then(m => ({ default: m.UsersApp }))
);

const AuditLogsAppLazy = lazy(() =>
    import('./audit/AuditLogsApp').then(m => ({ default: m.AuditLogsApp }))
);

const SettingsAppLazy = lazy(() =>
    import('./settings/SettingsApp').then(m => ({ default: m.SettingsApp }))
);

const OrganizationsAppLazy = lazy(() =>
    import('./orgs/OrganizationsApp').then(m => ({ default: m.OrganizationsApp }))
);

const SystemConfigureAppLazy = lazy(() =>
    import('./system/SystemConfigureApp').then(m => ({ default: m.SystemConfigureApp }))
);

const AnalyticsAppLazy = lazy(() =>
    import('./analytics/AnalyticsApp').then(m => ({ default: m.AnalyticsApp }))
);

function LoadingPlaceholder() {
    return (
        <div style={{
            padding: 24,
            color: '#888',
            textAlign: 'center',
            fontFamily: tokens.fontFamily,
        }}>
            Loading...
        </div>
    );
}

// Wrapper to handle suspense
function createLazyApp(LazyComponent: React.LazyExoticComponent<ComponentType<AppProps>>): ComponentType<AppProps> {
    return function LazyWrapper(props: AppProps) {
        return (
            <Suspense fallback={<LoadingPlaceholder />}>
                <LazyComponent {...props} />
            </Suspense>
        );
    };
}

/**
 * Registry mapping capabilityId to app component
 * 
 * IMPORTANT: capabilityId must match the manifest ID in coreos/manifests/
 */
export const appRegistry: Record<string, ComponentType<AppProps>> = {
    // Core Apps (match manifest IDs)
    'user.manage': createLazyApp(UsersAppLazy),
    'audit.view': createLazyApp(AuditLogsAppLazy),
    'core.settings': createLazyApp(SettingsAppLazy),
    'org.manage': createLazyApp(OrganizationsAppLazy),
    'system.configure': createLazyApp(SystemConfigureAppLazy),

    // Experimental Apps (hidden from Dock)
    'plugin.analytics': createLazyApp(AnalyticsAppLazy),
};

/**
 * Get app component for a capability
 */
export function getAppComponent(capabilityId: string): ComponentType<AppProps> | null {
    return appRegistry[capabilityId] || null;
}

/**
 * Check if an app is registered
 */
export function hasAppComponent(capabilityId: string): boolean {
    return capabilityId in appRegistry;
}
