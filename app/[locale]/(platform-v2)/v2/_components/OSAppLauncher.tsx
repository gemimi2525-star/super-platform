'use client';

/**
 * OS App Launcher Component
 * 
 * Renders the Apps zone on the OS Home Desktop.
 * The main way users launch applications in APICOREDATA OS.
 * 
 * STEP 2: Added Framer Motion for OS-grade feel
 * - App cards: hover lift + glow, tap press-in
 * - Icon: subtle scale on hover
 * - Grid: staggered entrance
 * - Search: macOS-style focus ring
 * 
 * RESPONSIBILITY: Apps Zone
 * - Search apps (client-side filter)
 * - App Grid (from serializable registry data)
 * - Empty/No results state
 * - Click → route to app workspace
 * 
 * PRINCIPLES:
 * - Apps from Registry only (via serialized props)
 * - Entitlement-filtered (done on server)
 * - Full i18n support (EN/TH)
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/modules/design-system/src/components/Input';
import { useTranslations } from '@/lib/i18n';
import { Badge } from '@/modules/design-system/src/components/Badge';
import {
    staggerContainer,
    staggerItem,
    appCardVariants,
    iconHoverVariants,
} from '@/lib/motion/os-motion';

// Serializable app data structure
interface SerializableApp {
    appId: string;
    i18nKey: string;
    iconKey: string;
    basePath: string;
    status: string;
    availability: string;
}

interface OSAppLauncherProps {
    apps: SerializableApp[];
    locale: string;
}

// Icon mapping (emoji for now, can upgrade to SVG icons later)
const APP_ICONS: Record<string, string> = {
    'users': '👥',
    'building': '🏢',
    'clipboard-list': '📋',
    'settings': '⚙️',
    'default': '📦'
};

export function OSAppLauncher({ apps, locale }: OSAppLauncherProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const t = useTranslations('v2.desktop');
    const tApps = useTranslations('v2.desktop.apps');

    // Client-side search filter
    const filteredApps = useMemo(() => {
        if (!searchQuery.trim()) return apps;

        const query = searchQuery.toLowerCase();
        return apps.filter(app => {
            // Search by appId and i18nKey
            return app.appId.toLowerCase().includes(query) ||
                app.i18nKey.toLowerCase().includes(query);
        });
    }, [apps, searchQuery]);

    // Get translated title and description for an app
    const getAppTranslations = (app: SerializableApp) => {
        const titleKeyMap: Record<string, string> = {
            'users': 'userManagement',
            'orgs': 'organizations',
            'audit': 'auditLogs',
            'audit-logs': 'auditLogs',
            'settings': 'settings',
        };

        const appKey = app.appId.replace('app.', '');
        const titleKey = titleKeyMap[appKey] || appKey;
        const descKey = `${titleKey}Desc`;

        const title = tApps(titleKey, { defaultValue: app.i18nKey });
        const description = tApps(descKey, { defaultValue: '' });

        return { title, description };
    };

    return (
        <section className="w-full">
            {/* Section Header */}
            <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-4 px-1">
                {t('appsSection')}
            </h2>

            {/* Search Bar with macOS-style focus ring */}
            <div className="mb-8 max-w-md mx-auto">
                <motion.div
                    animate={{
                        boxShadow: isFocused
                            ? '0 0 0 3px rgba(59, 130, 246, 0.15)'
                            : '0 0 0 0px rgba(59, 130, 246, 0)',
                    }}
                    transition={{ duration: 0.15 }}
                    className="rounded-lg"
                >
                    <Input
                        placeholder={t('searchApps')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        className="w-full"
                    />
                </motion.div>
            </div>

            {/* App Grid with staggered entrance */}
            {filteredApps.length > 0 ? (
                <motion.div
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                    key={searchQuery} // Re-animate on search change
                >
                    {filteredApps.map(app => {
                        const iconChar = APP_ICONS[app.iconKey] || APP_ICONS['default'];
                        const { title, description } = getAppTranslations(app);
                        const isBeta = app.availability === 'beta';

                        return (
                            <motion.a
                                key={app.appId}
                                href={`/${locale}${app.basePath}`}
                                className="block p-6 bg-white border border-neutral-200 rounded-xl no-underline cursor-pointer"
                                variants={staggerItem}
                                initial="idle"
                                whileHover="hover"
                                whileTap="tap"
                                style={{
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                                }}
                            >
                                {/* App Icon + Badge */}
                                <div className="flex items-start justify-between mb-4">
                                    <motion.div
                                        className="w-12 h-12 rounded-lg bg-neutral-50 border border-neutral-100 flex items-center justify-center text-2xl"
                                        variants={iconHoverVariants}
                                    >
                                        {iconChar}
                                    </motion.div>
                                    {isBeta && (
                                        <Badge variant="warning" size="sm">BETA</Badge>
                                    )}
                                </div>

                                {/* App Title */}
                                <h3 className="text-base font-semibold text-neutral-900 mb-1">
                                    {title}
                                </h3>

                                {/* App Description */}
                                {description && (
                                    <p className="text-sm text-neutral-500 line-clamp-2">
                                        {description}
                                    </p>
                                )}
                            </motion.a>
                        );
                    })}
                </motion.div>
            ) : (
                /* Empty State with fade-in */
                <motion.div
                    className="text-center py-12"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                >
                    <div className="text-neutral-400 text-lg mb-2">
                        {t('noAppsFound')}
                    </div>
                    <p className="text-neutral-500 text-sm">
                        {t('tryAdjustingSearch')}
                    </p>
                </motion.div>
            )}
        </section>
    );
}

