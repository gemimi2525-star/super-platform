'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Monitor Hub — Owner-only Unified Monitoring Dashboard (Phase 25C)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Central hub for all operational monitoring:
 *   - Status tab: System health + alerts + violations (default)
 *   - Metrics tab: Runtime counters, rates, workers, stuck jobs
 *   - Brain tab: Proposal Engine quick-access
 *   - Workers tab: Placeholder (future)
 *   - Audit tab: Placeholder (future)
 *
 * Auto-refreshes every 10s. Owner-only via /ops/layout.tsx guard.
 *
 * @module app/ops/page
 * @version 2.0.0 (Phase 25C — Monitor Hub)
 */

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

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

interface HealthData {
    status: string;
    timestamp: string;
    build?: { commit: string; environment: string };
    uptime?: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB DEFINITION
// ═══════════════════════════════════════════════════════════════════════════

type TabId = 'status' | 'metrics' | 'brain' | 'workers' | 'audit';

const TABS: { id: TabId; label: string; icon: string }[] = [
    { id: 'status', label: 'System Status', icon: '🟢' },
    { id: 'metrics', label: 'Runtime Metrics', icon: '📊' },
    { id: 'brain', label: 'Brain', icon: '🧠' },
    { id: 'workers', label: 'Workers', icon: '⚙️' },
    { id: 'audit', label: 'Audit', icon: '📋' },
];

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function MonitorHub() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const tabParam = (searchParams.get('tab') || 'status') as TabId;
    const activeTab = TABS.some(t => t.id === tabParam) ? tabParam : 'status';

    const [summary, setSummary] = useState<MetricsSummary | null>(null);
    const [stuck, setStuck] = useState<StuckJobsResponse | null>(null);
    const [health, setHealth] = useState<HealthData | null>(null);
    const [proposalCount, setProposalCount] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [lastRefresh, setLastRefresh] = useState<string>('');

    const fetchData = useCallback(async () => {
        try {
            const [summaryRes, stuckRes, healthRes, brainRes] = await Promise.allSettled([
                fetch('/api/ops/metrics/summary'),
                fetch('/api/ops/jobs/stuck'),
                fetch('/api/platform/health'),
                fetch('/api/brain/proposals?limit=10'),
            ]);

            if (summaryRes.status === 'fulfilled' && summaryRes.value.ok)
                setSummary(await summaryRes.value.json());
            if (stuckRes.status === 'fulfilled' && stuckRes.value.ok)
                setStuck(await stuckRes.value.json());
            if (healthRes.status === 'fulfilled' && healthRes.value.ok)
                setHealth(await healthRes.value.json());
            if (brainRes.status === 'fulfilled' && brainRes.value.ok) {
                const d = await brainRes.value.json();
                setProposalCount(d.count ?? 0);
            }

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

    function setTab(id: TabId) {
        const params = new URLSearchParams(searchParams.toString());
        if (id === 'status') params.delete('tab');
        else params.set('tab', id);
        router.replace(`/ops${params.toString() ? '?' + params.toString() : ''}`);
    }

    const isDegraded = summary?.systemStatus === 'DEGRADED';

    return (
        <div style={s.container}>
            {/* ─── Header ─── */}
            <header style={s.header}>
                <div>
                    <h1 style={s.title}>◈ Monitor Hub</h1>
                    <p style={s.subtitle}>Phase 25C — Unified Operations Center</p>
                </div>
                <div style={s.headerRight}>
                    <span style={s.refreshBadge}>Auto-refresh 10s • {lastRefresh}</span>
                    <button onClick={fetchData} style={s.refreshBtn}>↻ Refresh</button>
                </div>
            </header>

            {error && <div style={s.errorBanner}>⚠ {error}</div>}

            {/* ─── System Status Banner (always visible) ─── */}
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

            {/* ─── Tab Navigation ─── */}
            <nav style={s.tabBar}>
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setTab(tab.id)}
                        style={{
                            ...s.tabBtn,
                            ...(activeTab === tab.id ? s.tabActive : {}),
                        }}
                    >
                        <span>{tab.icon}</span> {tab.label}
                    </button>
                ))}
            </nav>

