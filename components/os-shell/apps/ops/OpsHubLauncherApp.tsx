/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Ops Hub Launcher — In-shell Window (Phase 25C)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Lightweight in-shell launcher that replaces legacy OpsCenterMVP.
 * Shows system status badge + quick stats + buttons to open Monitor Hub.
 *
 * Owner-only (gated by manifest.ts requiredRole: 'owner').
 *
 * @module components/os-shell/apps/ops/OpsHubLauncherApp
 * @version 1.0.0
 */

'use client';

import React, { useState, useEffect } from 'react';
import type { AppProps } from '../registry';

interface QuickStatus {
    systemStatus: 'HEALTHY' | 'DEGRADED' | null;
    unresolvedAlerts: number;
    activeWorkers: number;
    totalJobs: number;
}

export function OpsHubLauncherApp({ windowId, capabilityId, isFocused }: AppProps) {
    const [status, setStatus] = useState<QuickStatus>({
        systemStatus: null,
        unresolvedAlerts: 0,
        activeWorkers: 0,
        totalJobs: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/ops/metrics/summary')
            .then(res => res.ok ? res.json() : Promise.reject('API error'))
            .then(data => setStatus({
                systemStatus: data.systemStatus ?? null,
                unresolvedAlerts: data.unresolvedAlerts ?? 0,
                activeWorkers: data.activeWorkers?.length ?? 0,
                totalJobs: data.aggregated?.total ?? 0,
            }))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    const isDegraded = status.systemStatus === 'DEGRADED';

    return (
        <div style={st.container}>
            {/* System Status Badge */}
            <div style={{
                ...st.statusBanner,
                ...(isDegraded ? st.statusDegraded : st.statusHealthy),
            }}>
                <span style={{
                    ...st.dot,
                    background: status.systemStatus === null
                        ? '#64748b'
                        : isDegraded ? '#ef4444' : '#4ade80',
                    boxShadow: isDegraded
                        ? '0 0 8px rgba(239, 68, 68, 0.6)'
                        : '0 0 8px rgba(74, 222, 128, 0.6)',
                }} />
                <span style={st.statusText}>
                    {loading ? 'Loading...' : status.systemStatus ?? 'UNKNOWN'}
                </span>
                {isDegraded && status.unresolvedAlerts > 0 && (
                    <span style={st.alertBadge}>
                        {status.unresolvedAlerts} alert{status.unresolvedAlerts !== 1 ? 's' : ''}
                    </span>
                )}
            </div>

            {/* Quick Stats */}
            <div style={st.statsRow}>
                <div style={st.statCard}>
                    <div style={st.statValue}>{loading ? '—' : status.activeWorkers}</div>
                    <div style={st.statLabel}>Workers</div>
                </div>
                <div style={st.statCard}>
                    <div style={st.statValue}>{loading ? '—' : status.totalJobs}</div>
                    <div style={st.statLabel}>Total Jobs</div>
                </div>
                <div style={st.statCard}>
                    <div style={st.statValue}>{loading ? '—' : status.unresolvedAlerts}</div>
                    <div style={st.statLabel}>Alerts</div>
                </div>
            </div>

            {/* Actions */}
            <div style={st.actions}>
                <button
                    onClick={() => window.location.href = '/ops'}
                    style={st.primaryBtn}
                >
                    📊 Open Monitor Hub
                </button>
                <button
                    onClick={() => window.location.href = '/ops/brain'}
                    style={st.secondaryBtn}
                >
                    🧠 Open Brain Dashboard
                </button>
            </div>

            {/* Footer */}
            <p style={st.footer}>
                Phase 25C — Monitor Hub Launcher
            </p>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════

const st: Record<string, React.CSSProperties> = {
    container: {
        padding: 24,
        fontFamily: 'var(--nx-font-system, -apple-system, BlinkMacSystemFont, sans-serif)',
        color: 'var(--nx-text-primary, #e2e8f0)',
        background: 'var(--nx-surface-window, #1a1a2e)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
    },
    statusBanner: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        borderRadius: 10,
        padding: '12px 20px',
    },
    statusHealthy: {
        background: 'rgba(74, 222, 128, 0.08)',
        border: '1px solid rgba(74, 222, 128, 0.25)',
    },
    statusDegraded: {
        background: 'rgba(239, 68, 68, 0.12)',
        border: '1px solid rgba(239, 68, 68, 0.4)',
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: '50%',
        display: 'inline-block',
    },
    statusText: {
        fontSize: 14,
        fontWeight: 600,
        letterSpacing: 0.5,
    },
    alertBadge: {
        marginLeft: 'auto',
        background: 'rgba(239, 68, 68, 0.2)',
        color: '#fca5a5',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: 8,
        padding: '3px 10px',
        fontSize: 11,
        fontWeight: 600,
    },
    statsRow: {
        display: 'flex',
        gap: 10,
    },
    statCard: {
        flex: 1,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 10,
        padding: '12px 16px',
        textAlign: 'center' as const,
    },
    statValue: {
        fontSize: 22,
        fontWeight: 700,
        fontFamily: 'monospace',
        color: '#a5b4fc',
    },
    statLabel: {
        fontSize: 10,
        textTransform: 'uppercase' as const,
        letterSpacing: 1,
        color: 'rgba(255,255,255,0.4)',
        marginTop: 4,
    },
    actions: {
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
    },
    primaryBtn: {
        padding: '10px 20px',
        borderRadius: 8,
        border: 'none',
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        color: '#fff',
        fontWeight: 600,
        fontSize: 13,
        cursor: 'pointer',
        textAlign: 'center' as const,
    },
    secondaryBtn: {
        padding: '10px 20px',
        borderRadius: 8,
        border: '1px solid rgba(255,255,255,0.15)',
        background: 'rgba(255,255,255,0.06)',
        color: 'rgba(255,255,255,0.8)',
        fontWeight: 500,
        fontSize: 13,
        cursor: 'pointer',
        textAlign: 'center' as const,
    },
    footer: {
        marginTop: 'auto',
        fontSize: 11,
        color: 'rgba(255,255,255,0.25)',
        textAlign: 'center' as const,
    },
};
