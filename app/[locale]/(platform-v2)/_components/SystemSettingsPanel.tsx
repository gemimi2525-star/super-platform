/**
 * ═══════════════════════════════════════════════════════════════════════════
 * APICOREDATA OS — System Settings Panel
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * PHASE 7.4 + 7.2.1: OSOverlayPanel-based settings using Core UI components
 * 
 * Sections:
 * - General
 * - Brand
 * - Appearance
 * - Session
 * 
 * PHASE 7.2.1 INTEGRATION:
 * - CoreButton
 * - CoreBadge
 * - CoreDivider
 * - CoreCard
 * 
 * @version 2.0.0 (Core UI Integrated)
 * @date 2026-01-29
 */

'use client';

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from '@/lib/i18n';
import { useCorePreferences } from '@/lib/stores/corePreferencesStore';
import { osBackgrounds, type OSBackgroundPreset } from '@/lib/os-core/appearance';
import {
    OSOverlayPanel,
    OSOverlayPanelHeader,
} from '@/modules/design-system/src/patterns/OSOverlayPanel';
import {
    Settings,
    Sparkles,
    Palette,
    User,
    Upload,
    X,
    Check,
    RotateCcw,
} from 'lucide-react';
import { CoreButton, CoreBadge, CoreDivider, CoreCard } from '@/core-ui';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type SettingsSection = 'general' | 'brand' | 'appearance' | 'session';

export interface SystemSettingsPanelProps {
    isOpen: boolean;
    onClose: () => void;
    initialSection?: SettingsSection;
    locale: string;
}