            {/* ─── Tab Content ─── */}
            <div style={s.tabContent}>
                {activeTab === 'status' && (
                    <StatusTab summary={summary} health={health} isDegraded={isDegraded} />
                )}
                {activeTab === 'metrics' && (
                    <MetricsTab summary={summary} stuck={stuck} />
                )}
                {activeTab === 'brain' && (
                    <BrainTab proposalCount={proposalCount} />
                )}
                {activeTab === 'workers' && <PlaceholderTab name="Workers" icon="⚙️" />}
                {activeTab === 'audit' && <PlaceholderTab name="Audit" icon="📋" />}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB: STATUS
// ═══════════════════════════════════════════════════════════════════════════

function StatusTab({ summary, health, isDegraded }: {
    summary: MetricsSummary | null;
    health: HealthData | null;
    isDegraded: boolean;
}) {
    return (
        <>
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

            {/* Health Info */}
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
        </>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB: METRICS (migrated from old OpsCenter)
// ═══════════════════════════════════════════════════════════════════════════

function MetricsTab({ summary, stuck }: {
    summary: MetricsSummary | null;
    stuck: StuckJobsResponse | null;
}) {
    return (
        <>
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
        </>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB: BRAIN
// ═══════════════════════════════════════════════════════════════════════════

function BrainTab({ proposalCount }: { proposalCount: number | null }) {
    return (
        <div style={s.panel}>
            <h3 style={s.panelTitle}>🧠 Brain — Proposal Engine</h3>
            <div style={s.brainCard}>
                <div style={s.trustBanner}>
                    <div style={s.trustItem}>
                        <span style={s.trustLabel}>MODE</span>
                        <span style={s.trustDrafter}>DRAFTER</span>
                    </div>
                    <div style={s.trustDivider} />
                    <div style={s.trustItem}>
                        <span style={s.trustLabel}>EXECUTION</span>
                        <span style={s.trustLocked}>🔒 LOCKED</span>
                    </div>
                </div>
                <div style={{ padding: '16px 0' }}>
                    <p style={{ ...s.emptyText, fontSize: 14 }}>
                        Active Proposals: <span style={{ color: '#818cf8', fontWeight: 700, fontSize: 20 }}>
                            {proposalCount ?? '—'}
                        </span>
                    </p>
                </div>
                <button
                    onClick={() => window.location.href = '/ops/brain'}
                    style={s.brainBtn}
                >
                    🧠 Open Full Brain Dashboard →
                </button>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB: PLACEHOLDER
// ═══════════════════════════════════════════════════════════════════════════

function PlaceholderTab({ name, icon }: { name: string; icon: string }) {
    return (
        <div style={{ ...s.panel, textAlign: 'center', padding: '60px 24px' }}>
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>{icon}</div>
            <h3 style={{ ...s.panelTitle, justifyContent: 'center', color: '#64748b' }}>
                {name} — Coming Soon
            </h3>
            <p style={s.emptyText}>
                This section will be available in a future phase.
            </p>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// REUSABLE COMPONENTS
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
    container: {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        color: '#e2e8f0',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", sans-serif',
        padding: '32px',
    },
    header: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 20, borderBottom: '1px solid rgba(148, 163, 184, 0.15)', paddingBottom: 20,
    },
    title: {
        fontSize: 28, fontWeight: 700, margin: 0,
        background: 'linear-gradient(135deg, #60a5fa, #a78bfa)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
    },
    subtitle: { fontSize: 13, color: '#94a3b8', margin: '4px 0 0', letterSpacing: 1 },
    headerRight: { display: 'flex', alignItems: 'center', gap: 12 },
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

    // Alert Banner
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

    // Tab Bar
    tabBar: {
        display: 'flex', gap: 4, marginBottom: 24,
        borderBottom: '1px solid rgba(148, 163, 184, 0.12)', paddingBottom: 0,
    },
    tabBtn: {
        background: 'transparent', border: 'none', color: '#94a3b8',
        padding: '10px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 500,
        borderBottom: '2px solid transparent', display: 'flex', alignItems: 'center', gap: 6,
        transition: 'all 0.2s ease',
    },
    tabActive: {
        color: '#60a5fa', borderBottomColor: '#60a5fa', fontWeight: 600,
    },
    tabContent: { minHeight: 300 },

    // Violations
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

    // Panels & Cards
    panelGrid: {
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
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

    // KV List
    kvList: { display: 'flex', flexDirection: 'column', gap: 8 },
    kvRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' },
    kvLabel: { fontSize: 13, color: '#94a3b8' },
    kvValue: { fontSize: 13, fontWeight: 600, fontFamily: 'monospace', color: '#e2e8f0' },

    // Workers
    workerList: { listStyle: 'none', padding: 0, margin: 0 },
    workerItem: { padding: '6px 0', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 },
    greenDot: { width: 8, height: 8, borderRadius: '50%', background: '#4ade80', display: 'inline-block' },
    stuckBadge: { background: '#ef4444', color: 'white', borderRadius: 10, padding: '2px 8px', fontSize: 12, fontWeight: 700 },
    emptyText: { color: '#64748b', fontSize: 13, fontStyle: 'italic' as const },

    // Table
    table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: 13 },
    th: {
        textAlign: 'left' as const, padding: '8px 12px',
        borderBottom: '1px solid rgba(148, 163, 184, 0.15)',
        color: '#94a3b8', fontWeight: 600, fontSize: 11,
        textTransform: 'uppercase' as const, letterSpacing: 1,
    },
    td: { padding: '8px 12px', borderBottom: '1px solid rgba(148, 163, 184, 0.06)' },

    // Brain tab
    brainCard: {
        background: 'rgba(99, 102, 241, 0.04)', border: '1px solid rgba(99, 102, 241, 0.15)',
        borderRadius: 10, padding: 20,
    },
    trustBanner: {
        display: 'flex', alignItems: 'center', gap: 0,
        background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.25)',
        borderRadius: 10, padding: '10px 20px',
    },
    trustItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: 3 },
    trustDivider: { width: 1, height: 30, background: 'rgba(99, 102, 241, 0.25)' },
    trustLabel: { fontSize: 9, textTransform: 'uppercase' as const, letterSpacing: 1.5, color: 'rgba(255,255,255,0.35)' },
    trustDrafter: { fontSize: 13, fontWeight: 700, color: '#818cf8', letterSpacing: 1 },
    trustLocked: { fontSize: 13, fontWeight: 700, color: '#f59e0b', letterSpacing: 1 },
    brainBtn: {
        width: '100%', padding: '12px 20px', borderRadius: 8, border: 'none',
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff',
        fontWeight: 600, fontSize: 14, cursor: 'pointer', textAlign: 'center' as const,
    },
};
