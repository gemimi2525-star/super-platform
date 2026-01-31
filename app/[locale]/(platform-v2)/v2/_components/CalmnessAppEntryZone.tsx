'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * APICOREDATA OS — Calmness App Entry Zone
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * PHASE 7.5 + 7.2.1: App Entry Zone using Core UI
 * 
 * PURPOSE:
 * - Clear path forward — open apps
 * - Search as entry to Core Hub
 * - 3-6 app cards maximum
 * 
 * PHASE 7.2.1 INTEGRATION:
 * - CoreInput (search)
 * - CoreCard (app cards)
 * - CoreIcon
 * - CoreSectionHeader
 * - CoreEmptyState
 * 
 * @version 2.0.0 (Core UI Integrated)
 * @date 2026-01-29
 */

import React, { useState, useMemo } from 'react';
import { motion, type Variants } from 'framer-motion';
import { useTranslations } from '@/lib/i18n';
import { useOSRouter } from '@/lib/stores/osRouterStore';
import { Search, Users, Building2, ClipboardList, Settings, ChevronRight } from 'lucide-react';
import { CoreInput, CoreCard, CoreIcon, CoreEmptyState, CoreSectionHeader } from '@/core-ui';

// ═══════════════════════════════════════════════════════════════════════════
// ANIMATION
// ═══════════════════════════════════════════════════════════════════════════

const cardVariants: Variants = {
    hidden: { opacity: 0, y: 8 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.25,
            ease: [0.25, 0.1, 0.25, 1.0] as const,
        },
    },
};

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05,
            delayChildren: 0.1,
        },
    },
};


// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface SerializableApp {
    appId: string;
    i18nKey: string;
    iconKey: string;
    basePath: string;
    status: string;
    availability: string;
}

interface CalmnessAppEntryZoneProps {
    apps: SerializableApp[];
    locale: string;
    isDark?: boolean;
}

// Icon mapping
const APP_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
    'users': Users,
    'building': Building2,
    'clipboard-list': ClipboardList,
    'settings': Settings,
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function CalmnessAppEntryZone({ apps, locale, isDark = false }: CalmnessAppEntryZoneProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const t = useTranslations('v2.desktop');
    const tApps = useTranslations('v2.desktop.apps');
    const { setActiveApp } = useOSRouter();

    // Filter apps by search (limit to 6 max)
    const displayedApps = useMemo(() => {
        const filtered = apps.filter(app => {
            if (!searchQuery.trim()) return true;
            const query = searchQuery.toLowerCase();
            return app.appId.toLowerCase().includes(query) ||
                app.i18nKey.toLowerCase().includes(query);
        });
        return filtered.slice(0, 6); // Max 6 cards
    }, [apps, searchQuery]);

    // Get app translations
    const getAppText = (app: SerializableApp) => {
        const keyMap: Record<string, string> = {
            'users': 'userManagement',
            'orgs': 'organizations',
            'audit-logs': 'auditLogs',
            'settings': 'settings',
        };
        const key = keyMap[app.appId] || app.appId;
        return {
            title: tApps(key, { defaultValue: app.i18nKey }),
            desc: tApps(`${key}Desc`, { defaultValue: '' }),
        };
    };

    // Handle app click — use OS Router context switch
    const handleAppClick = (e: React.MouseEvent, appId: string) => {
        e.preventDefault();
        // Map to OSAppId
        const osAppId = appId as 'users' | 'orgs' | 'audit-logs' | 'settings';
        setActiveApp(osAppId);
    };

    // Calm Empty State
    if (apps.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                <CoreEmptyState
                    size="md"
                    title={t('calmReady')}
                    subtitle={t('calmStart')}
                />
            </motion.div>
        );
    }

    return (
        <div className="calmness-app-entry">
            {/* Section Header using Core UI */}
            <CoreSectionHeader
                title={t('appsSection')}
                size="sm"
                style={{
                    ...(isDark ? { color: 'rgba(255, 255, 255, 0.4)' } : {}),
                }}
            />

            {/* Search Input using Core UI */}
            <motion.div
                className="mb-8 max-w-md"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
            >
                <CoreInput
                    prefixIcon={<Search size={16} />}
                    placeholder={t('searchApps')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    fullWidth
                    style={{
                        ...(isDark ? {
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            borderColor: 'rgba(255, 255, 255, 0.15)',
                            color: 'white',
                        } : {}),
                    }}
                />
            </motion.div>

            {/* App Cards Grid */}
            {displayedApps.length > 0 ? (
                <motion.div
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    key={searchQuery} // Re-animate on search
                >
                    {displayedApps.map(app => {
                        const IconComponent = APP_ICONS[app.iconKey] || Users;
                        const { title, desc } = getAppText(app);

                        return (
                            <motion.a
                                key={app.appId}
                                href={`/${locale}${app.basePath}`}
                                onClick={(e) => handleAppClick(e, app.appId)}
                                className="no-underline cursor-pointer"
                                variants={cardVariants}
                                whileHover={{ y: -2 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <CoreCard
                                    variant={isDark ? 'glass' : 'default'}
                                    hoverable
                                    clickable
                                    padding="md"
                                    style={{
                                        ...(isDark ? {
                                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                            borderColor: 'rgba(255, 255, 255, 0.1)',
                                        } : {}),
                                    }}
                                >
                                    <div className="flex items-center gap-4">
                                        {/* App Icon */}
                                        <div
                                            className={`
                                                flex-shrink-0 p-3 rounded-xl
                                                transition-colors duration-200
                                                ${isDark
                                                    ? 'bg-white/10 text-white/80'
                                                    : 'bg-neutral-100 text-neutral-600'
                                                }
                                            `}
                                        >
                                            <CoreIcon icon={<IconComponent />} size="md" color="inherit" />
                                        </div>

                                        {/* App Info */}
                                        <div className="flex-1 min-w-0">
                                            <h3
                                                className={`
                                                    text-sm font-medium mb-0.5 truncate
                                                    ${isDark ? 'text-white/90' : 'text-neutral-900'}
                                                `}
                                            >
                                                {title}
                                            </h3>
                                            {desc && (
                                                <p
                                                    className={`
                                                        text-xs truncate
                                                        ${isDark ? 'text-white/50' : 'text-neutral-500'}
                                                    `}
                                                >
                                                    {desc}
                                                </p>
                                            )}
                                        </div>

                                        {/* Arrow Indicator */}
                                        <ChevronRight
                                            className={`
                                                w-4 h-4 flex-shrink-0
                                                opacity-0 group-hover:opacity-100
                                                transition-opacity duration-200
                                                ${isDark ? 'text-white/40' : 'text-neutral-400'}
                                            `}
                                        />
                                    </div>
                                </CoreCard>
                            </motion.a>
                        );
                    })}
                </motion.div>
            ) : (
                /* No Results — Calm */
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <CoreEmptyState
                        size="sm"
                        title={t('noAppsFound')}
                    />
                </motion.div>
            )}
        </div>
    );
}

export default CalmnessAppEntryZone;
