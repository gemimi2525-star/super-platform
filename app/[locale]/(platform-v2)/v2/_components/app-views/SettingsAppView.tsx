/**
 * Settings App View
 * 
 * STEP A1.2: Placeholder for Settings functionality
 */

'use client';

import React from 'react';
import { useTranslations } from '@/lib/i18n';
import { Settings } from 'lucide-react';

function SettingsAppView() {
    const t = useTranslations('v2.settings');

    return (
        <div className="p-8">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-neutral-100 rounded-xl flex items-center justify-center">
                    <Settings className="w-6 h-6 text-neutral-600" />
                </div>
                <div>
                    <h1 className="text-2xl font-semibold text-neutral-900">
                        {t('title')}
                    </h1>
                    <p className="text-neutral-500">
                        {t('subtitle')}
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-lg border border-neutral-200 p-8 text-center">
                <p className="text-neutral-500">
                    Settings page coming soon...
                </p>
            </div>
        </div>
    );
}

export default SettingsAppView;
