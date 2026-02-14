'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * RuntimeMetricsView — Shared Component (Phase 26A)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Self-contained Runtime Metrics view used by:
 *   - /ops/runtime-metrics page
 *   - OS Shell Monitor Hub (compact mirror)
 *
 * Fetches /api/ops/metrics/summary + /api/ops/jobs/stuck on mount + 10s interval.
 *
 * @module coreos/ops/ui/RuntimeMetricsView
 * @version 1.0.0
 */

import React, { useState, useEffect, useCallback } from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface MetricsSummary {
    counters: Record<string, number>;
    aggregated: { total: number; completed: number; dead: number; retryable: number };
    rates: { successRate: number; deadRate: number; retryRate: number };
    activeWorkers: string[];
    systemStatus: 'HEALTHY' | 'DEGRADED';
    unresolvedAlerts: number;
    generatedAt: string;
}

interface StuckJobsResponse {
    count: number;
    jobs: Array<{
        jobId: string;
        jobType: string;
        workerId: string | null;
        stuckForSec: number;
        attempts: number;
    }>;
}

// ═══════════════════════════════════════════════════════════════════════════
// PROPS
// ═══════════════════════════════════════════════════════════════════════════

interface RuntimeMetricsViewProps {
    compact?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function RuntimeMetricsView({ compact = false }: RuntimeMetricsViewProps) {
    const [summary, setSummary] = useState<MetricsSummary | null>(null);
    const [stuck, setStuck] = useState<StuckJobsResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [lastRefresh, setLastRefresh] = useState('');

    const fetchData = useCallback(async () => {
        try {
            const [summaryRes, stuckRes] = await Promise.allSettled([
                fetch('/api/ops/metrics/summary'),
                fetch('/api/ops/jobs/stuck'),
            ]);
            if (summaryRes.status === 'fulfilled' && summaryRes.value.ok)
                setSummary(await summaryRes.value.json());
            if (stuckRes.status === 'fulfilled' && stuckRes.value.ok)
                setStuck(await stuckRes.value.json());
            setLastRefresh(new Date().toLocaleTimeString());
            setError(null);
        } catch (err: any) {
            setError(err.message);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10_000);
        return () => clearInterval(interval);
    }, [fetchData]);

    return (
        <div>
            {/* Header */}
            {!compact && (
                <div style={s.headerRow}>
                    <span style={s.refreshBadge}>Auto-refresh 10s • {lastRefresh}</span>
                    <button onClick={fetchData} style={s.refreshBtn}>↻ Refresh</button>
                </div>
            )}

            {error && <div style={s.errorBanner}>⚠ {error}</div>}

            {/* Rate Cards */}
            <section style={s.cardGrid}>
                <MetricCard label="Success Rate" value={summary ? `${summary.rates.successRate}%` : '—'} color="#4ade80" detail={`${summary?.aggregated.completed ?? 0} / ${summary?.aggregated.total ?? 0} jobs`} />
                <MetricCard label="Dead Rate" value={summary ? `${summary.rates.deadRate}%` : '—'} color="#f87171" detail={`${summary?.aggregated.dead ?? 0} dead-lettered`} />
                <MetricCard label="Retry Rate" value={summary ? `${summary.rates.retryRate}%` : '—'} color="#fbbf24" detail={`${summary?.aggregated.retryable ?? 0} retried`} />
                <MetricCard label="Total Jobs" value={summary ? `${summary.aggregated.total}` : '—'} color="#60a5fa" detail="Lifetime enqueued" />
            </section>

            {/* Workers + Stuck Jobs */}
            <section style={s.panelGrid}>
                <div style={s.panel}>
                    <h3 style={s.panelTitle}>🟢 Active Workers</h3>
                    {summary?.activeWorkers.length ? (
                        <ul style={s.workerList}>
                            {summary.activeWorkers.map(w => (
                                <li key={w} style={s.workerItem}>
                                    <span style={s.greenDot} /> {w}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p style={s.emptyText}>No active workers (no heartbeat in 60s)</p>
                    )}
                </div>
                <div style={s.panel}>
                    <h3 style={s.panelTitle}>
                        🔴 Stuck Jobs {stuck?.count ? <span style={s.stuckBadge}>{stuck.count}</span> : null}
                    </h3>
                    {stuck?.jobs.length ? (
                        <table style={s.table}>
                            <thead>
                                <tr>
                                    <th style={s.th}>Job ID</th>
                                    <th style={s.th}>Type</th>
                                    <th style={s.th}>Worker</th>
                                    <th style={s.th}>Stuck</th>
                                    <th style={s.th}>Attempts</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stuck.jobs.map(j => (
                                    <tr key={j.jobId}>
                                        <td style={s.td}>{j.jobId.slice(0, 8)}…</td>
                                        <td style={s.td}>{j.jobType}</td>
                                        <td style={s.td}>{j.workerId ?? '—'}</td>
                                        <td style={s.td}>{j.stuckForSec}s</td>
                                        <td style={s.td}>{j.attempts}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p style={s.emptyText}>No stuck jobs ✅</p>
                    )}
                </div>
            </section>

            {/* Raw Counters */}
            <section style={s.panel}>
                <h3 style={s.panelTitle}>📊 All Counters</h3>
                {summary?.counters && Object.keys(summary.counters).length > 0 ? (
                    <table style={s.table}>
                        <thead>
                            <tr>
                                <th style={s.th}>Counter</th>
                                <th style={s.th}>Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(summary.counters)
                                .sort(([a], [b]) => a.localeCompare(b))
                                .map(([key, value]) => (
                                    <tr key={key}>
                                        <td style={s.td}>{key}</td>
                                        <td style={{ ...s.td, fontFamily: 'monospace', fontWeight: 600 }}>{value}</td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                ) : (
                    <p style={s.emptyText}>No counters recorded yet</p>
                )}
            </section>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function MetricCard({ label, value, color, detail }: {
    label: string; value: string; color: string; detail: string;
}) {
    return (
        <div style={s.card}>
            <div style={{ ...s.cardValue, color }}>{value}</div>
            <div style={s.cardLabel}>{label}</div>
            <div style={s.cardDetail}>{detail}</div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════

const s: Record<string, React.CSSProperties> = {
    headerRow: {
        display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, marginBottom: 16,
    },
    refreshBadge: { fontSize: 12, color: '#64748b' },
    refreshBtn: {
        background: 'rgba(96, 165, 250, 0.15)', color: '#60a5fa',
        border: '1px solid rgba(96, 165, 250, 0.3)', borderRadius: 8,
        padding: '6px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 500,
    },
    errorBanner: {
        background: 'rgba(248, 113, 113, 0.15)', border: '1px solid rgba(248, 113, 113, 0.3)',
        borderRadius: 8, padding: '10px 16px', color: '#fca5a5', marginBottom: 16, fontSize: 14,
    },
    cardGrid: {
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16, marginBottom: 20,
    },
    card: {
        background: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(148, 163, 184, 0.1)',
        borderRadius: 12, padding: '20px 24px', backdropFilter: 'blur(10px)',
    },
    cardValue: { fontSize: 36, fontWeight: 800, fontFamily: 'monospace', lineHeight: 1 },
    cardLabel: {
        fontSize: 13, color: '#94a3b8', fontWeight: 600, marginTop: 8,
        textTransform: 'uppercase' as const, letterSpacing: 1,
    },
    cardDetail: { fontSize: 12, color: '#64748b', marginTop: 4 },
    panelGrid: {
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 16, marginBottom: 20,
    },
    panel: {
        background: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(148, 163, 184, 0.1)',
        borderRadius: 12, padding: '20px 24px', marginBottom: 16,
    },
    panelTitle: {
        fontSize: 16, fontWeight: 600, margin: '0 0 12px',
        display: 'flex', alignItems: 'center', gap: 8,
    },
    workerList: { listStyle: 'none', padding: 0, margin: 0 },
    workerItem: { padding: '6px 0', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 },
    greenDot: { width: 8, height: 8, borderRadius: '50%', background: '#4ade80', display: 'inline-block' },
    stuckBadge: { background: '#ef4444', color: 'white', borderRadius: 10, padding: '2px 8px', fontSize: 12, fontWeight: 700 },
    emptyText: { color: '#64748b', fontSize: 13, fontStyle: 'italic' as const },
    table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: 13 },
    th: {
        textAlign: 'left' as const, padding: '8px 12px',
        borderBottom: '1px solid rgba(148, 163, 184, 0.15)',
        color: '#94a3b8', fontWeight: 600, fontSize: 11,
        textTransform: 'uppercase' as const, letterSpacing: 1,
    },
    td: { padding: '8px 12px', borderBottom: '1px solid rgba(148, 163, 184, 0.06)' },
};
