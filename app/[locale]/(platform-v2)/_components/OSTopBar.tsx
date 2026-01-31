'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * APICOREDATA OS — OSTopBar
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * PHASE 7.4.1: OS Shell Unification (Brand/Header Cleanup)
 * 
 * Layout (macOS-style):
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │ [Logo] APICOREDATA ⌄  │      Context Title      │  🇺🇸 EN ⌄  │ Logout │
 * │     BRAND ANCHOR      │         CENTER          │         RIGHT       │
 * └────────────────────────────────────────────────────────────────────────┘
 * 
 * Rules:
 * - Brand anchor = ONE place (CoreSystemMenu)
 * - No duplicate "APICOREDATA Platform V2"
 * - Context title changes based on ?app= query param
 * - Uses Core UI tokens
 * 
 * @version 2.0.0
 * @date 2026-01-29
 */

import React, { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useTranslations } from '@/lib/i18n';
import { CoreSystemMenu } from './CoreSystemMenu';
import { useCoreSystem } from './CoreSystemHost';
import { useOSRouter, type OSAppId } from '@/lib/stores/osRouterStore';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface OSTopBarProps {
    locale: string;
}

const SUPPORTED_LOCALES = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'th', label: 'ไทย', flag: '🇹🇭' },
];

// ═══════════════════════════════════════════════════════════════════════════
// CONTEXT TITLE MAPPING
// ═══════════════════════════════════════════════════════════════════════════

