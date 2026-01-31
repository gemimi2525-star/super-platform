/**
 * OS Shell Surface Renderer
 * 
 * STEP A1.3: Single Surface Renderer
 * 
 * This component renders the active app surface within the OS Shell.
 * It handles:
 * 1. Rendering OS Home Desktop when activeAppId = 'os-home'
 * 2. Rendering app windows for other apps (users, orgs, audit-logs, etc.)
 * 3. Animating transitions between surfaces
 * 4. URL sync via query params (optional)
 * 
 * PRINCIPLES:
 * - No page navigation (all within single URL)
 * - OS-grade animations (cross-fade)
 * - State persisted in localStorage
 */

'use client';

import React, { useEffect, Suspense, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useOSRouter, parseAppIdFromQuery, type OSAppId } from '@/lib/stores/osRouterStore';
import { OSHomeDesktop } from './OSHomeDesktop';
import { OS_DURATION } from '@/lib/motion/os-motion';

// Dynamic imports for app views
const UsersAppView = React.lazy(() => import('./app-views/UsersAppView'));
const OrgsAppView = React.lazy(() => import('./app-views/OrgsAppView'));
const AuditLogsAppView = React.lazy(() => import('./app-views/AuditLogsAppView'));
const SettingsAppView = React.lazy(() => import('./app-views/SettingsAppView'));

// ═══════════════════════════════════════════════════════════════════════════
// STEP 6.3: NAVIGATION SILENCE — Surface Transition Variants
// 
// PRINCIPLES:
// - Cross-fade is primary (opacity only for exit)
// - Minimal translate (4px max, never scale)
// - Duration: 120-180ms for silence perception
// - No bounce, no spring, no stagger
// ═══════════════════════════════════════════════════════════════════════════
const OS_EASE: [number, number, number, number] = [0.25, 0.1, 0.25, 1.0];

const surfaceVariants = {
    hidden: {
        opacity: 0,
        y: 4,  // Reduced from 8px to 4px for subtlety
        // NO scale - scale causes perceptual "page change"
    },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.15,  // 150ms - faster for silence
            ease: OS_EASE,
        }
    },
    exit: {
        opacity: 0,
        // NO y offset on exit - pure cross-fade for silence
        transition: {
            duration: 0.1,   // 100ms - quick fade out
            ease: OS_EASE,
        }
    },
};

// Loading skeleton for lazy-loaded apps
function AppLoadingSkeleton() {
    return (
        <div className="p-8 animate-pulse">
            <div className="h-8 w-48 bg-neutral-200 rounded mb-4"></div>
            <div className="h-4 w-64 bg-neutral-200 rounded mb-8"></div>
            <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 bg-neutral-100 rounded-lg"></div>
                ))}
            </div>
        </div>
    );
}

// Serializable app data structure (from server)
interface SerializableApp {
    appId: string;
    i18nKey: string;
    iconKey: string;
    basePath: string;
    status: string;
    availability: string;
}

interface OSShellRendererProps {
    // Props passed from Server Component
    apps: SerializableApp[];
    widgetIds: string[];
    widgetCount: number;
    appCount: number;
    userName: string;
    locale: string;
    /** Route base for URL sync (default: /v2, new: /home) */
    routeBase?: string;
}

