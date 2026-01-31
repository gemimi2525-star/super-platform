'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * APICOREDATA OS — Core Desktop (Calm Space)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * PHASE 7.5: Pure Desktop Experience
 * 
 * MENTAL MODEL:
 * - This is a WORKSPACE, not a dashboard
 * - Calm, quiet, focused
 * - No charts, no KPIs, no marketing
 * - Entry point for apps
 * 
 * STATES:
 * - Empty: Welcome message only
 * - Active: Shows recent apps (coming soon)
 * 
 * (Lock Screen is handled separately by LockScreenOverlay)
 * 
 * DESIGN RULES:
 * - No brand in desktop (Brand is in Header only)
 * - No heavy animations
 * - Auto-contrast based on background
 * - Desktop = "พื้นที่เปิด app" เท่านั้น
 * 
 * @version 2.0.0 (Calm OS)
 * @date 2026-01-29
 */

import React from 'react';
import { motion, type Variants } from 'framer-motion';
import { useTranslations } from '@/lib/i18n';
import { useCorePreferences } from '@/lib/stores/corePreferencesStore';
import { useOSRouter, type OSAppId } from '@/lib/stores/osRouterStore';
import { osBackgrounds, type OSBackgroundPreset } from '@/lib/os-core/appearance';
import { CoreAppIcon } from '@/core-ui';
import { Users, Building2, ClipboardList, Settings } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// ANIMATION VARIANTS — Gentle, calm entrance (≤120ms feel)
// ═══════════════════════════════════════════════════════════════════════════

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            duration: 0.12,
            ease: [0.25, 0.1, 0.25, 1.0],
        },
    },
};

const contentVariants: Variants = {
    hidden: { opacity: 0, y: 4 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.15,
            ease: [0.25, 0.1, 0.25, 1.0],
        },
    },
};

// ═══════════════════════════════════════════════════════════════════════════
// APP ICON MAPPING
// ═══════════════════════════════════════════════════════════════════════════

const APP_ICONS: Record<string, React.ReactNode> = {
    'users': <Users size={24} />,
    'orgs': <Building2 size={24} />,
    'audit-logs': <ClipboardList size={24} />,
    'settings': <Settings size={24} />,
};

const APP_LABELS: Record<string, { en: string; th: string }> = {
    'users': { en: 'Users', th: 'ผู้ใช้' },
    'orgs': { en: 'Organizations', th: 'องค์กร' },
    'audit-logs': { en: 'Audit Logs', th: 'บันทึก' },
    'settings': { en: 'Settings', th: 'ตั้งค่า' },
};

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface OSHomeDesktopProps {
    userName?: string;
    locale?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function OSHomeDesktop({
    userName = 'User',
    locale = 'en'
}: OSHomeDesktopProps) {
    const t = useTranslations('v2.desktop');
    const { appearance, recentApps } = useCorePreferences();
    const { setActiveApp } = useOSRouter();

    // Extract display name
    const displayName = userName?.split('@')[0] || 'User';

    // Get background from preferences
    const bgKey = (appearance?.backgroundPreset || 'gradient-light') as OSBackgroundPreset;
    const bg = osBackgrounds[bgKey] || osBackgrounds['gradient-light'];
    const isDark = bg.isDark;

    // Get time-based greeting
    const currentHour = new Date().getHours();
    const greetingKey = currentHour < 12 ? 'greetingMorning' :
        currentHour < 18 ? 'greetingAfternoon' : 'greetingEvening';

    // Get available apps (from recent or default set)
    const availableApps = recentApps?.length > 0
        ? recentApps.slice(0, 4)
        : ['users', 'orgs', 'audit-logs'];

    // Handle app click
    const handleAppClick = (appId: string) => {
        // All available apps are valid OSAppIds
        setActiveApp(appId as OSAppId);
    };

    return (
        <motion.div
            className="core-desktop min-h-[calc(100vh-80px)] flex flex-col"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            style={{
                background: bg.value,
            }}
        >
            {/* ═══════════════════════════════════════════════════════════════
                WELCOME ZONE
                
                - Calm greeting
                - No heavy CTA
                - Contrast-aware text
            ═══════════════════════════════════════════════════════════════ */}
            <motion.header
                className="px-8 pt-12 pb-6 md:px-12 md:pt-16 md:pb-8"
                variants={contentVariants}
            >
                <div className="max-w-[800px]">
                    <h1
                        className={`
                            text-3xl md:text-4xl font-light tracking-tight mb-2
                            ${isDark ? 'text-white/95' : 'text-neutral-900'}
                        `}
                    >
                        {t(greetingKey, { name: displayName })}
                    </h1>
                    <p
                        className={`
                            text-base md:text-lg font-normal
                            ${isDark ? 'text-white/60' : 'text-neutral-500'}
                        `}
                    >
                        {t('calmSubtitle')}
                    </p>
                </div>
            </motion.header>

            {/* ═══════════════════════════════════════════════════════════════
                APP ENTRY ZONE
                
                - App icons for quick access
                - Grid layout with consistent spacing
                - No drag (Phase 7.5 scope)
            ═══════════════════════════════════════════════════════════════ */}
            <motion.section
                className="px-8 py-8 md:px-12 flex-1"
                variants={contentVariants}
            >
                <div className="max-w-[800px]">
                    {/* Section Label */}
                    <p
                        className={`
                            text-xs font-semibold uppercase tracking-wider mb-4
                            ${isDark ? 'text-white/40' : 'text-neutral-400'}
                        `}
                    >
                        {locale === 'th' ? 'แอปพลิเคชัน' : 'Apps'}
                    </p>

                    {/* App Grid */}
                    <div className="flex flex-wrap gap-6">
                        {availableApps.map((appId) => (
                            <CoreAppIcon
                                key={appId}
                                icon={APP_ICONS[appId] || <Settings size={24} />}
                                label={APP_LABELS[appId]?.[locale as 'en' | 'th'] || appId}
                                size="lg"
                                onClick={() => handleAppClick(appId)}
                                style={{
                                    // Subtle background for visibility on any background
                                    backgroundColor: isDark
                                        ? 'rgba(255, 255, 255, 0.1)'
                                        : 'rgba(255, 255, 255, 0.8)',
                                    backdropFilter: 'blur(8px)',
                                }}
                            />
                        ))}
                    </div>
                </div>
            </motion.section>

            {/* ═══════════════════════════════════════════════════════════════
                EMPTY STATE INDICATOR (if no apps available)
            ═══════════════════════════════════════════════════════════════ */}
            {availableApps.length === 0 && (
                <motion.div
                    className="flex-1 flex items-center justify-center"
                    variants={contentVariants}
                >
                    <p
                        className={`
                            text-sm
                            ${isDark ? 'text-white/40' : 'text-neutral-400'}
                        `}
                    >
                        {locale === 'th' ? 'พื้นที่ทำงานของคุณพร้อมแล้ว' : 'Your workspace is ready'}
                    </p>
                </motion.div>
            )}
        </motion.div>
    );
}

export default OSHomeDesktop;
