'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SystemStatusView — Shared Component (Phase 26A)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Self-contained System Status view used by:
 *   - /ops page (full page)
 *   - OS Shell Monitor Hub (compact mirror)
 *
 * Fetches /api/ops/metrics/summary + /api/platform/health on mount + 10s interval.
 *
 * @module coreos/ops/ui/SystemStatusView
 * @version 1.0.0
 */

import React, { useState, useEffect, useCallback } from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface ThresholdViolation {
    type: string;
    value: number;
    threshold: number;
    message: string;
}

interface MetricsSummary {
    counters: Record<string, number>;
    aggregated: { total: number; completed: number; dead: number; retryable: number };
    rates: { successRate: number; deadRate: number; retryRate: number };
    activeWorkers: string[];
    systemStatus: 'HEALTHY' | 'DEGRADED';
    unresolvedAlerts: number;
    violations: ThresholdViolation[];
    generatedAt: string;
}

interface HealthData {
    status: string;
    timestamp: string;
    build?: { commit: string; environment: string };
    uptime?: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// PROPS
// ═══════════════════════════════════════════════════════════════════════════

interface SystemStatusViewProps {
    compact?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function SystemStatusView({ compact = false }: SystemStatusViewProps) {
    const [summary, setSummary] = useState<MetricsSummary | null>(null);
    const [health, setHealth] = useState<HealthData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [lastRefresh, setLastRefresh] = useState('');

    const fetchData = useCallback(async () => {
        try {
            const [summaryRes, healthRes] = await Promise.allSettled([
                fetch('/api/ops/metrics/summary'),
                fetch('/api/platform/health'),
            ]);
            if (summaryRes.status === 'fulfilled' && summaryRes.value.ok)
                setSummary(await summaryRes.value.json());
            if (healthRes.status === 'fulfilled' && healthRes.value.ok)
                setHealth(await healthRes.value.json());
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

    const isDegraded = summary?.systemStatus === 'DEGRADED';

    return (
        <div style={{ padding: compact ? 0 : undefined }}>
            {/* Header */}
            {!compact && (
                <div style={s.headerRow}>
                    <span style={s.refreshBadge}>Auto-refresh 10s • {lastRefresh}</span>
                    <button onClick={fetchData} style={s.refreshBtn}>↻ Refresh</button>
                </div>
            )}

            {error && <div style={s.errorBanner}>⚠ {error}</div>}

            {/* System Status Banner */}
            <div style={{
                ...s.alertBanner,
                ...(isDegraded ? s.alertDegraded : s.alertHealthy),
            }}>
                <div style={s.alertLeft}>
                    <span style={{
                        ...s.statusDot,
                        background: isDegraded ? '#ef4444' : '#4ade80',
                        boxShadow: isDegraded
                            ? '0 0 8px rgba(239, 68, 68, 0.6)'
                            : '0 0 8px rgba(74, 222, 128, 0.6)',
                    }} />
                    <span style={s.alertTitle}>
                        System: {summary?.systemStatus ?? 'LOADING'}
                    </span>
                </div>
                <div>
                    {isDegraded && summary?.unresolvedAlerts ? (
                        <span style={s.alertBadge}>
                            {summary.unresolvedAlerts} unresolved alert{summary.unresolvedAlerts !== 1 ? 's' : ''}
                        </span>
                    ) : (
                        <span style={s.alertOk}>All systems operational</span>
                    )}
                </div>
            </div>

            {/* Violations */}
            {isDegraded && summary?.violations && summary.violations.length > 0 && (
                <div style={s.violationPanel}>
                    <h4 style={s.violationTitle}>⚠ Active Violations</h4>
                    {summary.violations.map((v, i) => (
                        <div key={i} style={s.violationItem}>
                            <span style={s.violationBadge}>{v.type}</span>
                            <span style={s.violationMsg}>{v.message}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Health Info + Quick Stats */}
            <div style={s.panelGrid}>
                <div style={s.panel}>
                    <h3 style={s.panelTitle}>🏥 Platform Health</h3>
                    <div style={s.kvList}>
                        <KV label="Status" value={health?.status ?? '—'} />
                        <KV label="Environment" value={health?.build?.environment ?? '—'} />
                        <KV label="Commit" value={health?.build?.commit?.slice(0, 8) ?? '—'} />
                        <KV label="Uptime" value={health?.uptime ? `${Math.floor(health.uptime / 3600)}h ${Math.floor((health.uptime % 3600) / 60)}m` : '—'} />
                    </div>
                </div>
                <div style={s.panel}>
                    <h3 style={s.panelTitle}>📈 Quick Stats</h3>
                    <div style={s.kvList}>
                        <KV label="Total Jobs" value={String(summary?.aggregated.total ?? '—')} />
                        <KV label="Success Rate" value={summary ? `${summary.rates.successRate}%` : '—'} />
                        <KV label="Active Workers" value={String(summary?.activeWorkers.length ?? '—')} />
                        <KV label="Unresolved Alerts" value={String(summary?.unresolvedAlerts ?? '—')} />
                    </div>
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function KV({ label, value }: { label: string; value: string }) {
    return (
        <div style={s.kvRow}>
            <span style={s.kvLabel}>{label}</span>
            <span style={s.kvValue}>{value}</span>
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
    alertBanner: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderRadius: 12, padding: '14px 20px', marginBottom: 20, transition: 'all 0.3s ease',
    },
    alertHealthy: { background: 'rgba(74, 222, 128, 0.08)', border: '1px solid rgba(74, 222, 128, 0.25)' },
    alertDegraded: { background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.4)' },
    alertLeft: { display: 'flex', alignItems: 'center', gap: 12 },
    statusDot: { width: 12, height: 12, borderRadius: '50%', display: 'inline-block' },
    alertTitle: { fontSize: 15, fontWeight: 600, letterSpacing: 0.5 },
    alertBadge: {
        background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5',
        border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 8,
        padding: '4px 12px', fontSize: 13, fontWeight: 600,
    },
    alertOk: { color: '#86efac', fontSize: 13, fontWeight: 500 },
    violationPanel: {
        background: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.2)',
        borderRadius: 12, padding: '16px 20px', marginBottom: 20,
    },
    violationTitle: { fontSize: 14, fontWeight: 600, color: '#fca5a5', margin: '0 0 10px' },
    violationItem: { display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' },
    violationBadge: {
        background: 'rgba(239, 68, 68, 0.15)', color: '#f87171',
        border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 6,
        padding: '2px 8px', fontSize: 11, fontWeight: 700, fontFamily: 'monospace',
        whiteSpace: 'nowrap' as const,
    },
    violationMsg: { fontSize: 13, color: '#e2e8f0' },
    panelGrid: {
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 16, marginBottom: 20,
    },
    panel: {
        background: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(148, 163, 184, 0.1)',
        borderRadius: 12, padding: '20px 24px',
    },
    panelTitle: {
        fontSize: 16, fontWeight: 600, margin: '0 0 12px',
        display: 'flex', alignItems: 'center', gap: 8,
    },
    kvList: { display: 'flex', flexDirection: 'column', gap: 8 },
    kvRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' },
    kvLabel: { fontSize: 13, color: '#94a3b8' },
    kvValue: { fontSize: 13, fontWeight: 600, fontFamily: 'monospace', color: '#e2e8f0' },
};
