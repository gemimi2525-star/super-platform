/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NOTIFICATION CENTER — UI View (Phase 18 MVP)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Notification Center windowed application.
 * Renders notification list with Active/All tabs,
 * severity badges, timestamps, and read/clear actions.
 *
 * @module coreos/notifications/ui/NotificationCenterView
 */

'use client';

import React from 'react';
import { useNotificationStore } from '../store';
import type { NotificationRecord } from '../types';

// ─── Severity Config ───────────────────────────────────────────────────

const SEVERITY_CONFIG = {
    info: { color: '#4A90D9', icon: 'ℹ️', label: 'Info' },
    warning: { color: '#E5A100', icon: '⚠️', label: 'Warning' },
    error: { color: '#E53E3E', icon: '❌', label: 'Error' },
} as const;

// ─── Relative Time ─────────────────────────────────────────────────────

function relativeTime(isoStr: string): string {
    const diff = Date.now() - new Date(isoStr).getTime();
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

// ─── Notification Item ─────────────────────────────────────────────────

function NotificationItem({
    notification,
    onMarkRead,
    onClear,
}: {
    notification: NotificationRecord;
    onMarkRead: (id: string) => void;
    onClear: (id: string) => void;
}) {
    const config = SEVERITY_CONFIG[notification.severity];
    const isUnread = !notification.readAt;
    const isCleared = !!notification.clearedAt;

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '10px 12px',
                borderLeft: `3px solid ${config.color}`,
                background: isUnread ? 'rgba(255,255,255,0.06)' : 'transparent',
                opacity: isCleared ? 0.5 : 1,
                borderRadius: '4px',
                marginBottom: '4px',
                transition: 'background 0.15s',
            }}
        >
            {/* Severity icon */}
            <span style={{ fontSize: '14px', flexShrink: 0, marginTop: '1px' }}>
                {config.icon}
            </span>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                        fontWeight: isUnread ? 600 : 400,
                        fontSize: '13px',
                        color: 'var(--nx-text-primary, #e0e0e0)',
                    }}>
                        {notification.title}
                    </span>
                    {isUnread && (
                        <span style={{
                            width: 6, height: 6, borderRadius: '50%',
                            background: '#4A90D9', flexShrink: 0,
                        }} />
                    )}
                </div>
                {notification.body && (
                    <div style={{
                        fontSize: '11px',
                        color: 'var(--nx-text-secondary, #999)',
                        marginTop: '2px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}>
                        {notification.body}
                    </div>
                )}
                <div style={{
                    fontSize: '10px',
                    color: 'var(--nx-text-tertiary, #666)',
                    marginTop: '3px',
                    display: 'flex',
                    gap: '8px',
                }}>
                    <span>{notification.source.appId}</span>
                    <span>·</span>
                    <span>{relativeTime(notification.ts)}</span>
                </div>
            </div>

            {/* Actions */}
            {!isCleared && (
                <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                    {isUnread && (
                        <button
                            onClick={() => onMarkRead(notification.id)}
                            style={{
                                background: 'rgba(255,255,255,0.1)',
                                border: 'none',
                                borderRadius: '4px',
                                color: 'var(--nx-text-secondary, #aaa)',
                                fontSize: '10px',
                                padding: '3px 6px',
                                cursor: 'pointer',
                            }}
                            title="Mark read"
                        >
                            ✓
                        </button>
                    )}
                    <button
                        onClick={() => onClear(notification.id)}
                        style={{
                            background: 'rgba(255,255,255,0.1)',
                            border: 'none',
                            borderRadius: '4px',
                            color: 'var(--nx-text-secondary, #aaa)',
                            fontSize: '10px',
                            padding: '3px 6px',
                            cursor: 'pointer',
                        }}
                        title="Clear"
                    >
                        ✕
                    </button>
                </div>
            )}
        </div>
    );
}

// ─── NotificationCenterView ────────────────────────────────────────────

export function NotificationCenterView() {
    const [tab, setTab] = React.useState<'active' | 'all'>('active');
    const store = useNotificationStore();

    const activeNotifs = store.listActive();
    const allNotifs = store.listAll();
    const items = tab === 'active' ? activeNotifs : allNotifs;
    const unreadCount = store.getUnreadCount();

    return (
        <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--nx-surface-base, #1e1e1e)',
            color: 'var(--nx-text-primary, #e0e0e0)',
            fontFamily: 'var(--nx-font-system, -apple-system, BlinkMacSystemFont, sans-serif)',
        }}>
            {/* Header */}
            <div style={{
                padding: '12px 14px 8px',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '10px',
                }}>
                    <span style={{ fontWeight: 600, fontSize: '14px' }}>
                        🔔 Notifications
                        {unreadCount > 0 && (
                            <span style={{
                                background: '#E53E3E',
                                color: '#fff',
                                borderRadius: '10px',
                                fontSize: '10px',
                                padding: '1px 6px',
                                marginLeft: '6px',
                                fontWeight: 500,
                            }}>
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                        )}
                    </span>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '2px' }}>
                    {(['active', 'all'] as const).map(t => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            style={{
                                flex: 1,
                                background: tab === t ? 'rgba(255,255,255,0.1)' : 'transparent',
                                border: 'none',
                                borderRadius: '4px',
                                color: tab === t ? '#fff' : '#888',
                                fontSize: '11px',
                                fontWeight: tab === t ? 600 : 400,
                                padding: '5px 0',
                                cursor: 'pointer',
                                textTransform: 'capitalize',
                            }}
                        >
                            {t === 'active' ? `Active (${activeNotifs.length})` : `All (${allNotifs.length})`}
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '6px 8px',
            }}>
                {items.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '40px 20px',
                        color: '#666',
                        fontSize: '13px',
                    }}>
                        <div style={{ fontSize: '28px', marginBottom: '8px' }}>🔔</div>
                        {tab === 'active'
                            ? 'No active notifications'
                            : 'No notifications yet'
                        }
                    </div>
                ) : (
                    items.map(n => (
                        <NotificationItem
                            key={n.id}
                            notification={n}
                            onMarkRead={store.markRead}
                            onClear={store.clear}
                        />
                    ))
                )}
            </div>
        </div>
    );
}

export default NotificationCenterView;