export function OSShellRenderer({
    apps,
    widgetIds,
    widgetCount,
    appCount,
    userName,
    locale,
    routeBase = '/desktop', // Default to /desktop (canonical route)
}: OSShellRendererProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const { activeAppId, setActiveApp, setScrollPosition, getScrollPosition } = useOSRouter();

    // Track if initial sync has happened
    const [hasInitialSync, setHasInitialSync] = React.useState(false);

    // ═══════════════════════════════════════════════════════════════════════
    // URL SYNC: URL is the SOURCE OF TRUTH
    // 
    // Policy A: No query param = os-home
    // - ?app=users → show users
    // - ?app=audit-logs → show audit-logs  
    // - no ?app= → show os-home (FORCE, overrides localStorage)
    // ═══════════════════════════════════════════════════════════════════════
    useEffect(() => {
        const appParam = searchParams.get('app');
        const parsedAppId = parseAppIdFromQuery(appParam);

        // Debug logging
        console.log('[OS] URL Sync:', {
            urlQuery: appParam,
            parsedAppId,
            storeActiveAppId: activeAppId,
            hasInitialSync,
        });

        if (parsedAppId) {
            // URL has query param → sync to store
            if (parsedAppId !== activeAppId) {
                console.log('[OS] setActiveApp from URL:', parsedAppId);
                setActiveApp(parsedAppId);
            }
        } else {
            // NO query param = force os-home
            // This ensures OS Home click always works (overrides localStorage)
            if (activeAppId !== 'os-home') {
                console.log('[OS] setActiveApp to os-home (no query)');
                setActiveApp('os-home');
            }
        }

        setHasInitialSync(true);
    }, [searchParams]); // Only depend on searchParams to prevent loops

    // ═══════════════════════════════════════════════════════════════════════
    // URL SYNC: Update query param when activeAppId changes (user action)
    // ═══════════════════════════════════════════════════════════════════════
    useEffect(() => {
        // Skip until initial sync is done
        if (!hasInitialSync) return;

        const currentApp = searchParams.get('app');
        const currentParsed = parseAppIdFromQuery(currentApp);

        // Debug logging
        console.log('[OS] Store → URL Sync:', {
            activeAppId,
            currentQuery: currentApp,
            currentParsed,
        });

        // Only update URL if different from current query
        if (activeAppId !== 'os-home' && activeAppId !== currentParsed) {
            // Use replace to avoid polluting history
            const newUrl = `/${locale}${routeBase}?app=${activeAppId}`;
            console.log('[OS] router.replace:', newUrl);
            router.replace(newUrl, { scroll: false });
        } else if (activeAppId === 'os-home' && currentApp) {
            // Remove query param when returning to home
            console.log('[OS] router.replace: clear query');
            router.replace(`/${locale}${routeBase}`, { scroll: false });
        }
    }, [activeAppId, locale, hasInitialSync, routeBase]);

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 6.4: OS MEMORY SYSTEM — Scroll Position Management
    // ═══════════════════════════════════════════════════════════════════════

    // Track previous app for scroll save/restore
    const previousAppRef = useRef<OSAppId | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement | null>(null);
    const scrollSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Find scroll container (parent with overflow)
    const findScrollContainer = useCallback(() => {
        // Look for the main scrollable container
        const container = document.querySelector('.os-workspace-content, [data-scroll-container="true"]');
        return container as HTMLElement | null;
    }, []);

    // Save scroll position with debounce
    const saveScrollPosition = useCallback((appId: OSAppId) => {
        if (scrollSaveTimeoutRef.current) {
            clearTimeout(scrollSaveTimeoutRef.current);
        }

        scrollSaveTimeoutRef.current = setTimeout(() => {
            const container = findScrollContainer();
            if (container) {
                const scrollTop = container.scrollTop;
                if (scrollTop > 0) {
                    console.log('[OS Memory] Saving scroll:', appId, scrollTop);
                    setScrollPosition(appId, scrollTop);
                }
            }
        }, 100); // 100ms debounce
    }, [findScrollContainer, setScrollPosition]);

    // Restore scroll position
    const restoreScrollPosition = useCallback((appId: OSAppId) => {
        const savedPosition = getScrollPosition(appId);
        if (savedPosition > 0) {
            // Use requestAnimationFrame to ensure DOM is ready
            requestAnimationFrame(() => {
                const container = findScrollContainer();
                if (container) {
                    console.log('[OS Memory] Restoring scroll:', appId, savedPosition);
                    container.scrollTop = savedPosition;
                }
            });
        }
    }, [findScrollContainer, getScrollPosition]);

    // Effect: Save scroll on app change, restore on enter
    useEffect(() => {
        const previous = previousAppRef.current;

        // Save scroll for previous app when switching away
        if (previous && previous !== activeAppId) {
            saveScrollPosition(previous);
        }

        // Restore scroll for new app (after short delay for mount)
        setTimeout(() => {
            restoreScrollPosition(activeAppId);
        }, 50);

        // Update previous app ref
        previousAppRef.current = activeAppId;

        // Cleanup timeout on unmount
        return () => {
            if (scrollSaveTimeoutRef.current) {
                clearTimeout(scrollSaveTimeoutRef.current);
            }
        };
    }, [activeAppId, saveScrollPosition, restoreScrollPosition]);

    // Effect: Listen for scroll events to passively save position
    useEffect(() => {
        const container = findScrollContainer();
        if (!container) return;

        let scrollTimeout: ReturnType<typeof setTimeout>;

        const handleScroll = () => {
            // Debounced passive save
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                setScrollPosition(activeAppId, container.scrollTop);
            }, 500); // 500ms debounce for passive saves
        };

        container.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            container.removeEventListener('scroll', handleScroll);
            clearTimeout(scrollTimeout);
        };
    }, [activeAppId, findScrollContainer, setScrollPosition]);

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 6.2: RENDER APP VIEWS (Foreground Layer)
    // Apps are rendered on foreground, Desktop is always in background
    // ═══════════════════════════════════════════════════════════════════════
    const renderForegroundApp = () => {
        switch (activeAppId) {
            case 'users':
                return (
                    <Suspense fallback={<AppLoadingSkeleton />}>
                        <UsersAppView />
                    </Suspense>
                );

            case 'orgs':
                return (
                    <Suspense fallback={<AppLoadingSkeleton />}>
                        <OrgsAppView />
                    </Suspense>
                );

            case 'audit-logs':
                return (
                    <Suspense fallback={<AppLoadingSkeleton />}>
                        <AuditLogsAppView />
                    </Suspense>
                );

            case 'settings':
                return (
                    <Suspense fallback={<AppLoadingSkeleton />}>
                        <SettingsAppView />
                    </Suspense>
                );

            default:
                // os-home or unknown = no foreground app
                return null;
        }
    };

    // Determine if we're showing an app (vs desktop)
    const isAppActive = activeAppId !== 'os-home';
    const foregroundApp = renderForegroundApp();

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 6.2: LAYERED ARCHITECTURE
    // 
    // Layer 0 (Background): Desktop - ALWAYS MOUNTED, never unmounts
    // Layer 1 (Foreground): App Surface - mounts/unmounts with AnimatePresence
    // 
    // This creates the "OS environment" feel where Desktop is the 
    // persistent background and Apps are foreground workspaces.
    // ═══════════════════════════════════════════════════════════════════════
    return (
        <div className="os-shell-layers relative min-h-full">
            {/* ═══════════════════════════════════════════════════════════════
                LAYER 0: DESKTOP BACKGROUND (ALWAYS MOUNTED)
                
                - Never unmounts - Desktop state is always preserved
                - When app active: opacity reduced, pointer-events disabled
                - When returning to desktop: instant reveal (no re-render)
            ═══════════════════════════════════════════════════════════════ */}
            <div
                className={`
                    os-desktop-layer
                    transition-opacity duration-200 ease-out
                    ${isAppActive ? 'pointer-events-none' : ''}
                `}
                style={{
                    // Desktop becomes background when app is active
                    // Fully visible when no app active
                    opacity: isAppActive ? 0 : 1,
                }}
                aria-hidden={isAppActive}
            >
                <OSHomeDesktop
                    userName={userName}
                    locale={locale}
                />
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                LAYER 1: APP FOREGROUND (MOUNTS/UNMOUNTS)
                
                - Apps mount on top of Desktop with AnimatePresence
                - Has OS-grade elevation/shadow
                - When closing app: fade out reveals Desktop beneath
            ═══════════════════════════════════════════════════════════════ */}
            <AnimatePresence mode="wait">
                {foregroundApp && (
                    <motion.div
                        key={activeAppId}
                        className="os-app-layer absolute inset-0"
                        variants={surfaceVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        <div
                            className="os-app-surface os-app-surface--elevated min-h-full"
                            style={{
                                // OS-grade elevation for active apps
                                boxShadow: `
                                    0 0 0 1px rgba(0, 0, 0, 0.03),
                                    0 1px 2px rgba(0, 0, 0, 0.04),
                                    0 4px 8px rgba(0, 0, 0, 0.04),
                                    0 8px 16px rgba(0, 0, 0, 0.02)
                                `,
                                borderRadius: '12px',
                                background: 'white',
                            }}
                        >
                            {foregroundApp}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default OSShellRenderer;
