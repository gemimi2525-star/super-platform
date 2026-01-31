'use client';

import React from 'react';
import type { OSAppDefinition } from '@super-platform/core/src/types/os-app';
import { Badge } from '@/modules/design-system/src/components/Badge';
import { useTranslations } from '@/lib/i18n';

// Simple Icons map (Fallback/Placeholder)
// In a real system, these would be SVG imports or a dynamic icon component
const ICONS: Record<string, string> = {
    'users': '👥',
    'building': '🏢',
    'clipboard-list': '📋',
    'settings': '⚙️',
    'default': '📦'
};

interface OSAppCardProps {
    app: OSAppDefinition;
    locale: string;
}

export const OSAppCard: React.FC<OSAppCardProps> = ({ app, locale }) => {
    // Use real translations
    const t = useTranslations('v2.dashboard.apps');

    // Determine status style
    const isMaintenance = app.lifecycle.status === 'hidden'; // Shouldn't happen if filtered, but safe check
    const isBeta = app.entitlement.availability === 'beta';

    const iconChar = ICONS[app.iconKey] || ICONS['default'];

    // Map app IDs to translation keys
    const titleKeyMap: Record<string, string> = {
        'users': 'userManagement',
        'orgs': 'organizations',
        'audit': 'auditLogs',
        'settings': 'settings',
    };

    const appKey = app.appId.replace('app.', '');
    const titleKey = titleKeyMap[appKey] || appKey;
    const descKey = `${titleKey}Desc`;

    // Get translations with fallbacks
    const title = t(titleKey, { defaultValue: app.i18nKey });
    const description = t(descKey, { defaultValue: `Access ${title} features` });

    return (
        <a
            href={`/${locale}${app.mount.basePath}`}
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
};
