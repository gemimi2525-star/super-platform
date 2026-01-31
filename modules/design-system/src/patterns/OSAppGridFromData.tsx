'use client';

/**
 * OS App Grid From Data Component
 * 
 * Client-side app grid that renders from serializable data.
 * Supports i18n translations for app titles and descriptions.
 * 
 * Part of OS BASE LOCK - Full i18n Coverage
 */

import React, { useState, useMemo } from 'react';
import { Input } from '@/modules/design-system/src/components/Input';
import { useTranslations } from '@/lib/i18n';
import { Badge } from '@/modules/design-system/src/components/Badge';

// Serializable app data structure
interface SerializableApp {
    appId: string;
    i18nKey: string;
    iconKey: string;
    basePath: string;
    status: string;
    availability: string;
}

interface OSAppGridFromDataProps {
    apps: SerializableApp[];
    locale: string;
}

// Simple Icons map
const ICONS: Record<string, string> = {
    'users': '👥',
    'building': '🏢',
    'clipboard-list': '📋',
    'settings': '⚙️',
    'default': '📦'
};

export const OSAppGridFromData: React.FC<OSAppGridFromDataProps> = ({ apps, locale }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const t = useTranslations('v2.dashboard');
    const tApps = useTranslations('v2.dashboard.apps');

    const filteredApps = useMemo(() => {
        if (!searchQuery.trim()) return apps;

        const query = searchQuery.toLowerCase();
        return apps.filter(app => {
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
            'audit-logs': 'auditLogs', // Handle both formats
            'settings': 'settings',
        };

        const appKey = app.appId.replace('app.', '');
        const titleKey = titleKeyMap[appKey] || appKey;
        const descKey = `${titleKey}Desc`;

        const title = tApps(titleKey, { defaultValue: app.i18nKey });
        const description = tApps(descKey, { defaultValue: `Access ${title} features` });

        return { title, description };
    };

    return (
        <div className="w-full">
            {/* Search Bar */}
            <div className="mb-8 max-w-md mx-auto">
                <Input
                    placeholder={t('searchApps')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                />
            </div>

            {/* Grid */}
            {filteredApps.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredApps.map(app => {
                        const iconChar = ICONS[app.iconKey] || ICONS['default'];
                        const { title, description } = getAppTranslations(app);
                        const isBeta = app.availability === 'beta';

                        return (
                            <a
                                key={app.appId}
                                href={`/${locale}${app.basePath}`}
                                className="group block p-6 bg-white border border-neutral-200 rounded-xl shadow-sm hover:shadow-md hover:border-neutral-300 transition-all duration-200 no-underline"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-12 h-12 rounded-lg bg-neutral-50 border border-neutral-100 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform duration-200">
                                        {iconChar}
                                    </div>
                                    {isBeta && (
                                        <Badge variant="warning" size="sm">BETA</Badge>
                                    )}
                                </div>

                                <h3 className="text-base font-semibold text-neutral-900 mb-1 group-hover:text-primary-600 transition-colors">
                                    {title}
                                </h3>
                                <p className="text-sm text-neutral-500 line-clamp-2">
                                    {description}
                                </p>
                            </a>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-12">
                    <div className="text-neutral-400 text-lg mb-2">
                        {t('noAppsFound')}
                    </div>
                    <p className="text-neutral-500 text-sm">
                        {t('tryAdjustingSearch')}
                    </p>
                </div>
            )}
        </div>
    );
};
