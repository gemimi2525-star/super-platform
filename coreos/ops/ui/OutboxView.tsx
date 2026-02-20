'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * OutboxView — Offline Outbox Inspector (Phase 15C.2C)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Ops Center view for inspecting and managing the offline sync outbox.
 * Shows queued, syncing, dead-lettered, and completed items.
 *
 * Features:
 *   - Summary pills (Pending / Syncing / Dead / Done)
 *   - Item table with status, retries, lastError, idempotencyKey
 *   - Retry (dead/failed → pending), Drop (remove), Sync Now
 *   - Multi-tab lock awareness
 *
 * @module coreos/ops/ui/OutboxView
 * @version 1.0.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    getSyncQueue,
    isOutboxLockedByOther,
    type SyncQueueItem,
    type QueueStatus,
} from '../../offline/syncQueue';

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function OutboxView() {
    const [items, setItems] = useState<SyncQueueItem[]>([]);
    const [status, setStatus] = useState<QueueStatus>({
        pending: 0, processing: 0, completed: 0, failed: 0, dead: 0, total: 0,
    });
    const [syncing, setSyncing] = useState(false);
    const [locked, setLocked] = useState(false);
    const [confirmDrop, setConfirmDrop] = useState<string | null>(null);

    const refresh = useCallback(() => {
        const queue = getSyncQueue();
        setItems(queue.getItems());
        setStatus(queue.getStatus());
        setLocked(isOutboxLockedByOther());
    }, []);

    useEffect(() => {
        refresh();
        const queue = getSyncQueue();
        const unsub = queue.subscribe(() => refresh());
        const interval = setInterval(refresh, 3000);
        return () => { unsub(); clearInterval(interval); };
    }, [refresh]);

    const handleSyncNow = async () => {
        if (syncing || locked) return;
        if (typeof navigator !== 'undefined' && !navigator.onLine) return;
        setSyncing(true);
        try {
            await getSyncQueue().processQueue();
        } finally {
            setSyncing(false);
            refresh();
        }
    };

    const handleRetry = (id: string) => {
        getSyncQueue().retryItem(id);
        refresh();
    };

    const handleDrop = (id: string) => {
        if (confirmDrop !== id) {
            setConfirmDrop(id);
            return;
        }
        getSyncQueue().dropItem(id);
        setConfirmDrop(null);
        refresh();
    };

    // ─── Helpers ─────────────────────────────────────────────────────────

    const statusColor = (s: string) => {
        switch (s) {
            case 'pending': return '#60a5fa';
            case 'processing': return '#a78bfa';
            case 'completed': return '#4ade80';
            case 'failed': return '#fbbf24';
            case 'dead': return '#ef4444';
            default: return '#64748b';
        }
    };

    const timeAgo = (ms: number) => {
        const sec = Math.floor((Date.now() - ms) / 1000);
        if (sec < 60) return `${sec}s ago`;
        if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
        return `${Math.floor(sec / 3600)}h ago`;
    };

    const extractAction = (url: string) => {
        // /api/jobs/abc123/suspend → suspend
        const parts = url.split('/');
        return parts[parts.length - 1] ?? url;
    };

    const extractTarget = (url: string) => {
        // /api/jobs/abc123/suspend → abc123
        const match = url.match(/\/api\/jobs\/([^/]+)/);
        return match?.[1]?.slice(0, 8) ?? url;
    };

    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

    // ─── Render ──────────────────────────────────────────────────────────

    return (
        <div>
            {/* Summary pills */}
            <div style={st.pillRow}>
                <Pill label="Pending" count={status.pending} color="#60a5fa" />
                <Pill label="Syncing" count={status.processing} color="#a78bfa" />
                <Pill label="Dead" count={status.dead} color="#ef4444" />
                <Pill label="Done" count={status.completed} color="#4ade80" />
                {status.failed > 0 && <Pill label="Failed" count={status.failed} color="#fbbf24" />}
            </div>

            {/* Lock + Sync controls */}
            <div style={st.headerRow}>
                <span style={st.total}>{status.total} items</span>
                {locked && (
                    <span style={st.lockBadge}>🔒 Syncing in another tab</span>
                )}
                <button
                    onClick={handleSyncNow}
                    disabled={syncing || locked || !isOnline || status.pending === 0}
                    style={{
                        ...st.syncBtn,
                        ...(syncing || locked || !isOnline || status.pending === 0 ? st.disabledBtn : {}),
                    }}
                >
                    {syncing ? '⏳ Syncing…' : '🔄 Sync Now'}
                </button>
            </div>

            {/* Items table */}
            {items.length > 0 ? (
                <div style={st.tableWrap}>
                    <table style={st.table}>
                        <thead>
                            <tr>
                                <th style={st.th}>Time</th>
                                <th style={st.th}>Action</th>
                                <th style={st.th}>Target</th>
                                <th style={st.th}>Status</th>
                                <th style={st.th}>Retries</th>
                                <th style={st.th}>Error</th>
                                <th style={st.th}>Key</th>
                                <th style={st.th}>Controls</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map(item => (
                                <tr key={item.id} style={st.row}>
                                    <td style={st.td}>
                                        <span style={st.timeAgo}>{timeAgo(item.createdAt)}</span>
                                    </td>
                                    <td style={st.td}>
                                        <span style={st.mono}>{extractAction(item.url)}</span>
                                    </td>
                                    <td style={st.td}>
                                        <span style={st.mono}>{extractTarget(item.url)}</span>
                                    </td>
                                    <td style={st.td}>
                                        <span style={{
                                            ...st.badge,
                                            background: `${statusColor(item.status)}22`,
                                            color: statusColor(item.status),
                                            borderColor: `${statusColor(item.status)}44`,
                                        }}>
                                            {item.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td style={st.td}>
                                        <span style={st.mono}>{item.retryCount}</span>
                                    </td>
                                    <td style={st.td}>
                                        <span style={st.errorText} title={item.lastError ?? ''}>
                                            {item.lastError
                                                ? (item.lastError.length > 30
                                                    ? item.lastError.slice(0, 30) + '…'
                                                    : item.lastError)
                                                : '—'}
                                        </span>
                                    </td>
                                    <td style={st.td}>
                                        <span
                                            style={st.keyText}
                                            title={item.idempotencyKey}
                                            onClick={() => {
                                                navigator.clipboard?.writeText(item.idempotencyKey);
                                            }}
                                        >
                                            {item.idempotencyKey.slice(0, 8)}… 📋
                                        </span>
                                    </td>
                                    <td style={st.td}>
                                        <div style={st.controls}>
                                            {(item.status === 'dead' || item.status === 'failed') && (
                                                <button
                                                    onClick={() => handleRetry(item.id)}
                                                    style={st.retryBtn}
                                                >
                                                    ♻️ Retry
                                                </button>
                                            )}
                                            {(item.status === 'dead' || item.status === 'failed' || item.status === 'pending') && (
                                                <button
                                                    onClick={() => handleDrop(item.id)}
                                                    style={{
                                                        ...st.dropBtn,
                                                        ...(confirmDrop === item.id ? st.confirmDropBtn : {}),
                                                    }}
                                                >
                                                    {confirmDrop === item.id ? '⚠ Confirm Drop' : '🗑 Drop'}
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div style={st.empty}>
                    <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>📤</div>
                    <p style={st.emptyText}>Outbox is empty — no queued actions</p>
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// PILL COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function Pill({ label, count, color }: { label: string; count: number; color: string }) {
    return (
        <div style={{
            ...st.pill,
            background: `${color}15`,
            borderColor: `${color}33`,
            color,
            opacity: count > 0 ? 1 : 0.4,
        }}>
            <span style={st.pillCount}>{count}</span>
            <span style={st.pillLabel}>{label}</span>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════

const st: Record<string, React.CSSProperties> = {
    pillRow: {
        display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap',
    },
    pill: {
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '6px 14px', borderRadius: 8,
        border: '1px solid', fontSize: 12, fontWeight: 600,
    },
    pillCount: {
        fontFamily: '"SF Mono", Monaco, monospace', fontSize: 16, fontWeight: 700,
    },
    pillLabel: { fontSize: 11, opacity: 0.8 },
    headerRow: {
        display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
        gap: 12, marginBottom: 16,
    },
    total: { fontSize: 13, color: '#94a3b8', fontWeight: 600, marginRight: 'auto' },
    lockBadge: {
        fontSize: 11, fontWeight: 600, color: '#94a3b8',
        background: 'rgba(148, 163, 184, 0.15)', border: '1px solid rgba(148, 163, 184, 0.3)',
        borderRadius: 6, padding: '3px 10px',
    },
    syncBtn: {
        background: 'rgba(96, 165, 250, 0.15)', color: '#60a5fa',
        border: '1px solid rgba(96, 165, 250, 0.3)', borderRadius: 8,
        padding: '6px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 500,
    },
    disabledBtn: { opacity: 0.4, cursor: 'not-allowed' },
    tableWrap: {
        background: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(148, 163, 184, 0.1)',
        borderRadius: 12, overflow: 'hidden',
    },
    table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: 12 },
    th: {
        textAlign: 'left' as const, padding: '8px 10px',
        borderBottom: '1px solid rgba(148, 163, 184, 0.15)',
        color: '#94a3b8', fontWeight: 600, fontSize: 10,
        textTransform: 'uppercase' as const, letterSpacing: 1,
        background: 'rgba(15, 23, 42, 0.4)',
    },
    td: {
        padding: '8px 10px', borderBottom: '1px solid rgba(148, 163, 184, 0.06)',
        verticalAlign: 'middle' as const,
    },
    row: { transition: 'background 0.15s ease' },
    mono: { fontFamily: 'monospace', fontSize: 11, color: '#94a3b8' },
    badge: {
        display: 'inline-block', padding: '2px 7px', borderRadius: 5,
        fontSize: 10, fontWeight: 700, letterSpacing: 0.5, border: '1px solid',
    },
    timeAgo: { fontSize: 11, color: '#64748b' },
    errorText: { fontSize: 11, color: '#fca5a5', fontFamily: 'monospace' },
    keyText: {
        fontSize: 10, color: '#64748b', fontFamily: 'monospace',
        cursor: 'pointer', textDecoration: 'underline dotted',
    },
    controls: { display: 'flex', gap: 4, alignItems: 'center' },
    retryBtn: {
        border: '1px solid rgba(96, 165, 250, 0.3)', borderRadius: 5,
        padding: '3px 8px', cursor: 'pointer', fontSize: 10, fontWeight: 600,
        background: 'rgba(96, 165, 250, 0.1)', color: '#60a5fa',
    },
    dropBtn: {
        border: '1px solid rgba(248, 113, 113, 0.25)', borderRadius: 5,
        padding: '3px 8px', cursor: 'pointer', fontSize: 10, fontWeight: 600,
        background: 'rgba(248, 113, 113, 0.08)', color: '#f87171',
    },
    confirmDropBtn: {
        background: 'rgba(248, 113, 113, 0.3)', borderColor: 'rgba(248, 113, 113, 0.6)',
    },
    empty: {
        background: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(148, 163, 184, 0.1)',
        borderRadius: 12, padding: '60px 24px', textAlign: 'center' as const,
    },
    emptyText: { color: '#64748b', fontSize: 13, fontStyle: 'italic' as const },
};
