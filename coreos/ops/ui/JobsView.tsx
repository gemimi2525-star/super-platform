'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * JobsView — Job Queue Manager (Phase 15B.2E + 15C Offline)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Interactive job list with Pause/Resume/Priority controls.
 * Offline-aware: cached reads via useOfflineData, queued writes via SyncQueue.
 *
 * Features:
 *   - Live job list from /api/ops/jobs/list (10s auto-refresh)
 *   - Offline: serves cached list + "QUEUED" badges for pending actions
 *   - Pause (suspend) / Resume per job
 *   - Priority presets (LOW/NORMAL/HIGH/CRITICAL)
 *   - Idempotent-safe controls (disabled during action)
 *
 * @module coreos/ops/ui/JobsView
 * @version 2.0.0 (15C: offline-first)
 */

import React, { useState, useCallback } from 'react';
import { useOfflineData } from '../../offline/useOfflineData';
import { OFFLINE_KEYS, OFFLINE_TTL } from '../../offline/offlineStore';
import { getSyncQueue } from '../../offline/syncQueue';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface JobRow {
    jobId: string;
    jobType: string;
    status: string;
    priority: number;
    workerId: string | null;
    attempts: number;
    maxAttempts: number;
    createdAt: number;
    updatedAt: number;
    suspendedAt: number | null;
    suspendedBy: string | null;
}

interface JobsListResponse {
    jobs: JobRow[];
    count: number;
}

/** Tracks optimistic UI state for offline-queued actions */
interface QueuedAction {
    jobId: string;
    action: string;
    value?: number;
}

const PRIORITY_PRESETS = [
    { label: 'LOW', value: 10, color: '#64748b' },
    { label: 'NORMAL', value: 50, color: '#60a5fa' },
    { label: 'HIGH', value: 80, color: '#fbbf24' },
    { label: 'CRITICAL', value: 100, color: '#f87171' },
] as const;

