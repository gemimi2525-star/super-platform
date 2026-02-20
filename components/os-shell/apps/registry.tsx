/**
 * ═══════════════════════════════════════════════════════════════════════════
 * OS SHELL — App Registry
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Maps capabilityId to React component for rendering inside windows.
 * 
 * Phase 9: Added Intent Browser, updated styling to NEXUS tokens.
 * Phase 9.1: Added SSOT enforcement and AppUnavailable fallback.
 * 
 * ⚠️ IMPORTANT: Registry MUST NOT contain duplicate keys.
 * ⚠️ Each capabilityId should have exactly ONE entry.
 * ⚠️ Use manifest.ts for visibility control, not registry manipulation.
 * 
 * @module components/os-shell/apps/registry
 * @version 2.1.0 (Phase 9.1)
 */

import React, { lazy, Suspense, type ComponentType } from 'react';
import type { CapabilityId } from '@/governance/synapse';
import '@/styles/nexus-tokens.css';
import { APP_MANIFESTS } from './manifest';

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

const ExplorerAppLazy = lazy(() =>
    import('./explorer/ExplorerApp').then(m => ({ default: m.ExplorerApp }))
);

// Phase 26A → 39F: Ops Center (replaces legacy OpsCenterMVP)
const MonitorHubAppLazy = lazy(() =>
    import('./ops/MonitorHubApp').then(m => ({ default: m.MonitorHubApp }))
);

// Phase 9: Intent Browser
const IntentBrowserAppLazy = lazy(() =>
    import('./browser/IntentBrowserApp').then(m => ({ default: m.IntentBrowserApp }))
);

// Phase 9.1: App Unavailable Fallback
const AppUnavailableLazy = lazy(() =>
    import('./AppUnavailable').then(m => ({ default: m.AppUnavailable }))
);

// Phase 39: Brain Assistant
const BrainAppLazy = lazy(() =>
    import('./brain/BrainApp').then(m => ({ default: m.BrainApp }))
);

// Phase 16A: Notes (VFS Consumer)
const NotesAppLazy = lazy(() =>
    import('./notes/NotesApp').then(m => ({ default: m.NotesApp }))
);

// Phase 27A: System Hub (Control Plane Consolidation)
const SystemHubAppLazy = lazy(() =>
    import('./system-hub/SystemHubApp').then(m => ({ default: m.SystemHubApp }))
);

// Phase 18: Notification Center
const NotificationCenterAppLazy = lazy(() =>
    import('@/coreos/notifications/ui/NotificationCenterView').then(m => ({ default: m.NotificationCenterView }))
);

// ═══════════════════════════════════════════════════════════════════════════
// LOADING PLACEHOLDER
// ═══════════════════════════════════════════════════════════════════════════

function LoadingPlaceholder() {
    return (
        <div style={{
            padding: 'var(--nx-space-6)',
            color: 'var(--nx-text-secondary)',
            textAlign: 'center',
            fontFamily: 'var(--nx-font-system)',
            fontSize: 'var(--nx-text-body)',
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

// ═══════════════════════════════════════════════════════════════════════════
// APP REGISTRY — SSOT (Single Source of Truth)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Registry mapping capabilityId to app component.
 * 
 * ⚠️ SSOT RULES (Phase 9.1):
 * - Registry MUST NOT contain duplicate keys
 * - Each capabilityId should have exactly ONE entry
 * - Visibility is controlled by manifest.ts, NOT by registry manipulation
 * - See: components/os-shell/apps/manifest.ts for shell manifests
 */
export const appRegistry: Record<string, ComponentType<AppProps>> = {
    // ─────────────────────────────────────────────────────────────────────────
    // CORE APPS
    // ─────────────────────────────────────────────────────────────────────────

    'core.settings': createLazyApp(SettingsAppLazy),
    // Phase 38: Removed system.explorer + core.files (dead aliases → ExplorerApp)
    'core.finder': createLazyApp(ExplorerAppLazy), // Phase 15A: VFS Finder (canonical)
    'core.notes': createLazyApp(NotesAppLazy), // Phase 16A: Notes (VFS Consumer)
    'brain.assist': createLazyApp(BrainAppLazy),

    // ─────────────────────────────────────────────────────────────────────────
    // ADMIN APPS
    // ─────────────────────────────────────────────────────────────────────────

    'user.manage': createLazyApp(UsersAppLazy),
    'audit.view': createLazyApp(AuditLogsAppLazy),
    'org.manage': createLazyApp(OrganizationsAppLazy),
    'system.configure': createLazyApp(SystemConfigureAppLazy),

    // ─────────────────────────────────────────────────────────────────────────
    // OPS CENTER (Phase 26A → 39F: Canonicalized naming)
    // ─────────────────────────────────────────────────────────────────────────

    'ops.center': createLazyApp(MonitorHubAppLazy), // Phase 26A: Shared mirror views

    // ─────────────────────────────────────────────────────────────────────────
    // SYSTEM HUB (Phase 27A — consolidates Settings/Config/Users/Orgs)
    // ─────────────────────────────────────────────────────────────────────────

    'system.hub': createLazyApp(SystemHubAppLazy),

    // ─────────────────────────────────────────────────────────────────────────
    // UTILITY APPS (Phase 9)
    // ─────────────────────────────────────────────────────────────────────────

    'intent.browser': createLazyApp(IntentBrowserAppLazy),

    // ─────────────────────────────────────────────────────────────────────────
    // EXPERIMENTAL APPS (hidden from Dock)
    // ─────────────────────────────────────────────────────────────────────────

    'plugin.analytics': createLazyApp(AnalyticsAppLazy),

    // ─────────────────────────────────────────────────────────────────────────
    // NOTIFICATION CENTER (Phase 18)
    // ─────────────────────────────────────────────────────────────────────────

    'system.notifications': createLazyApp(NotificationCenterAppLazy),
};

// ═══════════════════════════════════════════════════════════════════════════
// REGISTRY HELPERS WITH SSOT ENFORCEMENT
// ═══════════════════════════════════════════════════════════════════════════

/** Lazy-loaded AppUnavailable fallback */
const AppUnavailableComponent = createLazyApp(AppUnavailableLazy);

/**
 * Get app component for a capability.
 * 
 * Phase 9.1: If manifest exists but component doesn't, returns AppUnavailable
 * instead of null (prevents crash, shows informational window).
 */
export function getAppComponent(capabilityId: string): ComponentType<AppProps> | null {
    const component = appRegistry[capabilityId];

    if (component) {
        return component;
    }

    // Check if manifest exists — if so, show "App Unavailable" fallback
    const manifest = APP_MANIFESTS[capabilityId];
    if (manifest) {
        console.warn(
            `[Registry] App "${manifest.name}" (${capabilityId}) has manifest but no component. Showing fallback.`
        );
        return AppUnavailableComponent;
    }

    // No manifest, no component — truly unknown app
    return null;
}

/**
 * Check if an app is registered (has component in registry).
 */
export function hasAppComponent(capabilityId: string): boolean {
    return capabilityId in appRegistry;
}

/**
 * Check if an app can be opened (has component OR manifest with fallback).
 */
export function canOpenApp(capabilityId: string): boolean {
    return hasAppComponent(capabilityId) || APP_MANIFESTS[capabilityId] !== undefined;
}

/**
 * Get all registered app IDs.
 */
export function getRegisteredAppIds(): string[] {
    return Object.keys(appRegistry);
}

