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
    useActiveSpaceId,
} from '@/governance/synapse';
import { useMounted } from '@/coreos/useMounted';
import { useTranslations, useLocale } from '@/lib/i18n/context';
import { useNotificationStore } from '@/coreos/notifications/store';
import { useSpaceStore } from '@/coreos/spaces/store';
import { generateSpaceId } from '@/coreos/spaces/types';
import type { SpaceRecord } from '@/coreos/spaces/types';
import type { SpaceId } from '@/coreos/types';
import { getKernel, IntentFactory } from '@/coreos/index';

// ─── Phase 20: Space Switcher Component ────────────────────────────────

function SpaceSwitcher() {
    const [isOpen, setIsOpen] = React.useState(false);
    const activeSpaceId = useActiveSpaceId();
    const spaces = useSpaceStore(s => s.spaces);
    const addSpace = useSpaceStore(s => s.addSpace);
    const removeSpace = useSpaceStore(s => s.removeSpace);
    const hydrate = useSpaceStore(s => s.hydrate);
    const mounted = useMounted();

    React.useEffect(() => { hydrate(); }, [hydrate]);

    const currentSpace = spaces.find(s => s.id === activeSpaceId) ?? spaces[0];

    const handleSwitchSpace = React.useCallback(async (spaceId: SpaceId) => {
        setIsOpen(false);
        const traceId = `sp-sw-${Date.now().toString(36)}`;
        try {
            await fetch('/api/os/spaces/activate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-trace-id': traceId },
                body: JSON.stringify({ spaceId, traceId }),
            });
            getKernel().emit(IntentFactory.switchSpace(spaceId));
        } catch (e) {
            console.error('[SpaceSwitcher] Activate error:', e);
        }
    }, []);

    const handleCreateSpace = React.useCallback(async () => {
        const name = `Desktop ${spaces.length + 1}`;
        const traceId = `sp-cr-${Date.now().toString(36)}`;
        try {
            const resp = await fetch('/api/os/spaces/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-trace-id': traceId },
                body: JSON.stringify({ name, traceId }),
            });
            if (resp.ok) {
                const data = await resp.json();
                const newSpace: SpaceRecord = {
                    id: data.space.id as SpaceId,
                    name: data.space.name,
                    order: data.space.order,
                    createdAt: data.space.createdAt,
                    createdBy: { uid: 'current' },
                    traceId,
                };
                addSpace(newSpace);
                // Switch to new space
                getKernel().emit(IntentFactory.switchSpace(newSpace.id));
                setIsOpen(false);
            }
        } catch (e) {
            console.error('[SpaceSwitcher] Create error:', e);
        }
    }, [spaces.length, addSpace]);

    const handleRemoveSpace = React.useCallback(async (spaceId: SpaceId, e: React.MouseEvent) => {
        e.stopPropagation();
        if (spaceId === 'space:default') return;
        const traceId = `sp-rm-${Date.now().toString(36)}`;
        try {
            const resp = await fetch('/api/os/spaces/remove', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-trace-id': traceId },
                body: JSON.stringify({ spaceId, traceId }),
            });
            if (resp.ok) {
                // If removing active space, switch to default first
                if (activeSpaceId === spaceId) {
                    getKernel().emit(IntentFactory.switchSpace('space:default'));
                }
                removeSpace(spaceId);
            }
        } catch (e2) {
            console.error('[SpaceSwitcher] Remove error:', e2);
        }
    }, [activeSpaceId, removeSpace]);

    if (!mounted) return null;

    return (
        <div style={{ position: 'relative' }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    background: isOpen ? 'rgba(255,255,255,0.12)' : 'none',
                    border: 'none',
                    color: 'inherit',
                    fontSize: 'var(--nx-text-micro)',
                    cursor: 'pointer',
                    padding: '2px 8px',
                    borderRadius: 4,
                    opacity: 0.85,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    transition: 'background 0.15s ease',
                }}
                title={`Space: ${currentSpace?.name ?? 'Desktop 1'}`}
                id="space-switcher-btn"
            >
                <span style={{ fontSize: 11 }}>⬜</span>
                <span style={{ fontSize: 12 }}>{currentSpace?.name ?? 'Desktop 1'}</span>
                <span style={{ fontSize: 9, opacity: 0.6 }}>▾</span>
            </button>

            {isOpen && (
                <div
                    style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        marginTop: 4,
                        background: 'var(--nx-surface-popover, rgba(30,30,30,0.95))',
                        backdropFilter: 'blur(20px) saturate(180%)',
                        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: 8,
                        padding: 4,
                        minWidth: 180,
                        zIndex: 9999,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                    }}
                >
                    {spaces.map(space => (
                        <div
                            key={space.id}
                            onClick={() => handleSwitchSpace(space.id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '6px 10px',
                                cursor: 'pointer',
                                borderRadius: 4,
                                background: space.id === activeSpaceId ? 'rgba(0,122,255,0.25)' : 'transparent',
                                fontSize: 12,
                                color: 'var(--nx-text-inverse, #fff)',
                                transition: 'background 0.1s ease',
                            }}
                        >
                            <span>{space.id === activeSpaceId ? '● ' : '○ '}{space.name}</span>
                            {space.id !== 'space:default' && (
                                <button
                                    onClick={(e) => handleRemoveSpace(space.id, e)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: 'rgba(255,255,255,0.4)',
                                        cursor: 'pointer',
                                        fontSize: 11,
                                        padding: '0 4px',
                                    }}
                                    title="Remove space"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    ))}

                    {/* Divider */}
                    <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />

                    {/* Create new space */}
                    <div
                        onClick={handleCreateSpace}
                        style={{
                            padding: '6px 10px',
                            cursor: 'pointer',
                            borderRadius: 4,
                            fontSize: 12,
                            color: 'rgba(0,122,255,0.9)',
                            transition: 'background 0.1s ease',
                        }}
                    >
                        ＋ New Space
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── TopBar Props ──────────────────────────────────────────────────────

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

    // Phase 18: Notification bell (hydration-safe)
    const mounted = useMounted();
    const unreadCount = useNotificationStore(s => {
        const notifs = Object.values(s.notifications);
        return notifs.filter(n => !n.readAt && !n.clearedAt && !n.muted).length;
    });
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
            {/* Left: System Layer + Space Switcher + App Context */}
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

                {/* Phase 20: Space Switcher */}
                <SpaceSwitcher />

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

