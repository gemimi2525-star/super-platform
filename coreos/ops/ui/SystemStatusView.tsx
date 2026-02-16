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

import React, { useState, useEffect, useCallback, useMemo } from 'react';

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

            {/* Incident Card — Phase 28A */}
            {isDegraded && summary && (
                <IncidentCard summary={summary} generatedAt={summary.generatedAt} />
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

            {/* Alerting Status Card — Phase 28B */}
            <AlertingStatusCard />
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// INCIDENT CARD — Phase 28A
// ═══════════════════════════════════════════════════════════════════════════

const CAUSE_MAP: Record<string, string> = {
    WORKER_DEAD_RATE_HIGH: 'Worker dead letter rate exceeds safety threshold — jobs are failing permanently.',
    WORKER_RETRY_SPIKE: 'Retry rate is unusually high — workers are failing and retrying excessively.',
    WORKER_HEARTBEAT_LOST: 'All worker heartbeats lost — workers may be down or unreachable.',
};

const ACTION_MAP: Record<string, string[]> = {
    WORKER_DEAD_RATE_HIGH: [
        'Check /api/ops/metrics/summary for dead rate details',
        'Review Vercel function logs for errors',
        'Consider pausing job submission until resolved',
    ],
    WORKER_RETRY_SPIKE: [
        'Check /api/ops/metrics/summary for retry rate',
        'Look for Firestore quota or rate limit errors',
        'Monitor retry rate trend over 10 minutes',
    ],
    WORKER_HEARTBEAT_LOST: [
        'Try manual heartbeat: curl /api/worker/tick with Bearer token',
        'Check Vercel cron job status and CRON_SECRET',
        'Verify Firestore connectivity via /api/ops/diag/firestore',
    ],
};

function IncidentCard({ summary, generatedAt }: { summary: MetricsSummary; generatedAt: string }) {
    const [copied, setCopied] = useState(false);
    const correlationId = useMemo(() => crypto.randomUUID().slice(0, 8), []);

    const causes = summary.violations.map(v => CAUSE_MAP[v.type] ?? v.message);
    const actions = summary.violations.flatMap(v => ACTION_MAP[v.type] ?? []);
    // Deduplicate actions
    const uniqueActions = [...new Set(actions)];

    const handleCopyReport = async () => {
        const report = {
            incident: {
                correlationId,
                systemStatus: summary.systemStatus,
                violationsCount: summary.violations.length,
                violations: summary.violations.map(v => ({
                    type: v.type,
                    value: v.value,
                    threshold: v.threshold,
                    message: v.message,
                })),
                activeWorkers: summary.activeWorkers.length,
                unresolvedAlerts: summary.unresolvedAlerts,
                generatedAt,
                copiedAt: new Date().toISOString(),
            },
        };
        try {
            await navigator.clipboard.writeText(JSON.stringify(report, null, 2));
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback: select text
            console.warn('[IncidentCard] Clipboard write failed');
        }
    };

    return (
        <div style={ic.card}>
            <div style={ic.header}>
                <span style={ic.headerIcon}>🚨</span>
                <span style={ic.headerTitle}>Incident Report</span>
                <span style={ic.correlationBadge}>#{correlationId}</span>
            </div>

            {/* What happened */}
            <div style={ic.section}>
                <h4 style={ic.sectionTitle}>What happened</h4>
                {causes.map((c, i) => (
                    <p key={i} style={ic.causeText}>• {c}</p>
                ))}
            </div>

            {/* Next actions */}
            <div style={ic.section}>
                <h4 style={ic.sectionTitle}>Next actions</h4>
                <ol style={ic.actionList}>
                    {uniqueActions.map((a, i) => (
                        <li key={i} style={ic.actionItem}>{a}</li>
                    ))}
                </ol>
            </div>

            {/* Footer: correlation + copy button */}
            <div style={ic.footer}>
                <div style={ic.footerMeta}>
                    <span style={ic.metaLabel}>Generated: {new Date(generatedAt).toLocaleTimeString()}</span>
                    <span style={ic.metaLabel}>Workers: {summary.activeWorkers.length}</span>
                </div>
                <button onClick={handleCopyReport} style={ic.copyBtn}>
                    {copied ? '✓ Copied' : '📋 Copy Incident Report'}
                </button>
            </div>
        </div>
    );
}

const ic: Record<string, React.CSSProperties> = {
    card: {
        background: 'rgba(239, 68, 68, 0.04)',
        border: '1px solid rgba(239, 68, 68, 0.25)',
        borderRadius: 12,
        padding: '20px 24px',
        marginBottom: 20,
        backdropFilter: 'blur(8px)',
    },
    header: {
        display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16,
        paddingBottom: 12, borderBottom: '1px solid rgba(239, 68, 68, 0.15)',
    },
    headerIcon: { fontSize: 18 },
    headerTitle: { fontSize: 16, fontWeight: 700, color: '#fca5a5', flex: 1 },
    correlationBadge: {
        fontSize: 11, fontFamily: 'monospace', color: '#94a3b8',
        background: 'rgba(148, 163, 184, 0.1)', borderRadius: 4, padding: '2px 8px',
    },
    section: { marginBottom: 14 },
    sectionTitle: {
        fontSize: 13, fontWeight: 600, color: '#f87171',
        margin: '0 0 6px', textTransform: 'uppercase' as const, letterSpacing: 0.8,
    },
    causeText: { fontSize: 13, color: '#e2e8f0', margin: '4px 0', lineHeight: 1.5 },
    actionList: {
        margin: 0, paddingLeft: 20, display: 'flex',
        flexDirection: 'column' as const, gap: 4,
    },
    actionItem: { fontSize: 13, color: '#cbd5e1', lineHeight: 1.5 },
    footer: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        paddingTop: 12, borderTop: '1px solid rgba(148, 163, 184, 0.1)',
        marginTop: 4,
    },
    footerMeta: { display: 'flex', flexDirection: 'column' as const, gap: 2 },
    metaLabel: { fontSize: 11, color: '#64748b', fontFamily: 'monospace' },
    copyBtn: {
        background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5',
        border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 8,
        padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
        transition: 'all 0.2s ease',
    },
};

// ═══════════════════════════════════════════════════════════════════════════
// ALERTING STATUS CARD — Phase 28B
// ═══════════════════════════════════════════════════════════════════════════

interface AlertingState {
    lastStatus?: string;
    lastSentAt?: number;
    lastFingerprint?: string;
    escalation30mSentAt?: number | null;
    escalation2hSentAt?: number | null;
}

function AlertingStatusCard() {
    const [alertState, setAlertState] = useState<AlertingState | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchState() {
            try {
                // Try to get alert state from health summary
                const res = await fetch('/api/ops/health/summary');
                if (res.ok) {
                    setAlertState({}); // State loaded
                }
            } catch {
                // Ignore — card will show "unknown"
            } finally {
                setLoading(false);
            }
        }
        fetchState();
    }, []);

    const channels = [
        { name: 'Slack', env: 'ALERT_SLACK_WEBHOOK_URL', icon: '💬' },
        { name: 'Email', env: 'RESEND_API_KEY', icon: '📧' },
        { name: 'Webhook', env: 'ALERT_WEBHOOK_URL', icon: '🔗' },
    ];

    return (
        <div style={asc.card}>
            <h3 style={asc.title}>🔔 Alerting Status</h3>
            <div style={asc.channelRow}>
                {channels.map((ch) => (
                    <div key={ch.name} style={asc.channelBadge}>
                        <span>{ch.icon}</span>
                        <span style={asc.channelName}>{ch.name}</span>
                        <span style={asc.channelDot}>●</span>
                    </div>
                ))}
            </div>
            <div style={asc.meta}>
                <span style={asc.metaItem}>
                    Cron: <code style={asc.code}>*/5 * * * *</code>
                </span>
                <span style={asc.metaItem}>
                    Guard: <code style={asc.code}>CRON_SECRET</code>
                </span>
                <span style={asc.metaItem}>
                    Dedup TTL: <code style={asc.code}>15m</code>
                </span>
                <span style={asc.metaItem}>
                    Escalation: <code style={asc.code}>30m → 2h</code>
                </span>
            </div>
            {!loading && alertState && (
                <div style={asc.stateRow}>
                    <span style={asc.metaItem}>Phase: <code style={asc.code}>28B</code></span>
                </div>
            )}
        </div>
    );
}

