/**
 * OS Router Store
 * 
 * STEP A1.1: Single-URL OS Shell Navigation State
 * 
 * Manages which "app" is currently active in the OS Shell.
 * This enables single-URL navigation without path-based routing.
 * 
 * Key features:
 * - activeAppId: Which app surface is shown
 * - localStorage persistence: Restore last app on refresh
 * - URL sync: Optional query param for deep linking
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * App IDs for the OS Shell
 * These map to different "windows" or "surfaces" in the OS
 */
export type OSAppId =
    | 'os-home'
    | 'users'
    | 'orgs'
    | 'audit-logs'
    | 'settings';

/**
 * App metadata for registry
 */
export interface OSAppMeta {
    id: OSAppId;
    titleKey: string;        // i18n key for title
    icon: string;            // lucide icon name
    requiresRole?: 'owner' | 'admin' | 'user';
    entitlement?: string;    // Required entitlement (e.g., 'app.audit')
}

/**
 * OS Router State Interface
 */
interface OSRouterState {
    /** Currently active app in the shell */
    activeAppId: OSAppId;

    /** Previously active app (for animations/transitions) */
    previousAppId: OSAppId | null;

    /** Whether an app window is open (for future multi-window support) */
    isWindowOpen: boolean;

    /** Navigation history within the shell (limited to last 10) */
    navigationHistory: OSAppId[];

    /** 
     * STEP 6.4: Per-app scroll positions
     * Key = appId, Value = scroll top in pixels
     */
    scrollPositions: Record<OSAppId, number>;

    /** 
     * Set the active app
     * This is the PRIMARY navigation method within the OS Shell
     */
    setActiveApp: (appId: OSAppId) => void;

    /**
     * Go back to previous app in history
     */
    goBack: () => void;

    /**
     * Close current window and return to OS Home
     */
    closeWindow: () => void;

    /**
     * Check if can go back
     */
    canGoBack: () => boolean;

    /**
     * STEP 6.4: Save scroll position for an app
     */
    setScrollPosition: (appId: OSAppId, scrollTop: number) => void;

    /**
     * STEP 6.4: Get saved scroll position for an app
     */
    getScrollPosition: (appId: OSAppId) => number;
}

/**
 * OS Router Store
 * 
 * Usage:
 * ```tsx
 * const { activeAppId, setActiveApp } = useOSRouter();
 * 
 * // Navigate to Users
 * setActiveApp('users');
 * ```
 */
export const useOSRouter = create<OSRouterState>()(
    persist(
        (set, get) => ({
            activeAppId: 'os-home',
            previousAppId: null,
            isWindowOpen: false,
            navigationHistory: [],
            scrollPositions: {} as Record<OSAppId, number>,

            setActiveApp: (appId: OSAppId) => {
                const current = get().activeAppId;
                const history = get().navigationHistory;

                // Don't push duplicate consecutive entries
                if (current === appId) return;

                // Update history (limit to 10 entries)
                const newHistory = [...history, current].slice(-10);

                set({
                    activeAppId: appId,
                    previousAppId: current,
                    isWindowOpen: appId !== 'os-home',
                    navigationHistory: newHistory,
                });
            },

            goBack: () => {
                const history = get().navigationHistory;
                if (history.length === 0) {
                    // No history, go to OS Home
                    set({
                        activeAppId: 'os-home',
                        previousAppId: get().activeAppId,
                        isWindowOpen: false,
                    });
                    return;
                }

                const previousApp = history[history.length - 1];
                const newHistory = history.slice(0, -1);

                set({
                    activeAppId: previousApp || 'os-home',
                    previousAppId: get().activeAppId,
                    isWindowOpen: previousApp !== 'os-home',
                    navigationHistory: newHistory,
                });
            },

            closeWindow: () => {
                set({
                    activeAppId: 'os-home',
                    previousAppId: get().activeAppId,
                    isWindowOpen: false,
                });
            },

            canGoBack: () => {
                return get().navigationHistory.length > 0;
            },

            // STEP 6.4: Scroll position management
            setScrollPosition: (appId: OSAppId, scrollTop: number) => {
                set((state) => ({
                    scrollPositions: {
                        ...state.scrollPositions,
                        [appId]: scrollTop,
                    },
                }));
            },

            getScrollPosition: (appId: OSAppId) => {
                return get().scrollPositions[appId] || 0;
            },
        }),
        {
            name: 'apicoredata.os.router',
            partialize: (state) => ({
                // Only persist these fields
                activeAppId: state.activeAppId,
                navigationHistory: state.navigationHistory,
                // STEP 6.4: Persist scroll positions
                scrollPositions: state.scrollPositions,
            }),
        }
    )
);

/**
 * Hook to sync URL query param with OS Router state
 * 
 * Usage in v2/page.tsx:
 * ```tsx
 * useOSRouterURLSync();
 * ```
 */
export function parseAppIdFromQuery(query: string | null): OSAppId | null {
    if (!query) return null;

    const validIds: OSAppId[] = ['os-home', 'users', 'orgs', 'audit-logs', 'settings'];
    if (validIds.includes(query as OSAppId)) {
        return query as OSAppId;
    }
    return null;
}

/**
 * App Registry Metadata
 * Maps appId to display info
 */
export const OS_APP_REGISTRY: Record<OSAppId, OSAppMeta> = {
    'os-home': {
        id: 'os-home',
        titleKey: 'v2.sidebar.osHome',
        icon: 'Home',
    },
    'users': {
        id: 'users',
        titleKey: 'v2.sidebar.users',
        icon: 'Users',
        entitlement: 'app.users',
    },
    'orgs': {
        id: 'orgs',
        titleKey: 'v2.sidebar.organizations',
        icon: 'Building2',
        entitlement: 'app.orgs',
    },
    'audit-logs': {
        id: 'audit-logs',
        titleKey: 'v2.sidebar.auditLogs',
        icon: 'ScrollText',
        requiresRole: 'owner',
        entitlement: 'app.audit',
    },
    'settings': {
        id: 'settings',
        titleKey: 'v2.sidebar.settings',
        icon: 'Settings',
        entitlement: 'app.settings',
    },
};
