'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * DeployTimelineCard — Phase 35B
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Owner-only expandable card showing deploy history as a vertical timeline.
 * Fetches /api/ops/phase-ledger/timeline with env filter.
 *
 * @module coreos/ops/ui/DeployTimelineCard
 */

import React, { useState, useEffect, useCallback } from 'react';
import type { TimelineEntry } from '@/coreos/ops/phaseLedger/types';

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

type EnvFilter = 'all' | 'production' | 'preview';

export default function DeployTimelineCard() {
    const [expanded, setExpanded] = useState(false);
    const [items, setItems] = useState<TimelineEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [envFilter, setEnvFilter] = useState<EnvFilter>('production');

    const fetchTimeline = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({ limit: '15' });
            if (envFilter !== 'all') params.set('env', envFilter);
            const res = await fetch(`/api/ops/phase-ledger/timeline?${params}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();
            if (json.ok) setItems(json.data.items);
            else throw new Error(json.error ?? 'Unknown error');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [envFilter]);

    useEffect(() => {
        if (expanded) fetchTimeline();
    }, [expanded, fetchTimeline]);

    const formatTs = (ts: any): string => {
        const secs = ts?._seconds ?? ts?.seconds;
        if (!secs) return '—';
        return new Date(secs * 1000).toLocaleString('en-US', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
        });
    };

    return (
        <div style={st.card}>
            {/* Header */}
            <button onClick={() => setExpanded(v => !v)} style={st.header}>
                <span style={{
                    ...st.chevron,
                    transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
                }}>▶</span>
                <span style={st.headerTitle}>📅 Deploy Timeline</span>
                <span style={st.badge}>{items.length > 0 ? `${items.length} entries` : ''}</span>
            </button>

            {/* Body */}
            {expanded && (
                <div style={st.body}>
                    {/* Env Filter */}
                    <div style={st.filterRow}>
                        {(['production', 'preview', 'all'] as EnvFilter[]).map(env => (
                            <button
                                key={env}
                                onClick={() => setEnvFilter(env)}
                                style={{
                                    ...st.filterBtn,
                                    ...(envFilter === env ? st.filterActive : {}),
                                }}
                            >
                                {env === 'all' ? 'All' : env.charAt(0).toUpperCase() + env.slice(1)}
                            </button>
                        ))}
                    </div>

                    {loading && <div style={st.loadingText}>Loading…</div>}
                    {error && <div style={st.errorText}>⚠ {error}</div>}

                    {!loading && !error && items.length === 0 && (
                        <div style={st.emptyText}>No deployments found</div>
                    )}

                    {/* Timeline */}
                    {!loading && items.length > 0 && (
                        <div style={st.timeline}>
                            {items.map((item, i) => {
                                const isOk = item.integrityStatus === 'OK' && item.governanceOk;
                                const dotColor = isOk ? '#4ade80' : '#ef4444';
                                return (
                                    <div key={item.id} style={st.timelineRow}>
                                        {/* Line + Dot */}
                                        <div style={st.timelineTrack}>
                                            <span style={{
                                                ...st.dot,
                                                background: dotColor,
                                                boxShadow: `0 0 6px ${dotColor}40`,
                                            }} />
                                            {i < items.length - 1 && <div style={st.line} />}
                                        </div>

                                        {/* Content */}
                                        <div style={st.timelineContent}>
                                            <div style={st.rowTop}>
                                                <span style={st.phaseBadge}>P{item.phaseId}</span>
                                                <code style={st.commitCode}>{item.commitShort}</code>
                                                <span style={st.versionText}>v{item.version}</span>
                                                <span style={{
                                                    ...st.envBadge,
                                                    color: item.environment === 'production' ? '#4ade80' : '#60a5fa',
                                                    borderColor: item.environment === 'production'
                                                        ? 'rgba(74, 222, 128, 0.3)'
                                                        : 'rgba(96, 165, 250, 0.3)',
                                                }}>
                                                    {item.environment === 'production' ? '🟢' : '🔵'} {item.environment}
                                                </span>
                                            </div>
                                            <div style={st.rowBottom}>
                                                <span style={{
                                                    ...st.statusBadge,
                                                    color: isOk ? '#4ade80' : '#fca5a5',
                                                    background: isOk
                                                        ? 'rgba(74, 222, 128, 0.1)'
                                                        : 'rgba(239, 68, 68, 0.1)',
                                                }}>
                                                    {isOk ? '✓ OK' : '✗ DEGRADED'}
                                                </span>
                                                {item.hashValid && (
                                                    <span style={st.hashOk}>Hash ✓</span>
                                                )}
                                                <span style={st.timestamp}>{formatTs(item.createdAt)}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════

const st: Record<string, React.CSSProperties> = {
    card: {
        background: 'rgba(30, 41, 59, 0.5)',
        border: '1px solid rgba(148, 163, 184, 0.1)',
        borderRadius: 12,
        marginTop: 16,
        overflow: 'hidden',
    },
    header: {
        display: 'flex', alignItems: 'center', gap: 8,
        width: '100%', padding: '14px 20px',
        background: 'transparent', border: 'none', cursor: 'pointer',
        color: '#e2e8f0', fontSize: 14, fontWeight: 600,
        textAlign: 'left' as const,
    },
    chevron: {
        fontSize: 10, color: '#94a3b8',
        transition: 'transform 0.2s ease',
        display: 'inline-block',
    },
    headerTitle: { flex: 1 },
    badge: {
        fontSize: 11, color: '#64748b', fontFamily: 'monospace',
    },
    body: {
        padding: '0 20px 16px',
    },
    filterRow: {
        display: 'flex', gap: 6, marginBottom: 14,
    },
    filterBtn: {
        padding: '4px 12px', fontSize: 11, fontWeight: 500,
        background: 'rgba(148, 163, 184, 0.08)',
        border: '1px solid rgba(148, 163, 184, 0.12)',
        borderRadius: 6, cursor: 'pointer', color: '#94a3b8',
        transition: 'all 0.15s ease',
    },
    filterActive: {
        color: '#60a5fa',
        borderColor: 'rgba(96, 165, 250, 0.4)',
        background: 'rgba(96, 165, 250, 0.1)',
    },
    loadingText: { fontSize: 12, color: '#64748b', padding: '8px 0' },
    errorText: { fontSize: 12, color: '#fca5a5', padding: '8px 0' },
    emptyText: { fontSize: 12, color: '#64748b', padding: '16px 0', textAlign: 'center' as const },
    timeline: {
        display: 'flex', flexDirection: 'column' as const,
    },
    timelineRow: {
        display: 'flex', gap: 12, minHeight: 48,
    },
    timelineTrack: {
        display: 'flex', flexDirection: 'column' as const, alignItems: 'center',
        width: 16, flexShrink: 0,
    },
    dot: {
        width: 10, height: 10, borderRadius: '50%',
        flexShrink: 0, marginTop: 4,
    },
    line: {
        width: 2, flex: 1, background: 'rgba(148, 163, 184, 0.12)',
        marginTop: 4, marginBottom: 4,
    },
    timelineContent: {
        flex: 1, paddingBottom: 12,
        borderBottom: '1px solid rgba(148, 163, 184, 0.06)',
    },
    rowTop: {
        display: 'flex', flexWrap: 'wrap' as const, alignItems: 'center', gap: 8,
        marginBottom: 4,
    },
    phaseBadge: {
        fontSize: 11, fontWeight: 700, color: '#a78bfa',
        background: 'rgba(167, 139, 250, 0.1)',
        borderRadius: 4, padding: '1px 6px',
    },
    commitCode: {
        fontFamily: 'monospace', fontSize: 11, color: '#94a3b8',
        background: 'rgba(148, 163, 184, 0.1)',
        borderRadius: 3, padding: '1px 5px',
    },
    versionText: {
        fontSize: 11, color: '#64748b',
    },
    envBadge: {
        fontSize: 10, fontWeight: 500,
        border: '1px solid',
        borderRadius: 4, padding: '1px 6px',
    },
    rowBottom: {
        display: 'flex', alignItems: 'center', gap: 8,
    },
    statusBadge: {
        fontSize: 10, fontWeight: 600, borderRadius: 4, padding: '1px 6px',
    },
    hashOk: {
        fontSize: 10, color: '#4ade80',
    },
    timestamp: {
        fontSize: 10, color: '#64748b', marginLeft: 'auto',
    },
};
