'use client';

/**
 * OS Sidebar Component (Single-URL Shell Mode)
 * 
 * STEP A1.4: Updated for Single-URL OS Shell navigation
 * 
 * Changes from path-based:
 * - Uses OS Router store instead of path navigation
 * - Sidebar items call setActiveApp() instead of href navigation
 * - URL is updated via query param only (no path changes)
 * - Active state derived from OS Router, not pathname
 * - Preserves all existing UX: prefetch, animations, collapse
 * 
 * OS Chrome rules:
 * - Never re-mount during navigation
 * - No distracting animations
 * - Clear active state highlight
 */

import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import type { ResolvedNavigation } from '@super-platform/core/src/os/navigation/resolve-navigation';
import { usePathname, useRouter } from 'next/navigation';
import { Home } from 'lucide-react';
import { useOSRouter, type OSAppId } from '@/lib/stores/osRouterStore';

export interface OSSidebarProps {
    navigation: ResolvedNavigation;
    locale: string;
}

/**
 * Map from navigation path to OSAppId
 */
function pathToAppId(path: string): OSAppId | null {
    const map: Record<string, OSAppId> = {
        '/v2': 'os-home',
        '/v2/users': 'users',
        '/v2/orgs': 'orgs',
        '/v2/audit-logs': 'audit-logs',
        '/v2/settings': 'settings',
    };
    return map[path] || null;
}