const CONTEXT_TITLE_KEYS: Record<OSAppId, string> = {
    'os-home': 'v2.contextTitle.coreDesktop',
    'users': 'v2.contextTitle.users',
    'orgs': 'v2.contextTitle.organizations',
    'audit-logs': 'v2.contextTitle.auditLogs',
    'settings': 'v2.contextTitle.systemSettings',
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function OSTopBar({ locale }: OSTopBarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const t = useTranslations('');
    const { activeAppId } = useOSRouter();
    const [showLocaleMenu, setShowLocaleMenu] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Core System integration
    let coreSystemContext: { openSettings: (section?: string) => void; openAbout: () => void; logout: () => void } | null = null;
    try {
        coreSystemContext = useCoreSystem();
    } catch {
        // Context not available - will use fallback
    }

    // Current locale info
    const currentLocale = SUPPORTED_LOCALES.find(l => l.code === locale) || SUPPORTED_LOCALES[0];

    // ─────────────────────────────────────────────────────────────────────────
    // CONTEXT TITLE
    // ─────────────────────────────────────────────────────────────────────────

    // Determine context title based on activeAppId
    const getContextTitle = (): string => {
        const titleKey = CONTEXT_TITLE_KEYS[activeAppId] || CONTEXT_TITLE_KEYS['os-home'];
        return t(titleKey);
    };

    const contextTitle = getContextTitle();

    // ─────────────────────────────────────────────────────────────────────────
    // HANDLERS
    // ─────────────────────────────────────────────────────────────────────────

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowLocaleMenu(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handle locale change - PRESERVES QUERY STRING
    const handleLocaleChange = (newLocale: string) => {
        if (newLocale === locale) {
            setShowLocaleMenu(false);
            return;
        }

        // Replace locale in path: /en/v2/users -> /th/v2/users
        const pathWithoutLocale = pathname?.replace(/^\/(en|th)/, '') || '';

        // PRESERVE query string (critical for OS Shell: ?app=...)
        const queryString = searchParams.toString();
        const newPath = queryString
            ? `/${newLocale}${pathWithoutLocale}?${queryString}`
            : `/${newLocale}${pathWithoutLocale}`;

        setShowLocaleMenu(false);
        router.replace(newPath, { scroll: false });
    };

    // Handle logout
    const handleLogout = async () => {
        if (isLoggingOut) return;

        setIsLoggingOut(true);

        try {
            const response = await fetch('/api/auth/session', {
                method: 'DELETE',
            });

            if (response.ok) {
                router.push(`/${locale}/auth/login`);
            } else {
                router.push(`/${locale}/auth/login`);
            }
        } catch (error) {
            console.error('[OSTopBar] Logout error:', error);
            router.push(`/${locale}/auth/login`);
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────────────────

    return (
        <div
            className="flex justify-between items-center w-full h-full"
            style={{
                paddingLeft: 'var(--os-space-2)',
                paddingRight: 'var(--os-space-4)',
            }}
        >
            {/* ═══════════════════════════════════════════════════════════════
                LEFT: Brand Anchor (Single Source of Truth)
            ═══════════════════════════════════════════════════════════════ */}
            <div className="flex items-center" style={{ minWidth: '200px' }}>
                <CoreSystemMenu
                    locale={locale}
                    onOpenSettings={coreSystemContext?.openSettings}
                    onOpenAbout={coreSystemContext?.openAbout}
                    onLogout={coreSystemContext?.logout || handleLogout}
                />
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                CENTER: Context Title (Dynamic based on ?app=)
            ═══════════════════════════════════════════════════════════════ */}
            <div
                className="flex-1 flex justify-center items-center"
                style={{
                    position: 'absolute',
                    left: '50%',
                    transform: 'translateX(-50%)',
                }}
            >
                <span
                    style={{
                        fontSize: 'var(--os-text-sm)',
                        fontWeight: 500,
                        fontFamily: 'var(--os-font-sans)',
                        color: 'var(--os-color-text-secondary)',
                        letterSpacing: '0.01em',
                    }}
                >
                    {contextTitle}
                </span>
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                RIGHT: OS Controls (Language + Logout)
            ═══════════════════════════════════════════════════════════════ */}
            <div className="flex items-center" style={{ gap: 'var(--os-space-3)' }}>
                {/* Language Switcher */}
                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setShowLocaleMenu(!showLocaleMenu)}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors"
                        style={{
                            color: 'var(--os-color-text-secondary)',
                            backgroundColor: showLocaleMenu ? 'var(--os-color-surface-hover)' : 'transparent',
                        }}
                        onMouseEnter={(e) => {
                            if (!showLocaleMenu) {
                                e.currentTarget.style.backgroundColor = 'var(--os-color-surface-hover)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!showLocaleMenu) {
                                e.currentTarget.style.backgroundColor = 'transparent';
                            }
                        }}
                        aria-label="Change language"
                        aria-expanded={showLocaleMenu}
                    >
                        <span>{currentLocale.flag}</span>
                        <span style={{ fontWeight: 500 }}>{currentLocale.code.toUpperCase()}</span>
                        <svg
                            className={`w-3 h-3 transition-transform ${showLocaleMenu ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            style={{ opacity: 0.5 }}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {/* Language Dropdown Menu */}
                    {showLocaleMenu && (
                        <div
                            className="absolute right-0 top-full mt-1 py-1 overflow-hidden"
                            style={{
                                width: '160px',
                                backgroundColor: 'var(--os-color-surface)',
                                border: '1px solid var(--os-color-border)',
                                borderRadius: 'var(--os-radius-lg)',
                                boxShadow: 'var(--os-shadow-lg)',
                                zIndex: 'var(--os-z-dropdown)',
                            }}
                        >
                            {SUPPORTED_LOCALES.map((loc) => (
                                <button
                                    key={loc.code}
                                    onClick={() => handleLocaleChange(loc.code)}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors"
                                    style={{
                                        color: loc.code === locale ? 'var(--os-color-accent)' : 'var(--os-color-text)',
                                        backgroundColor: loc.code === locale ? 'var(--os-color-accent-subtle)' : 'transparent',
                                        fontWeight: loc.code === locale ? 500 : 400,
                                    }}
                                    onMouseEnter={(e) => {
                                        if (loc.code !== locale) {
                                            e.currentTarget.style.backgroundColor = 'var(--os-color-surface-hover)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (loc.code !== locale) {
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                        }
                                    }}
                                >
                                    <span className="text-base">{loc.flag}</span>
                                    <span>{loc.label}</span>
                                    {loc.code === locale && (
                                        <svg
                                            className="w-4 h-4 ml-auto"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                            style={{ color: 'var(--os-color-accent)' }}
                                        >
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors"
                    style={{
                        color: isLoggingOut ? 'var(--os-color-text-muted)' : 'var(--os-color-text-secondary)',
                        backgroundColor: 'transparent',
                        cursor: isLoggingOut ? 'not-allowed' : 'pointer',
                    }}
                    onMouseEnter={(e) => {
                        if (!isLoggingOut) {
                            e.currentTarget.style.backgroundColor = 'var(--os-color-surface-hover)';
                            e.currentTarget.style.color = 'var(--os-color-text)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = isLoggingOut
                            ? 'var(--os-color-text-muted)'
                            : 'var(--os-color-text-secondary)';
                    }}
                >
                    {isLoggingOut ? t('v2.topbar.loggingOut') : t('v2.topbar.logout')}
                </button>
            </div>
        </div>
    );
}

