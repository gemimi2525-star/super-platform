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

// ─── Phase 20 / 20.5: Space Switcher Component ────────────────────────

function SpaceSwitcher() {
    const [isOpen, setIsOpen] = React.useState(false);
    const [editingId, setEditingId] = React.useState<string | null>(null);
    const [editName, setEditName] = React.useState('');
    const [dragOverId, setDragOverId] = React.useState<string | null>(null);
    const activeSpaceId = useActiveSpaceId();
    const spaces = useSpaceStore(s => s.spaces);
    const addSpace = useSpaceStore(s => s.addSpace);
    const removeSpace = useSpaceStore(s => s.removeSpace);
    const renameSpace = useSpaceStore(s => s.renameSpace);
    const reorderSpaces = useSpaceStore(s => s.reorderSpaces);
    const setPersistedActiveSpaceId = useSpaceStore(s => s.setActiveSpaceId);
    const hydrate = useSpaceStore(s => s.hydrate);
    const mounted = useMounted();
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => { hydrate(); }, [hydrate]);

    // Phase 20.5: Restore persisted activeSpaceId on mount
    React.useEffect(() => {
        if (!mounted) return;
        const persisted = useSpaceStore.getState().getPersistedActiveSpaceId();
        if (persisted && persisted !== activeSpaceId && persisted !== 'space:default') {
            try { getKernel().emit(IntentFactory.switchSpace(persisted as SpaceId)); } catch { }
        }
    }, [mounted]);

    // Phase 20.5: Click-outside to close
    React.useEffect(() => {
        if (!isOpen) return;
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                setEditingId(null);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [isOpen]);

    const currentSpace = spaces.find(s => s.id === activeSpaceId) ?? spaces[0];

    // ─── Switch Space ──────────────────────────────────────────────
    const handleSwitchSpace = React.useCallback(async (spaceId: SpaceId) => {
        if (spaceId === activeSpaceId) return;
        setIsOpen(false);
        const traceId = `sp-sw-${Date.now().toString(36)}`;
        try {
            await fetch('/api/os/spaces/activate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-trace-id': traceId },
                body: JSON.stringify({ spaceId, traceId }),
            });
            getKernel().emit(IntentFactory.switchSpace(spaceId));
            setPersistedActiveSpaceId(spaceId);
        } catch (e) {
            console.error('[SpaceSwitcher] Activate error:', e);
        }
    }, [activeSpaceId, setPersistedActiveSpaceId]);

    // ─── Create Space ──────────────────────────────────────────────
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
                getKernel().emit(IntentFactory.switchSpace(newSpace.id));
                setPersistedActiveSpaceId(newSpace.id);
                setIsOpen(false);
            }
        } catch (e) {
            console.error('[SpaceSwitcher] Create error:', e);
        }
    }, [spaces.length, addSpace, setPersistedActiveSpaceId]);

    // ─── Remove Space ──────────────────────────────────────────────
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
                if (activeSpaceId === spaceId) {
                    getKernel().emit(IntentFactory.switchSpace('space:default'));
                    setPersistedActiveSpaceId('space:default');
                }
                removeSpace(spaceId);
            }
        } catch (e2) {
            console.error('[SpaceSwitcher] Remove error:', e2);
        }
    }, [activeSpaceId, removeSpace, setPersistedActiveSpaceId]);

    // ─── Phase 20.5: Rename ────────────────────────────────────────
    const handleStartRename = (spaceId: string, currentName: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingId(spaceId);
        setEditName(currentName);
    };

    const handleFinishRename = React.useCallback(async () => {
        if (!editingId || editName.trim().length === 0) { setEditingId(null); return; }
        const traceId = `sp-rn-${Date.now().toString(36)}`;
        try {
            await fetch('/api/os/spaces/rename', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-trace-id': traceId },
                body: JSON.stringify({ spaceId: editingId, name: editName.trim(), traceId }),
            });
            renameSpace(editingId, editName.trim());
        } catch (e) {
            console.error('[SpaceSwitcher] Rename error:', e);
        }
        setEditingId(null);
    }, [editingId, editName, renameSpace]);

    // ─── Phase 20.5: Reorder ───────────────────────────────────────
    const handleMoveUp = React.useCallback(async (spaceId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const idx = spaces.findIndex(s => s.id === spaceId);
        if (idx <= 0) return;
        const ids = spaces.map(s => s.id);
        [ids[idx - 1], ids[idx]] = [ids[idx], ids[idx - 1]];
        const traceId = `sp-ro-${Date.now().toString(36)}`;
        try {
            await fetch('/api/os/spaces/reorder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-trace-id': traceId },
                body: JSON.stringify({ orderedIds: ids, traceId }),
            });
            reorderSpaces(ids);
        } catch (e2) { console.error('[SpaceSwitcher] Reorder error:', e2); }
    }, [spaces, reorderSpaces]);

    const handleMoveDown = React.useCallback(async (spaceId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const idx = spaces.findIndex(s => s.id === spaceId);
        if (idx < 0 || idx >= spaces.length - 1) return;
        const ids = spaces.map(s => s.id);
        [ids[idx], ids[idx + 1]] = [ids[idx + 1], ids[idx]];
        const traceId = `sp-ro-${Date.now().toString(36)}`;
        try {
            await fetch('/api/os/spaces/reorder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-trace-id': traceId },
                body: JSON.stringify({ orderedIds: ids, traceId }),
            });
            reorderSpaces(ids);
        } catch (e2) { console.error('[SpaceSwitcher] Reorder error:', e2); }
    }, [spaces, reorderSpaces]);

    // ─── Phase 20.5: Drop target for cross-space window drag ──────
    const handleDragOver = (e: React.DragEvent, spaceId: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverId(spaceId);
    };

    const handleDragLeave = () => { setDragOverId(null); };

    const handleDrop = React.useCallback(async (e: React.DragEvent, targetSpaceId: string) => {
        e.preventDefault();
        setDragOverId(null);
        const raw = e.dataTransfer.getData('application/x-coreos-window');
        if (!raw) return;
        try {
            const { windowId } = JSON.parse(raw);
            if (!windowId) return;
            const traceId = `sp-mv-${Date.now().toString(36)}`;
            await fetch('/api/os/spaces/move-window', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-trace-id': traceId },
                body: JSON.stringify({ windowId, targetSpaceId, traceId }),
            });
            getKernel().emit(IntentFactory.moveWindowToSpace(windowId, targetSpaceId as SpaceId));
        } catch (e2) {
            console.error('[SpaceSwitcher] Move window error:', e2);
        }
    }, []);

    if (!mounted) return null;

    return (
        <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button
                onClick={() => { setIsOpen(!isOpen); setEditingId(null); }}
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
                        minWidth: 220,
                        zIndex: 9999,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                    }}
                >
                    {spaces.map((space, idx) => (
                        <div
                            key={space.id}
                            onClick={() => handleSwitchSpace(space.id)}
                            onDragOver={(e) => handleDragOver(e, space.id)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, space.id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '5px 8px',
                                cursor: 'pointer',
                                borderRadius: 4,
                                background: dragOverId === space.id
                                    ? 'rgba(0,122,255,0.35)'
                                    : space.id === activeSpaceId
                                        ? 'rgba(0,122,255,0.2)'
                                        : 'transparent',
                                fontSize: 12,
                                color: 'var(--nx-text-inverse, #fff)',
                                transition: 'background 0.1s ease',
                                gap: 4,
                            }}
                        >
                            {/* Name or inline edit */}
                            <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
                                <span style={{ width: 14, flexShrink: 0 }}>{space.id === activeSpaceId ? '●' : '○'}</span>
                                {editingId === space.id ? (
                                    <input
                                        autoFocus
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        onBlur={handleFinishRename}
                                        onKeyDown={(e) => { if (e.key === 'Enter') handleFinishRename(); if (e.key === 'Escape') setEditingId(null); }}
                                        onClick={(e) => e.stopPropagation()}
                                        style={{
                                            background: 'rgba(255,255,255,0.1)',
                                            border: '1px solid rgba(0,122,255,0.5)',
                                            borderRadius: 3,
                                            color: 'inherit',
                                            fontSize: 12,
                                            padding: '1px 4px',
                                            outline: 'none',
                                            width: '100%',
                                        }}
                                    />
                                ) : (
                                    <span
                                        onDoubleClick={(e) => handleStartRename(space.id, space.name, e)}
                                        title="Double-click to rename"
                                        style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                    >
                                        {space.name}
                                    </span>
                                )}
                            </div>

                            {/* Controls: ▲▼ reorder + ✕ remove */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                                {spaces.length > 1 && (
                                    <>
                                        <button
                                            onClick={(e) => handleMoveUp(space.id, e)}
                                            disabled={idx === 0}
                                            style={{ background: 'none', border: 'none', color: idx === 0 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.5)', cursor: idx === 0 ? 'default' : 'pointer', fontSize: 9, padding: '0 2px' }}
                                            title="Move up"
                                        >▲</button>
                                        <button
                                            onClick={(e) => handleMoveDown(space.id, e)}
                                            disabled={idx === spaces.length - 1}
                                            style={{ background: 'none', border: 'none', color: idx === spaces.length - 1 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.5)', cursor: idx === spaces.length - 1 ? 'default' : 'pointer', fontSize: 9, padding: '0 2px' }}
                                            title="Move down"
                                        >▼</button>
                                    </>
                                )}
                                {space.id !== 'space:default' && (
                                    <button
                                        onClick={(e) => handleRemoveSpace(space.id, e)}
                                        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', fontSize: 10, padding: '0 3px', marginLeft: 2 }}
                                        title="Remove space"
                                    >✕</button>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Divider */}
                    <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />

                    {/* Create new space */}
                    <div
                        onClick={handleCreateSpace}
                        style={{
                            padding: '5px 8px',
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
            role="banner"
            aria-label="Menu Bar"
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

