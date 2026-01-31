'use client';

import React, { useState, useMemo } from 'react';
import { OSAppDefinition } from '@super-platform/core/src/types/os-app';
import { OSAppCard } from './OSAppCard';
import { Input } from '@/modules/design-system/src/components/Input';
import { useTranslations } from '@/lib/i18n';

interface OSAppGridProps {
    apps: OSAppDefinition[];
    locale: string;
}

export const OSAppGrid: React.FC<OSAppGridProps> = ({ apps, locale }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const t = useTranslations('v2.dashboard');

    const filteredApps = useMemo(() => {
        if (!searchQuery.trim()) return apps;

        const query = searchQuery.toLowerCase();
        return apps.filter(app => {
            // Very basic search on appId and i18nKey (in a real app, we'd search translated title)
            // For Phase A, let's search appId and simple key parts
            return app.appId.toLowerCase().includes(query) ||
                app.i18nKey.toLowerCase().includes(query);
        });
    }, [apps, searchQuery]);

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
                    {filteredApps.map(app => (
                        <OSAppCard
                            key={app.appId}
                            app={app}
                            locale={locale}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <div className="text-neutral-400 text-lg mb-2">
                        {t('noAppsFound', { defaultValue: 'No apps found' })}
                    </div>
                    <p className="text-neutral-500 text-sm">
                        {t('tryAdjustingSearch', { defaultValue: 'Try adjusting your search terms' })}
                    </p>
                </div>
            )}
        </div>
    );
};