const STATUS_COLORS: Record<string, string> = {
    PENDING: '#60a5fa',
    PROCESSING: '#a78bfa',
    COMPLETED: '#4ade80',
    FAILED: '#f87171',
    FAILED_RETRYABLE: '#fbbf24',
    DEAD: '#ef4444',
    SUSPENDED: '#f97316',
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function JobsView() {
    const {
        data, isLoading, isStale, isOffline,
        lastUpdated, error, refresh,
    } = useOfflineData<JobsListResponse>('/api/ops/jobs/list', {
        cacheKey: OFFLINE_KEYS.JOBS_LIST,
        ttlMs: OFFLINE_TTL.SHORT,      // 5 min cache
        refreshInterval: 10_000,        // 10s auto-refresh when online
    });

    const jobs = data?.jobs ?? [];

    const [loadingActions, setLoadingActions] = useState<Set<string>>(new Set());
    const [queuedActions, setQueuedActions] = useState<QueuedAction[]>([]);

    // ─── Format helpers ──────────────────────────────────────────────────

    const lastRefresh = lastUpdated
        ? new Date(lastUpdated).toLocaleTimeString()
        : '—';

    const timeAgoLabel = lastUpdated
        ? (() => {
            const sec = Math.floor((Date.now() - lastUpdated) / 1000);
            if (sec < 60) return `${sec}s ago`;
            if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
            return `${Math.floor(sec / 3600)}h ago`;
        })()
        : '';

    // ─── Actions ─────────────────────────────────────────────────────────

    const doAction = useCallback(async (jobId: string, action: string, body?: object) => {
        const key = `${jobId}:${action}`;
        const url = `/api/jobs/${jobId}/${action}`;
        const payload = body ?? {};

        // ── Offline path: enqueue to SyncQueue ──
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            getSyncQueue().enqueue(url, 'POST', payload);
            setQueuedActions(prev => [...prev, {
                jobId, action,
                value: (payload as Record<string, number>).value,
            }]);
            return;
        }

        // ── Online path: direct API call ──
        setLoadingActions(prev => new Set(prev).add(key));
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || `HTTP ${res.status}`);
            }
            // Refetch to get fresh state
            refresh();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Unknown error';

            // Network failed mid-call → enqueue to outbox
            if (msg === 'Failed to fetch' || msg.includes('NetworkError')) {
                getSyncQueue().enqueue(url, 'POST', payload);
                setQueuedActions(prev => [...prev, {
                    jobId, action,
                    value: (payload as Record<string, number>).value,
                }]);
            }
            // For other errors, silently ignore (idempotent retry will handle)
        } finally {
            setLoadingActions(prev => {
                const next = new Set(prev);
                next.delete(key);
                return next;
            });
        }
    }, [refresh]);

    const handleSuspend = (jobId: string) => doAction(jobId, 'suspend');
    const handleResume = (jobId: string) => doAction(jobId, 'resume');
    const handlePriority = (jobId: string, value: number) =>
        doAction(jobId, 'priority', { value });

    const isLoading_ = (jobId: string, action: string) =>
        loadingActions.has(`${jobId}:${action}`);

    const isAnyLoading = (jobId: string) =>
        Array.from(loadingActions).some(k => k.startsWith(jobId));

    const isQueued = (jobId: string) =>
        queuedActions.some(q => q.jobId === jobId);

    // ─── Badge helpers ───────────────────────────────────────────────────

    const priorityLabel = (p: number) => {
        if (p >= 100) return 'CRITICAL';
        if (p >= 80) return 'HIGH';
        if (p >= 50) return 'NORMAL';
        return 'LOW';
    };

    const priorityColor = (p: number) => {
        if (p >= 100) return '#f87171';
        if (p >= 80) return '#fbbf24';
        if (p >= 50) return '#60a5fa';
        return '#64748b';
    };

    const canSuspend = (status: string) =>
        status === 'PENDING' || status === 'FAILED_RETRYABLE';

    const canResume = (status: string) => status === 'SUSPENDED';

    const isTerminal = (status: string) =>
        ['COMPLETED', 'FAILED', 'DEAD'].includes(status);

    const timeAgo = (ms: number) => {
        const sec = Math.floor((Date.now() - ms) / 1000);
        if (sec < 60) return `${sec}s ago`;
        if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
        return `${Math.floor(sec / 3600)}h ago`;
    };

    // ─── Render ──────────────────────────────────────────────────────────

    return (
        <div>
            {/* Header */}
            <div style={st.headerRow}>
                <span style={st.count}>{jobs.length} jobs</span>
                {isOffline && (
                    <span style={st.offlineBadge}>📡 OFFLINE</span>
                )}
                {isStale && !isOffline && (
                    <span style={st.staleBadge}>⏱ Stale data</span>
                )}
                <span style={st.refreshBadge}>
                    {isOffline
                        ? `Cached ${timeAgoLabel}`
                        : `Auto-refresh 10s • ${lastRefresh}`
                    }
                </span>
                <button onClick={refresh} style={st.refreshBtn} disabled={isOffline}>
                    ↻ Refresh
                </button>
            </div>

            {error && <div style={st.errorBanner}>⚠ {error}</div>}

            {/* Queued actions banner */}
            {queuedActions.length > 0 && (
                <div style={st.queuedBanner}>
                    🔄 {queuedActions.length} action{queuedActions.length > 1 ? 's' : ''} queued
                    — will sync when online
                </div>
            )}

            {/* Loading state */}
            {isLoading && jobs.length === 0 ? (
                <div style={st.empty}>
                    <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>⏳</div>
                    <p style={st.emptyText}>Loading jobs...</p>
                </div>
            ) : jobs.length > 0 ? (
                <div style={st.tableWrap}>
                    <table style={st.table}>
                        <thead>
                            <tr>
                                <th style={st.th}>Job ID</th>
                                <th style={st.th}>Type</th>
                                <th style={st.th}>Status</th>
                                <th style={st.th}>Priority</th>
                                <th style={st.th}>Attempts</th>
                                <th style={st.th}>Updated</th>
                                <th style={st.th}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {jobs.map(job => (
                                <tr key={job.jobId} style={st.row}>
                                    <td style={st.td}>
                                        <span style={st.mono}>{job.jobId.slice(0, 8)}…</span>
                                    </td>
                                    <td style={st.td}>{job.jobType}</td>
                                    <td style={st.td}>
                                        <span style={{
                                            ...st.badge,
                                            background: `${STATUS_COLORS[job.status] ?? '#64748b'}22`,
                                            color: STATUS_COLORS[job.status] ?? '#64748b',
                                            borderColor: `${STATUS_COLORS[job.status] ?? '#64748b'}44`,
                                        }}>
                                            {job.status}
                                        </span>
                                        {isQueued(job.jobId) && (
                                            <span style={st.queuedBadge}>QUEUED</span>
                                        )}
                                    </td>
                                    <td style={st.td}>
                                        <span style={{
                                            ...st.badge,
                                            background: `${priorityColor(job.priority)}22`,
                                            color: priorityColor(job.priority),
                                            borderColor: `${priorityColor(job.priority)}44`,
                                        }}>
                                            {job.priority} {priorityLabel(job.priority)}
                                        </span>
                                    </td>
                                    <td style={st.td}>
                                        <span style={st.mono}>{job.attempts}/{job.maxAttempts}</span>
                                    </td>
                                    <td style={st.td}>
                                        <span style={st.timeAgo}>{timeAgo(job.updatedAt)}</span>
                                    </td>
                                    <td style={st.td}>
                                        <div style={st.actions}>
                                            {/* Suspend / Resume */}
                                            {canSuspend(job.status) && (
                                                <button
                                                    onClick={() => handleSuspend(job.jobId)}
                                                    disabled={isAnyLoading(job.jobId)}
                                                    style={{
                                                        ...st.actionBtn,
                                                        ...st.pauseBtn,
                                                        ...(isLoading_(job.jobId, 'suspend') ? st.loadingBtn : {}),
                                                    }}
                                                >
                                                    {isLoading_(job.jobId, 'suspend') ? '⏳' : '⏸'} Pause
                                                </button>
                                            )}
                                            {canResume(job.status) && (
                                                <button
                                                    onClick={() => handleResume(job.jobId)}
                                                    disabled={isAnyLoading(job.jobId)}
                                                    style={{
                                                        ...st.actionBtn,
                                                        ...st.resumeBtn,
                                                        ...(isLoading_(job.jobId, 'resume') ? st.loadingBtn : {}),
                                                    }}
                                                >
                                                    {isLoading_(job.jobId, 'resume') ? '⏳' : '▶'} Resume
                                                </button>
                                            )}

                                            {/* Priority Presets */}
                                            {!isTerminal(job.status) && (
                                                <select
                                                    value=""
                                                    onChange={(e) => {
                                                        const val = Number(e.target.value);
                                                        if (val > 0) handlePriority(job.jobId, val);
                                                    }}
                                                    disabled={isAnyLoading(job.jobId)}
                                                    style={st.prioritySelect}
                                                >
                                                    <option value="">Priority…</option>
                                                    {PRIORITY_PRESETS.map(p => (
                                                        <option key={p.value} value={p.value}>
                                                            {p.label} ({p.value})
                                                        </option>
                                                    ))}
                                                </select>
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
                    <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>📋</div>
                    <p style={st.emptyText}>
                        {isOffline ? 'No cached jobs — connect to load' : 'No jobs in queue'}
                    </p>
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════

const st: Record<string, React.CSSProperties> = {
    headerRow: {
        display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
        gap: 12, marginBottom: 16,
    },
    count: { fontSize: 13, color: '#94a3b8', fontWeight: 600, marginRight: 'auto' },
    refreshBadge: { fontSize: 12, color: '#64748b' },
    offlineBadge: {
        fontSize: 11, fontWeight: 700, color: '#fbbf24',
        background: 'rgba(234, 179, 8, 0.15)', border: '1px solid rgba(234, 179, 8, 0.3)',
        borderRadius: 6, padding: '2px 8px',
    },
    staleBadge: {
        fontSize: 11, fontWeight: 600, color: '#f97316',
        background: 'rgba(249, 115, 22, 0.1)', border: '1px solid rgba(249, 115, 22, 0.2)',
        borderRadius: 6, padding: '2px 8px',
    },
    refreshBtn: {
        background: 'rgba(96, 165, 250, 0.15)', color: '#60a5fa',
        border: '1px solid rgba(96, 165, 250, 0.3)', borderRadius: 8,
        padding: '6px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 500,
    },
    errorBanner: {
        background: 'rgba(248, 113, 113, 0.15)', border: '1px solid rgba(248, 113, 113, 0.3)',
        borderRadius: 8, padding: '10px 16px', color: '#fca5a5', marginBottom: 16, fontSize: 14,
    },
    queuedBanner: {
        background: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.25)',
        borderRadius: 8, padding: '8px 16px', color: '#93c5fd', marginBottom: 16,
        fontSize: 13, fontWeight: 500,
    },
    tableWrap: {
        background: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(148, 163, 184, 0.1)',
        borderRadius: 12, overflow: 'hidden',
    },
    table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: 13 },
    th: {
        textAlign: 'left' as const, padding: '10px 12px',
        borderBottom: '1px solid rgba(148, 163, 184, 0.15)',
        color: '#94a3b8', fontWeight: 600, fontSize: 11,
        textTransform: 'uppercase' as const, letterSpacing: 1,
        background: 'rgba(15, 23, 42, 0.4)',
    },
    td: {
        padding: '10px 12px', borderBottom: '1px solid rgba(148, 163, 184, 0.06)',
        verticalAlign: 'middle' as const,
    },
    row: { transition: 'background 0.15s ease' },
    mono: { fontFamily: 'monospace', fontSize: 12, color: '#94a3b8' },
    badge: {
        display: 'inline-block', padding: '2px 8px', borderRadius: 6,
        fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
        border: '1px solid',
    },
    queuedBadge: {
        display: 'inline-block', marginLeft: 6, padding: '1px 6px',
        borderRadius: 4, fontSize: 9, fontWeight: 700,
        background: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd',
        border: '1px solid rgba(59, 130, 246, 0.3)', letterSpacing: 0.5,
    },
    timeAgo: { fontSize: 12, color: '#64748b' },
    actions: { display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' as const },
    actionBtn: {
        border: '1px solid', borderRadius: 6, padding: '4px 10px',
        cursor: 'pointer', fontSize: 11, fontWeight: 600,
        transition: 'all 0.15s ease', background: 'transparent',
    },
    pauseBtn: {
        color: '#f97316', borderColor: 'rgba(249, 115, 22, 0.3)',
        background: 'rgba(249, 115, 22, 0.1)',
    },
    resumeBtn: {
        color: '#4ade80', borderColor: 'rgba(74, 222, 128, 0.3)',
        background: 'rgba(74, 222, 128, 0.1)',
    },
    loadingBtn: { opacity: 0.5, cursor: 'not-allowed' },
    prioritySelect: {
        background: 'rgba(30, 41, 59, 0.8)', color: '#e2e8f0',
        border: '1px solid rgba(148, 163, 184, 0.2)', borderRadius: 6,
        padding: '4px 8px', fontSize: 11, cursor: 'pointer',
    },
    empty: {
        background: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(148, 163, 184, 0.1)',
        borderRadius: 12, padding: '60px 24px', textAlign: 'center' as const,
    },
    emptyText: { color: '#64748b', fontSize: 13, fontStyle: 'italic' as const },
};