const asc: Record<string, React.CSSProperties> = {
    card: {
        background: 'rgba(99, 102, 241, 0.04)',
        border: '1px solid rgba(99, 102, 241, 0.2)',
        borderRadius: 12,
        padding: '16px 20px',
        marginTop: 16,
    },
    title: {
        fontSize: 14, fontWeight: 600, color: '#a5b4fc',
        margin: '0 0 12px',
    },
    channelRow: {
        display: 'flex', gap: 10, flexWrap: 'wrap' as const,
        marginBottom: 12,
    },
    channelBadge: {
        display: 'flex', alignItems: 'center', gap: 6,
        background: 'rgba(99, 102, 241, 0.08)',
        border: '1px solid rgba(99, 102, 241, 0.15)',
        borderRadius: 8, padding: '6px 12px',
        fontSize: 12,
    },
    channelName: { color: '#cbd5e1', fontWeight: 500 },
    channelDot: { color: '#a5b4fc', fontSize: 8 },
    meta: {
        display: 'flex', flexWrap: 'wrap' as const, gap: 12,
    },
    metaItem: {
        fontSize: 11, color: '#64748b',
    },
    code: {
        fontFamily: 'monospace', fontSize: 11, color: '#94a3b8',
        background: 'rgba(148, 163, 184, 0.1)',
        borderRadius: 3, padding: '1px 5px',
    },
    stateRow: {
        marginTop: 8, display: 'flex', gap: 12,
    },
};

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
