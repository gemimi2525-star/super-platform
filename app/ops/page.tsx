'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Ops Center — Runtime Metrics Dashboard (Phase 22B)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Standalone /ops page: counters, rates, stuck jobs, active workers.
 * Auto-refreshes every 10s.
 */

import { useEffect, useState, useCallback } from 'react';

interface MetricsSummary {
    counters: Record<string, number>;
    aggregated: { total: number; completed: number; dead: number; retryable: number };
    rates: { successRate: number; deadRate: number; retryRate: number };
    activeWorkers: string[];
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

export default function OpsCenter() {
    const [summary, setSummary] = useState<MetricsSummary | null>(null);
    const [stuck, setStuck] = useState<StuckJobsResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [lastRefresh, setLastRefresh] = useState<string>('');

    const fetchData = useCallback(async () => {
        try {
            const [summaryRes, stuckRes] = await Promise.all([
                fetch('/api/ops/metrics/summary'),
                fetch('/api/ops/jobs/stuck'),
            ]);

            if (summaryRes.ok) setSummary(await summaryRes.json());
            if (stuckRes.ok) setStuck(await stuckRes.json());

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
        <div style={styles.container}>
            <header style={styles.header}>
                <div>
                    <h1 style={styles.title}>◈ Ops Center</h1>
                    <p style={styles.subtitle}>Runtime Metrics — Phase 22B</p>
                </div>
                <div style={styles.headerRight}>
                    <span style={styles.refreshBadge}>
                        Auto-refresh 10s • {lastRefresh}
                    </span>
                    <button onClick={fetchData} style={styles.refreshBtn}>↻ Refresh</button>
                </div>
            </header>

            {error && <div style={styles.errorBanner}>⚠ {error}</div>}

            {/* Rate Cards */}
            <section style={styles.cardGrid}>
                <MetricCard
                    label="Success Rate"
                    value={summary ? `${summary.rates.successRate}%` : '—'}
                    color="#4ade80"
                    detail={`${summary?.aggregated.completed ?? 0} / ${summary?.aggregated.total ?? 0} jobs`}
                />
                <MetricCard
                    label="Dead Rate"
                    value={summary ? `${summary.rates.deadRate}%` : '—'}
                    color="#f87171"
                    detail={`${summary?.aggregated.dead ?? 0} dead-lettered`}
                />
                <MetricCard
                    label="Retry Rate"
                    value={summary ? `${summary.rates.retryRate}%` : '—'}
                    color="#fbbf24"
                    detail={`${summary?.aggregated.retryable ?? 0} retried`}
                />
                <MetricCard
                    label="Total Jobs"
                    value={summary ? `${summary.aggregated.total}` : '—'}
                    color="#60a5fa"
                    detail="Lifetime enqueued"
                />
            </section>

            {/* Active Workers + Stuck Jobs */}
            <section style={styles.panelGrid}>
                <div style={styles.panel}>
                    <h3 style={styles.panelTitle}>🟢 Active Workers</h3>
                    {summary?.activeWorkers.length ? (
                        <ul style={styles.workerList}>
                            {summary.activeWorkers.map((w) => (
                                <li key={w} style={styles.workerItem}>
                                    <span style={styles.greenDot}></span> {w}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p style={styles.emptyText}>No active workers (no heartbeat in 60s)</p>
                    )}
                </div>

                <div style={styles.panel}>
                    <h3 style={styles.panelTitle}>
                        🔴 Stuck Jobs {stuck?.count ? <span style={styles.stuckBadge}>{stuck.count}</span> : null}
                    </h3>
                    {stuck?.jobs.length ? (
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>Job ID</th>
                                    <th style={styles.th}>Type</th>
                                    <th style={styles.th}>Worker</th>
                                    <th style={styles.th}>Stuck</th>
                                    <th style={styles.th}>Attempts</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stuck.jobs.map((j) => (
                                    <tr key={j.jobId}>
                                        <td style={styles.td}>{j.jobId.slice(0, 8)}…</td>
                                        <td style={styles.td}>{j.jobType}</td>
                                        <td style={styles.td}>{j.workerId ?? '—'}</td>
                                        <td style={styles.td}>{j.stuckForSec}s</td>
                                        <td style={styles.td}>{j.attempts}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p style={styles.emptyText}>No stuck jobs ✅</p>
                    )}
                </div>
            </section>

            {/* Raw Counters */}
            <section style={styles.panel}>
                <h3 style={styles.panelTitle}>📊 All Counters</h3>
                {summary?.counters && Object.keys(summary.counters).length > 0 ? (
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Counter</th>
                                <th style={styles.th}>Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(summary.counters)
                                .sort(([a], [b]) => a.localeCompare(b))
                                .map(([key, value]) => (
                                    <tr key={key}>
                                        <td style={styles.td}>{key}</td>
                                        <td style={{ ...styles.td, fontFamily: 'monospace', fontWeight: 600 }}>
                                            {value}
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                ) : (
                    <p style={styles.emptyText}>No counters recorded yet</p>
                )}
            </section>
        </div>
    );
}

// ─── Reusable Card Component ───
function MetricCard({ label, value, color, detail }: {
    label: string; value: string; color: string; detail: string;
}) {
    return (
        <div style={styles.card}>
            <div style={{ ...styles.cardValue, color }}>{value}</div>
            <div style={styles.cardLabel}>{label}</div>
            <div style={styles.cardDetail}>{detail}</div>
        </div>
    );
}

// ─── Styles ───
const styles: Record<string, React.CSSProperties> = {
    container: {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        color: '#e2e8f0',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", sans-serif',
        padding: '32px',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32,
        borderBottom: '1px solid rgba(148, 163, 184, 0.15)',
        paddingBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 700,
        margin: 0,
        background: 'linear-gradient(135deg, #60a5fa, #a78bfa)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
    },
    subtitle: {
        fontSize: 13,
        color: '#94a3b8',
        margin: '4px 0 0',
        letterSpacing: 1,
    },
    headerRight: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
    },
    refreshBadge: {
        fontSize: 12,
        color: '#64748b',
    },
    refreshBtn: {
        background: 'rgba(96, 165, 250, 0.15)',
        color: '#60a5fa',
        border: '1px solid rgba(96, 165, 250, 0.3)',
        borderRadius: 8,
        padding: '6px 14px',
        cursor: 'pointer',
        fontSize: 13,
        fontWeight: 500,
    },
    errorBanner: {
        background: 'rgba(248, 113, 113, 0.15)',
        border: '1px solid rgba(248, 113, 113, 0.3)',
        borderRadius: 8,
        padding: '10px 16px',
        color: '#fca5a5',
        marginBottom: 24,
        fontSize: 14,
    },
    cardGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16,
        marginBottom: 24,
    },
    card: {
        background: 'rgba(30, 41, 59, 0.6)',
        border: '1px solid rgba(148, 163, 184, 0.1)',
        borderRadius: 12,
        padding: '20px 24px',
        backdropFilter: 'blur(10px)',
    },
    cardValue: {
        fontSize: 36,
        fontWeight: 800,
        fontFamily: 'monospace',
        lineHeight: 1,
    },
    cardLabel: {
        fontSize: 13,
        color: '#94a3b8',
        fontWeight: 600,
        marginTop: 8,
        textTransform: 'uppercase' as const,
        letterSpacing: 1,
    },
    cardDetail: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 4,
    },
    panelGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: 16,
        marginBottom: 24,
    },
    panel: {
        background: 'rgba(30, 41, 59, 0.6)',
        border: '1px solid rgba(148, 163, 184, 0.1)',
        borderRadius: 12,
        padding: '20px 24px',
        marginBottom: 16,
    },
    panelTitle: {
        fontSize: 16,
        fontWeight: 600,
        margin: '0 0 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
    },
    stuckBadge: {
        background: '#ef4444',
        color: 'white',
        borderRadius: 10,
        padding: '2px 8px',
        fontSize: 12,
        fontWeight: 700,
    },
    workerList: {
        listStyle: 'none',
        padding: 0,
        margin: 0,
    },
    workerItem: {
        padding: '6px 0',
        fontSize: 14,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
    },
    greenDot: {
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: '#4ade80',
        display: 'inline-block',
    },
    emptyText: {
        color: '#64748b',
        fontSize: 13,
        fontStyle: 'italic' as const,
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse' as const,
        fontSize: 13,
    },
    th: {
        textAlign: 'left' as const,
        padding: '8px 12px',
        borderBottom: '1px solid rgba(148, 163, 184, 0.15)',
        color: '#94a3b8',
        fontWeight: 600,
        fontSize: 11,
        textTransform: 'uppercase' as const,
        letterSpacing: 1,
    },
    td: {
        padding: '8px 12px',
        borderBottom: '1px solid rgba(148, 163, 184, 0.06)',
    },
};