export const OSSidebar: React.FC<OSSidebarProps> = ({ navigation, locale }) => {
    const pathname = usePathname();
    const router = useRouter();
    const { activeAppId, setActiveApp } = useOSRouter();

    // Check if we're on OS Home (Desktop)
    // In Single-URL mode, check activeAppId instead of pathname
    const isOnDesktop = activeAppId === 'os-home';

    // STEP 6.1: App Focus Layer
    // When an app is active (not desktop), de-emphasize non-active sidebar items
    // This creates the perception that the app is the foreground focus
    const isAppActive = !isOnDesktop;

    // Check if we're within the OS Shell (on /home or /v2 path)
    // Support both new /home and legacy /v2 during migration
    const isInOSShell = pathname === `/${locale}/home` ||
        pathname === `/${locale}/home/` ||
        pathname.startsWith(`/${locale}/home?`) ||
        pathname === `/${locale}/v2` ||
        pathname === `/${locale}/v2/` ||
        pathname.startsWith(`/${locale}/v2?`);

    // Determine active state based on:
    // 1. OS Router state (if in shell)
    // 2. Pathname (if on legacy routes for compatibility)
    const isActive = useCallback((path: string) => {
        const appId = pathToAppId(path);

        // If in OS Shell, use OS Router state
        if (isInOSShell && appId) {
            return activeAppId === appId;
        }

        // Fallback: path-based for compatibility routes
        const pathWithoutLocale = pathname.replace(new RegExp(`^/${locale}`), '');
        return pathWithoutLocale === path || pathWithoutLocale.startsWith(`${path}/`);
    }, [activeAppId, isInOSShell, pathname, locale]);

    // Helper to translate i18n keys based on current locale
    const t = (key: string) => {
        const translations: Record<string, Record<string, string>> = {
            en: {
                'apps.users.nav.list': 'Users',
                'apps.orgs.nav.list': 'Organizations',
                'apps.audit.nav.list': 'Audit Logs',
                'apps.settings.nav.general': 'Settings',
                'nav.group.workspace': 'Workspace',
                'nav.group.system': 'System',
                'v2.sidebar.osHome': 'OS Home',
            },
            th: {
                'apps.users.nav.list': 'ผู้ใช้',
                'apps.orgs.nav.list': 'องค์กร',
                'apps.audit.nav.list': 'บันทึกการใช้งาน',
                'apps.settings.nav.general': 'ตั้งค่า',
                'nav.group.workspace': 'พื้นที่ทำงาน',
                'nav.group.system': 'ระบบ',
                'v2.sidebar.osHome': 'เดสก์ท็อป',
            },
        };

        const localeMap = translations[locale] || translations.en;
        return localeMap[key] || translations.en[key] || key;
    };

    // Handle navigation item click
    // In Single-URL mode: call setActiveApp instead of href navigation
    const handleNavClick = useCallback((e: React.MouseEvent, path: string) => {
        const appId = pathToAppId(path);

        // If we can map to an appId and we're in the shell, use OS Router
        if (appId && isInOSShell) {
            e.preventDefault();
            setActiveApp(appId);
        }
        // Otherwise, let the default link behavior work (for compatibility)
    }, [isInOSShell, setActiveApp]);

    // Handle OS Home click
    const handleOSHomeClick = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setActiveApp('os-home');
    }, [setActiveApp]);

    // Prefetch routes on hover for instant navigation feel
    // Still useful for the fallback path navigation
    const handlePrefetch = (path: string) => {
        router.prefetch(`/${locale}${path}`);
    };

    // Render nav item with Framer Motion
    // STEP 6.1: Implements de-emphasis for inactive items when app is active
    const renderItem = (item: any) => {
        const active = isActive(item.path);
        const href = `/${locale}${item.path}`;

        // STEP 6.1: App Focus Layer
        // When an app is active, non-active items get subtle de-emphasis
        // This makes the active app feel like the foreground focus
        const deEmphasis = isAppActive && !active;

        return (
            <motion.a
                key={item.id}
                href={href}
                onClick={(e) => handleNavClick(e, item.path)}
                onMouseEnter={() => handlePrefetch(item.path)}
                className={`
                    flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md mb-1 no-underline relative cursor-pointer
                    transition-opacity duration-200 ease-out
                    ${active
                        ? 'text-neutral-900'
                        : 'text-neutral-600'
                    }
                `}
                whileHover={{
                    backgroundColor: active ? 'rgb(245, 245, 245)' : 'rgb(250, 250, 250)',
                    opacity: 1,
                    transition: { duration: 0.12 }
                }}
                whileTap={{ scale: 0.98 }}
                style={{
                    backgroundColor: active ? 'rgb(245, 245, 245)' : 'transparent',
                    // Subtle de-emphasis: reduce opacity for inactive items when app is active
                    // Not too much (0.6-0.7) so items remain accessible
                    opacity: deEmphasis ? 0.65 : 1,
                }}
            >
                {/* Active indicator bar */}
                {active && (
                    <motion.div
                        layoutId="activeIndicator"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-neutral-900 rounded-full"
                        initial={false}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                )}

                {item.type === 'link' && (
                    <span className="pl-1">{t(item.i18nKey)}</span>
                )}
            </motion.a>
        );
    };

    return (
        <div className="p-4 flex flex-col h-full">
            {/* OS Home Item - Always at top */}
            {/* STEP 6.1: De-emphasize when app is active (not on desktop) */}
            <motion.a
                href={`/${locale}/v2`}
                onClick={handleOSHomeClick}
                onMouseEnter={() => handlePrefetch('/v2')}
                className={`
                    flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md mb-3 no-underline relative cursor-pointer
                    transition-opacity duration-200 ease-out
                    ${isOnDesktop
                        ? 'text-neutral-900 bg-neutral-100'
                        : 'text-neutral-600 hover:bg-neutral-50'
                    }
                `}
                whileHover={{
                    backgroundColor: isOnDesktop ? 'rgb(245, 245, 245)' : 'rgb(250, 250, 250)',
                    opacity: 1,
                    transition: { duration: 0.12 }
                }}
                whileTap={{ scale: 0.98 }}
                style={{
                    // De-emphasize OS Home when an app is active
                    opacity: isAppActive ? 0.65 : 1,
                }}
            >
                {/* Active indicator bar */}
                {isOnDesktop && (
                    <motion.div
                        layoutId="activeIndicator"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-neutral-900 rounded-full"
                        initial={false}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                )}
                <Home className="w-4 h-4" />
                <span>{t('v2.sidebar.osHome')}</span>
            </motion.a>

            {/* Divider before navigation */}
            <div className="border-t border-neutral-100 mb-3" />

            <nav className="flex-1 overflow-y-auto">
                {/* Ungrouped Items */}
                {navigation.ungroupedItems.length > 0 && (
                    <div className="mb-4">
                        {navigation.ungroupedItems.map(renderItem)}
                    </div>
                )}

                {/* Groups */}
                {/* STEP 6.1: Group labels also get subtle de-emphasis when app is active */}
                {navigation.groups.map(group => (
                    <div key={group.id} className="mb-4">
                        <div
                            className="px-3 py-1.5 text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1 transition-opacity duration-200 ease-out"
                            style={{
                                opacity: isAppActive ? 0.5 : 1,
                            }}
                        >
                            {t(group.i18nKey)}
                        </div>
                        {group.items.map(renderItem)}
                    </div>
                ))}
            </nav>

            {/* Version footer */}
            <div className="mt-auto px-3 py-2 border-t border-neutral-100">
                <div className="text-xs text-neutral-400">
                    v{process.env.NEXT_PUBLIC_APP_VERSION || '2.0.0'}
                </div>
            </div>
        </div>
    );
};
