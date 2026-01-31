'use client';

/**
 * Dashboard Content Component
 * 
 * Client component for rendering dashboard with i18n support.
 * Part of OS BASE LOCK - Full i18n Coverage
 * 
 * Note: Only serializable data is passed from server.
 * Widget rendering and app data is resolved client-side.
 */

import React from 'react';
import { useTranslations } from '@/lib/i18n';
import { OSWidgetGrid } from '@/modules/design-system/src/patterns/OSWidgetGrid';
import { OSAppGridFromData } from '@/modules/design-system/src/patterns/OSAppGridFromData';

// Serializable app data structure (matches server-side)
interface SerializableApp {
    appId: string;
    i18nKey: string;
    iconKey: string;
    basePath: string;
    status: string;
    availability: string;
}

interface DashboardContentProps {
    apps: SerializableApp[];
    widgetIds: string[];
    widgetCount: number;
    appCount: number;
    userName: string;
    locale: string;
}

export function DashboardContent({ apps, widgetIds, widgetCount, appCount, userName, locale }: DashboardContentProps) {
    const t = useTranslations('v2.dashboard');

    // Extract username from email (e.g., "admin" from "admin@apicoredata.com")
    const displayName = userName?.split('@')[0] || 'User';

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header with i18n */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-neutral-900">
                    {t('welcome', { name: displayName })}
                </h1>
                <p className="text-sm text-neutral-500">
                    {t('controlCenter')}
                </p>
            </div>

            {/* --- Widget Layer --- */}
            <OSWidgetGrid widgetIds={widgetIds} />

            {/* --- Divider --- */}
            {widgetCount > 0 && appCount > 0 && (
                <div className="my-8 border-t border-neutral-100" />
            )}

            {/* --- Launcher Layer --- */}
            <div className="mb-4">
                <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-4 px-1">
                    {t('applications')}
                </h2>
                <OSAppGridFromData
                    apps={apps}
                    locale={locale}
                />
            </div>
        </div>
    );
}