interface SectionItem {
    id: SettingsSection;
    labelKey: string;
    icon: React.ComponentType<{ className?: string }>;
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTIONS
// ═══════════════════════════════════════════════════════════════════════════

const SECTIONS: SectionItem[] = [
    { id: 'general', labelKey: 'general', icon: Settings },
    { id: 'brand', labelKey: 'brand', icon: Sparkles },
    { id: 'appearance', labelKey: 'appearance', icon: Palette },
    { id: 'session', labelKey: 'session', icon: User },
];

// ═══════════════════════════════════════════════════════════════════════════
// BACKGROUND PRESETS FOR UI
// ═══════════════════════════════════════════════════════════════════════════

const BACKGROUND_PRESETS: { key: OSBackgroundPreset; isDark: boolean }[] = [
    { key: 'default', isDark: false },
    { key: 'white', isDark: false },
    { key: 'light-gray', isDark: false },
    { key: 'gradient-light', isDark: false },
    { key: 'gradient-blue', isDark: false },
    { key: 'gradient-purple', isDark: false },
    { key: 'dark', isDark: true },
    { key: 'midnight', isDark: true },
    { key: 'gradient-dark', isDark: true },
    { key: 'gradient-ocean', isDark: true },
    { key: 'gradient-sunset', isDark: false },
];

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function SystemSettingsPanel({
    isOpen,
    onClose,
    initialSection = 'general',
    locale,
}: SystemSettingsPanelProps) {
    const t = useTranslations('v2.coreSystem.settings');
    const [activeSection, setActiveSection] = useState<SettingsSection>(initialSection);

    // Update active section when initialSection changes
    React.useEffect(() => {
        if (initialSection) {
            setActiveSection(initialSection as SettingsSection);
        }
    }, [initialSection]);

    return (
        <OSOverlayPanel
            isOpen={isOpen}
            onClose={onClose}
            title={t('title')}
            size="xl"
        >
            <div className="flex h-[70vh] max-h-[600px]">
                {/* Sidebar */}
                <nav className="w-48 bg-neutral-50 border-r border-neutral-100 py-2">
                    {SECTIONS.map((section) => {
                        const Icon = section.icon;
                        const isActive = activeSection === section.id;

                        return (
                            <button
                                key={section.id}
                                onClick={() => setActiveSection(section.id)}
                                className={`
                                    w-full flex items-center gap-2.5 px-4 py-2.5
                                    text-sm text-left transition-colors
                                    ${isActive
                                        ? 'bg-white text-blue-600 font-medium shadow-sm border-r-2 border-blue-600'
                                        : 'text-neutral-600 hover:bg-neutral-100'
                                    }
                                `}
                            >
                                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-500' : 'text-neutral-400'}`} />
                                {t(`sections.${section.labelKey}`)}
                            </button>
                        );
                    })}
                </nav>

                {/* Content */}
                <div className="flex-1 flex flex-col">
                    {/* Header */}
                    <OSOverlayPanelHeader
                        title={t('title')}
                        subtitle={t(`sections.${activeSection}`)}
                        onClose={onClose}
                    />

                    {/* Section Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeSection}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.15 }}
                            >
                                {activeSection === 'general' && <GeneralSection locale={locale} />}
                                {activeSection === 'brand' && <BrandSection />}
                                {activeSection === 'appearance' && <AppearanceSection />}
                                {activeSection === 'session' && <SessionSection locale={locale} />}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </OSOverlayPanel>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// GENERAL SECTION
// ═══════════════════════════════════════════════════════════════════════════

function GeneralSection({ locale }: { locale: string }) {
    const t = useTranslations('v2.coreSystem.settings');

    return (
        <div className="space-y-6">
            <CoreCard variant="outlined" padding="md">
                <div className="space-y-4">
                    <div>
                        <h3 className="text-sm font-medium text-neutral-900 mb-1">
                            {t('general.version')}
                        </h3>
                        <p className="text-sm text-neutral-500">
                            Core OS v2.0.0
                        </p>
                    </div>

                    <CoreDivider spacing="sm" />

                    <div>
                        <h3 className="text-sm font-medium text-neutral-900 mb-1">
                            {t('general.environment')}
                        </h3>
                        <CoreBadge
                            variant={process.env.NODE_ENV === 'production' ? 'success' : 'info'}
                            size="sm"
                        >
                            {process.env.NODE_ENV === 'production' ? 'PRODUCTION' : 'DEVELOPMENT'}
                        </CoreBadge>
                    </div>

                    <CoreDivider spacing="sm" />

                    <div>
                        <h3 className="text-sm font-medium text-neutral-900 mb-1">
                            {t('general.locale')}
                        </h3>
                        <p className="text-sm text-neutral-500">
                            {locale === 'en' ? 'English (EN)' : 'ไทย (TH)'}
                        </p>
                    </div>
                </div>
            </CoreCard>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// BRAND SECTION
// ═══════════════════════════════════════════════════════════════════════════

function BrandSection() {
    // Use the new MVP Brand Settings component with localStorage persistence
    const { default: BrandSettingsMVP } = require('@/components/platform/BrandSettingsMVP');
    return <BrandSettingsMVP />;
}

// ═══════════════════════════════════════════════════════════════════════════
// APPEARANCE SECTION
// ═══════════════════════════════════════════════════════════════════════════

function AppearanceSection() {
    const t = useTranslations('v2.coreSystem.settings');
    const { appearance, setBackgroundPreset, resetAppearance } = useCorePreferences();

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-sm font-medium text-neutral-900 mb-3">
                    {t('appearance.desktopBackground')}
                </h3>
                <p className="text-sm text-neutral-500 mb-4">
                    {t('appearance.backgroundDescription')}
                </p>

                {/* Background Grid */}
                <div className="grid grid-cols-4 gap-3">
                    {BACKGROUND_PRESETS.map(({ key, isDark }) => {
                        const bg = osBackgrounds[key];
                        const isActive = appearance.backgroundPreset === key;

                        return (
                            <button
                                key={key}
                                onClick={() => setBackgroundPreset(key)}
                                className={`
                                    relative w-full aspect-video rounded-lg overflow-hidden
                                    border-2 transition-all
                                    ${isActive
                                        ? 'border-blue-500 ring-2 ring-blue-500/20'
                                        : 'border-neutral-200 hover:border-neutral-300'
                                    }
                                `}
                                style={{ background: bg.value }}
                            >
                                {/* Selection indicator */}
                                {isActive && (
                                    <div className="absolute top-1 right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                        <Check className="w-3 h-3 text-white" />
                                    </div>
                                )}

                                {/* Label */}
                                <div className={`
                                    absolute bottom-0 left-0 right-0
                                    text-xs py-1 text-center
                                    ${isDark
                                        ? 'bg-black/30 text-white/80'
                                        : 'bg-white/50 text-neutral-600'
                                    }
                                `}>
                                    {t(`appearance.presets.${key}`)}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Auto Contrast Notice */}
                <CoreCard variant="outlined" padding="sm" style={{ marginTop: 'var(--os-space-4)', backgroundColor: 'var(--os-info-bg)' }}>
                    <p className="text-xs" style={{ color: 'var(--os-info)' }}>
                        <strong>{t('appearance.autoContrastTitle')}:</strong>{' '}
                        {t('appearance.autoContrastDescription')}
                    </p>
                </CoreCard>

                {/* Reset Button */}
                <div style={{ marginTop: 'var(--os-space-4)' }}>
                    <CoreButton
                        variant="ghost"
                        size="sm"
                        iconLeft={<RotateCcw size={14} />}
                        onClick={resetAppearance}
                    >
                        {t('appearance.reset')}
                    </CoreButton>
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// SESSION SECTION
// ═══════════════════════════════════════════════════════════════════════════

function SessionSection({ locale }: { locale: string }) {
    const t = useTranslations('v2.coreSystem.settings');

    return (
        <div className="space-y-6">
            <CoreCard variant="outlined" padding="md">
                <div className="space-y-4">
                    <div>
                        <h3 className="text-sm font-medium text-neutral-900 mb-1">
                            {t('session.status')}
                        </h3>
                        <p className="text-sm text-neutral-500 flex items-center gap-2">
                            <CoreBadge type="dot" variant="success" />
                            {t('session.signedIn')}
                        </p>
                    </div>

                    <CoreDivider spacing="sm" />

                    <div>
                        <h3 className="text-sm font-medium text-neutral-900 mb-1">
                            {t('session.currentLocale')}
                        </h3>
                        <p className="text-sm text-neutral-500">
                            {locale === 'en' ? 'English' : 'ไทย'}
                        </p>
                    </div>

                    <CoreDivider spacing="sm" />

                    <div>
                        <p className="text-xs text-neutral-400">
                            {t('session.preferencesNote')}
                        </p>
                    </div>
                </div>
            </CoreCard>
        </div>
    );
}

export default SystemSettingsPanel;
