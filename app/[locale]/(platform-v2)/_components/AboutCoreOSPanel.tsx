/**
 * ═══════════════════════════════════════════════════════════════════════════
 * APICOREDATA OS — About Core OS Panel
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * PHASE 7.4: Read-only system information panel
 * 
 * @version 1.0.0
 * @date 2026-01-29
 */

'use client';

import React from 'react';
import { useTranslations } from '@/lib/i18n';
import {
    OSOverlayPanel,
    OSOverlayPanelHeader,
    OSOverlayPanelBody,
    OSOverlayPanelFooter,
} from '@/modules/design-system/src/patterns/OSOverlayPanel';
import { ExternalLink } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface AboutCoreOSPanelProps {
    isOpen: boolean;
    onClose: () => void;
    locale: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function AboutCoreOSPanel({
    isOpen,
    onClose,
    locale,
}: AboutCoreOSPanelProps) {
    const t = useTranslations('v2.coreSystem.about');
    const tCommon = useTranslations('common');

    return (
        <OSOverlayPanel
            isOpen={isOpen}
            onClose={onClose}
            title={t('title')}
            size="sm"
        >
            <OSOverlayPanelHeader
                title={t('title')}
                onClose={onClose}
            />

            <OSOverlayPanelBody className="text-center">
                {/* Logo */}
                <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                    <span className="text-white text-3xl font-bold">A</span>
                </div>

                {/* Title */}
                <h2 className="text-xl font-semibold text-neutral-900 mb-1">
                    APICOREDATA Core OS
                </h2>

                {/* Version */}
                <p className="text-sm text-neutral-500 mb-6">
                    {t('version')} 2.0.0
                </p>

                {/* Info Grid */}
                <div className="bg-neutral-50 rounded-lg p-4 text-left space-y-3">
                    <div className="flex justify-between">
                        <span className="text-sm text-neutral-500">{t('environment')}</span>
                        <span className="text-sm font-medium text-neutral-700">
                            {process.env.NODE_ENV === 'production' ? 'Production' : 'Development'}
                        </span>
                    </div>

                    <div className="flex justify-between">
                        <span className="text-sm text-neutral-500">{t('locale')}</span>
                        <span className="text-sm font-medium text-neutral-700">
                            {locale === 'en' ? 'English' : 'ไทย'}
                        </span>
                    </div>

                    <div className="flex justify-between">
                        <span className="text-sm text-neutral-500">{t('session')}</span>
                        <span className="text-sm font-medium text-green-600 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                            {t('sessionActive')}
                        </span>
                    </div>

                    <div className="flex justify-between">
                        <span className="text-sm text-neutral-500">{t('buildDate')}</span>
                        <span className="text-sm font-medium text-neutral-700">
                            2026-01-29
                        </span>
                    </div>
                </div>

                {/* Links */}
                <div className="mt-6 flex justify-center gap-4">
                    <a
                        href="#"
                        className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                        {t('documentation')}
                        <ExternalLink className="w-3 h-3" />
                    </a>
                    <a
                        href="#"
                        className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                        {t('credits')}
                        <ExternalLink className="w-3 h-3" />
                    </a>
                </div>
            </OSOverlayPanelBody>

            <OSOverlayPanelFooter>
                <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                    {tCommon('close')}
                </button>
            </OSOverlayPanelFooter>
        </OSOverlayPanel>
    );
}

export default AboutCoreOSPanel;
