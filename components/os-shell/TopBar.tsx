/**
 * ═══════════════════════════════════════════════════════════════════════════
 * OS SHELL — Top Bar (Menu Bar) + Log Toggle
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * macOS-style menu bar with system menu, app context, and log toggle.
 * 
 * Phase 8: Updated to use NEXUS Design Tokens
 * Phase 9.2: Fixed SSR/client hydration mismatch for clock
 * 
 * @module components/os-shell/TopBar
 * @version 2.1.0 (Phase 9.2)
 */

'use client';

import React from 'react';
import '@/styles/nexus-tokens.css';
import {
    useFocusedWindow,
    useMinimizeAll,
    useSystemState,
    useOpenCapability,
} from '@/governance/synapse';
import { useMounted } from '@/coreos/useMounted';
import { useTranslations, useLocale } from '@/lib/i18n/context';
import { useNotificationStore } from '@/coreos/notifications/store';

interface TopBarProps {
    onToggleLogs?: () => void;
    isLogPanelOpen?: boolean;
}

export function TopBar({ onToggleLogs, isLogPanelOpen }: TopBarProps) {
    const focusedWindow = useFocusedWindow();
    const minimizeAll = useMinimizeAll();
    const state = useSystemState();
    const openCapability = useOpenCapability();
    const t = useTranslations('os');
    const locale = useLocale();
    const unreadCount = useNotificationStore(s => s.getUnreadCount());

    // Phase 9.2: Hydration-safe clock
    const mounted = useMounted();
    const [time, setTime] = React.useState<Date | null>(null);

    React.useEffect(() => {
        // Only start clock on client
        setTime(new Date());
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (date: Date | null) => {
        if (!date) return '—:—';
        return date.toLocaleTimeString(locale === 'th' ? 'th-TH' : 'en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const formatDate = (date: Date | null) => {
        if (!date) return '—';
        return date.toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    };

    const activeWindowCount = Object.values(state.windows).filter(w => w.state === 'active').length;

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                height: 'var(--nx-menubar-height)',
                background: 'var(--nx-surface-menubar)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                color: 'var(--nx-text-inverse)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 var(--nx-menubar-padding-x)',
                fontSize: 'var(--nx-text-body)',
                fontWeight: 'var(--nx-weight-medium)',
                fontFamily: 'var(--nx-font-system)',
                zIndex: 'var(--nx-z-menubar)',
                userSelect: 'none',
            }}
        >
            {/* Left: System Layer + App Context */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--nx-space-4)' }}>
                {/* System Menu */}
                <button
                    onClick={minimizeAll}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: 'inherit',
                        fontSize: 'var(--nx-text-section)',
                        cursor: 'pointer',
                        padding: '0 var(--nx-space-1)',
                        opacity: 0.9,
                    }}
                    title={t('topbar.showDesktop')}
                >
                    ◈
                </button>

                {/* App Context Layer */}
                <span style={{ fontWeight: 'var(--nx-weight-semibold)' }}>
                    {focusedWindow ? focusedWindow.title : t('topbar.finder')}
                </span>

                {/* Menu Items (when window is focused) */}
                {focusedWindow && (
                    <div style={{ display: 'flex', gap: 'var(--nx-space-4)', opacity: 0.85 }}>
                        <span style={{ cursor: 'default' }}>{t('menu.file')}</span>
                        <span style={{ cursor: 'default' }}>{t('menu.edit')}</span>
                        <span style={{ cursor: 'default' }}>{t('menu.view')}</span>
                        <span style={{ cursor: 'default' }}>{t('menu.window')}</span>
                        <span style={{ cursor: 'default' }}>{t('menu.help')}</span>
                    </div>
                )}
            </div>

            {/* Right: System Status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--nx-space-4)' }}>
                {/* Phase 18: Notification Bell */}
                <button
                    onClick={() => openCapability('system.notifications' as any)}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: 'inherit',
                        fontSize: 'var(--nx-text-micro)',
                        cursor: 'pointer',
                        padding: '2px 6px',
                        position: 'relative',
                        opacity: 0.85,
                    }}
                    title="Notifications"
                    id="notification-bell"
                >
                    🔔
                    {unreadCount > 0 && (
                        <span style={{
                            position: 'absolute',
                            top: -2,
                            right: 0,
                            background: '#E53E3E',
                            color: '#fff',
                            borderRadius: '8px',
                            fontSize: '9px',
                            fontWeight: 600,
                            padding: '0 4px',
                            minWidth: '14px',
                            height: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            lineHeight: 1,
                        }}>
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </button>
                {onToggleLogs && (
                    <button
                        onClick={onToggleLogs}
                        style={{
                            background: isLogPanelOpen ? 'rgba(255,255,255,0.2)' : 'none',
                            border: 'none',
                            borderRadius: 'var(--nx-radius-sm)',
                            color: 'inherit',
                            fontSize: 'var(--nx-text-micro)',
                            cursor: 'pointer',
                            padding: '2px 6px',
                            opacity: isLogPanelOpen ? 1 : 0.7,
                        }}
                        title="Toggle System Log"
                    >
                        🔍 {t('topbar.logs')}
                    </button>
                )}

                {/* Window count indicator */}
                {activeWindowCount > 0 && (
                    <span style={{ opacity: 0.7, fontSize: 'var(--nx-text-micro)' }}>
                        {activeWindowCount === 1 ? t('topbar.windowCount', { count: activeWindowCount }) : t('topbar.windowsCount', { count: activeWindowCount })}
                    </span>
                )}

                {/* Phase 9.2: Hydration-safe time display */}
                <span style={{ opacity: 0.85 }} suppressHydrationWarning>
                    {mounted ? formatDate(time) : '—'}
                </span>
                <span suppressHydrationWarning>
                    {mounted ? formatTime(time) : '—:—'}
                </span>
            </div>
        </div>
    );
}

