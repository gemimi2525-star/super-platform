'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * GOVERNANCE STATUS CARD (Phase 35D — Autonomous Governance Enforcement)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Owner-only Ops UI card showing governance enforcement state.
 * Displays: mode, violations, reactions, override control.
 *
 * @module coreos/ops/ui/GovernanceStatusCard
 */

import React, { useEffect, useState, useCallback } from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface GovernanceData {
    governance: {
        mode: string;
        reason: string;
        triggeredAt: number;
        triggeredBy: string;
        promotionBlocked: boolean;
        lockExpiresAt: number;
    };
    violations: {
        policyDeny: number;
        nonceReplay: number;
        integrityFail: number;
        ledgerMismatch: number;
    };
    recentReactions: {
        trigger: string;
        actions: string[];
        severity: string;
        timestamp: number;
        detail: string;
        previousMode: string;
        newMode: string;
    }[];
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════

const styles: Record<string, React.CSSProperties> = {
    card: {
        background: 'rgba(30, 41, 59, 0.5)',
        border: '1px solid rgba(148, 163, 184, 0.1)',
        borderRadius: 12,
        padding: '20px 24px',
        marginTop: 16,
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    title: {
        fontSize: 14,
        fontWeight: 600,
        color: '#e2e8f0',
        letterSpacing: '0.025em',
    },
    badge: {
        fontSize: 11,
        fontWeight: 600,
        padding: '3px 10px',
        borderRadius: 999,
        letterSpacing: '0.05em',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 12,
        marginBottom: 16,
    },
    stat: {
        background: 'rgba(15, 23, 42, 0.4)',
        border: '1px solid rgba(148, 163, 184, 0.08)',
        borderRadius: 8,
        padding: '10px 12px',
        textAlign: 'center' as const,
    },
    statLabel: {
        fontSize: 10,
        color: '#64748b',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.1em',
        marginBottom: 4,
    },
    statValue: {
        fontSize: 18,
        fontWeight: 700,
        fontFamily: 'monospace',
    },
    reason: {
        fontSize: 11,
        color: '#94a3b8',
        background: 'rgba(15, 23, 42, 0.4)',
        padding: '8px 12px',
        borderRadius: 6,
        marginBottom: 12,
        fontFamily: 'monospace',
    },
    reactionsTitle: {
        fontSize: 11,
        fontWeight: 600,
        color: '#64748b',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.1em',
        marginBottom: 8,
    },
    reaction: {
        fontSize: 11,
        color: '#94a3b8',
        padding: '6px 10px',
        background: 'rgba(15, 23, 42, 0.3)',
        borderRadius: 4,
        marginBottom: 4,
        fontFamily: 'monospace',
        borderLeft: '3px solid',
    },
    overrideBtn: {
        fontSize: 11,
        fontWeight: 600,
        padding: '6px 16px',
        borderRadius: 6,
        border: '1px solid rgba(34, 197, 94, 0.3)',
        background: 'rgba(34, 197, 94, 0.1)',
        color: '#22c55e',
        cursor: 'pointer',
        letterSpacing: '0.05em',
    },
    loading: {
        fontSize: 12,
        color: '#64748b',
        padding: '24px 0',
        textAlign: 'center' as const,
    },
    error: {
        fontSize: 12,
        color: '#f87171',
        padding: '12px',
        background: 'rgba(239, 68, 68, 0.1)',
        borderRadius: 8,
    },
};

// ═══════════════════════════════════════════════════════════════════════════
// MODE COLORS
// ═══════════════════════════════════════════════════════════════════════════

function getModeStyle(mode: string): React.CSSProperties {
    switch (mode) {
        case 'NORMAL':
            return { background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.3)' };
        case 'THROTTLED':
            return { background: 'rgba(234, 179, 8, 0.15)', color: '#eab308', border: '1px solid rgba(234, 179, 8, 0.3)' };
        case 'SOFT_LOCK':
            return { background: 'rgba(249, 115, 22, 0.15)', color: '#f97316', border: '1px solid rgba(249, 115, 22, 0.3)' };
        case 'HARD_FREEZE':
            return { background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' };
        default:
            return { background: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8' };
    }
}

function getModeEmoji(mode: string): string {
    switch (mode) {
        case 'NORMAL': return '🟢';
        case 'THROTTLED': return '🟡';
        case 'SOFT_LOCK': return '🔒';
        case 'HARD_FREEZE': return '🧊';
        default: return '❓';
    }
}

function getSeverityColor(severity: string): string {
    switch (severity) {
        case 'CRITICAL': return '#ef4444';
        case 'HIGH': return '#f97316';
        case 'MEDIUM': return '#eab308';
        case 'LOW': return '#22c55e';
        default: return '#64748b';
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function GovernanceStatusCard() {
    const [data, setData] = useState<GovernanceData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [overriding, setOverriding] = useState(false);

    const fetchStatus = useCallback(async () => {
        try {
            const res = await fetch('/api/ops/governance/status');
            if (!res.ok) {
                if (res.status === 429) { setError('Rate limited'); return; }
                setError(`HTTP ${res.status}`);
                return;
            }
            const json = await res.json();
            if (json.ok) {
                setData(json.data);
                setError(null);
            } else {
                setError(json.error || 'Unknown error');
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 30_000);
        return () => clearInterval(interval);
    }, [fetchStatus]);

    const handleOverride = async () => {
        if (!confirm('Reset governance mode to NORMAL? This clears all counters.')) return;
        setOverriding(true);
        try {
            const res = await fetch('/api/ops/governance/override', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mode: 'NORMAL' }),
            });
            if (res.ok) {
                await fetchStatus();
            }
        } catch (e: any) {
            console.error('[GovernanceCard] Override failed:', e);
        } finally {
            setOverriding(false);
        }
    };

    if (loading) {
        return (
            <div style={styles.card}>
                <div style={styles.loading}>Loading governance status...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={styles.card}>
                <div style={styles.header}>
                    <span style={styles.title}>🛡️ Governance Enforcement</span>
                    <span style={{ ...styles.badge, background: 'rgba(148, 163, 184, 0.15)', color: '#64748b' }}>Phase 35D</span>
                </div>
                <div style={styles.error}>⚠️ {error}</div>
            </div>
        );
    }

    if (!data) return null;

    const { governance, violations, recentReactions } = data;
    const modeStyle = getModeStyle(governance.mode);
    const isNotNormal = governance.mode !== 'NORMAL';

    return (
        <div style={{
            ...styles.card,
            ...(isNotNormal ? { borderColor: modeStyle.color } : {}),
        }}>
            {/* Header */}
            <div style={styles.header}>
                <span style={styles.title}>
                    🛡️ Governance Enforcement
                </span>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ ...styles.badge, ...modeStyle }}>
                        {getModeEmoji(governance.mode)} {governance.mode}
                    </span>
                    {isNotNormal && (
                        <button
                            style={{ ...styles.overrideBtn, opacity: overriding ? 0.5 : 1 }}
                            onClick={handleOverride}
                            disabled={overriding}
                        >
                            {overriding ? '...' : '🔓 Override → NORMAL'}
                        </button>
                    )}
                </div>
            </div>

            {/* Current reason */}
            <div style={styles.reason}>
                {governance.reason}
                {governance.promotionBlocked && (
                    <span style={{ color: '#f97316', marginLeft: 8 }}>| 🚫 Promotion Blocked</span>
                )}
            </div>

            {/* Violation counters */}
            <div style={styles.grid}>
                <div style={styles.stat}>
                    <div style={styles.statLabel}>Policy Deny</div>
                    <div style={{ ...styles.statValue, color: violations.policyDeny > 0 ? '#f97316' : '#22c55e' }}>
                        {violations.policyDeny}
                    </div>
                </div>
                <div style={styles.stat}>
                    <div style={styles.statLabel}>Nonce Replay</div>
                    <div style={{ ...styles.statValue, color: violations.nonceReplay > 0 ? '#f97316' : '#22c55e' }}>
                        {violations.nonceReplay}
                    </div>
                </div>
                <div style={styles.stat}>
                    <div style={styles.statLabel}>Integrity Fail</div>
                    <div style={{ ...styles.statValue, color: violations.integrityFail > 0 ? '#ef4444' : '#22c55e' }}>
                        {violations.integrityFail}
                    </div>
                </div>
                <div style={styles.stat}>
                    <div style={styles.statLabel}>Ledger Mismatch</div>
                    <div style={{ ...styles.statValue, color: violations.ledgerMismatch > 0 ? '#f97316' : '#22c55e' }}>
                        {violations.ledgerMismatch}
                    </div>
                </div>
            </div>

            {/* Recent reactions */}
            {recentReactions.length > 0 && (
                <>
                    <div style={styles.reactionsTitle}>Recent Reactions ({recentReactions.length})</div>
                    {recentReactions.slice(-5).reverse().map((r, i) => (
                        <div
                            key={i}
                            style={{
                                ...styles.reaction,
                                borderLeftColor: getSeverityColor(r.severity),
                            }}
                        >
                            <span style={{ color: getSeverityColor(r.severity), fontWeight: 600 }}>
                                [{r.severity}]
                            </span>{' '}
                            {r.trigger} → {r.actions.join(', ')} | {r.previousMode}→{r.newMode}
                            <br />
                            <span style={{ color: '#475569', fontSize: 10 }}>
                                {new Date(r.timestamp).toLocaleTimeString()} — {r.detail}
                            </span>
                        </div>
                    ))}
                </>
            )}

            {/* Meta */}
            <div style={{ fontSize: 10, color: '#475569', marginTop: 12, textAlign: 'right' }}>
                Triggered: {governance.triggeredBy} at {new Date(governance.triggeredAt).toLocaleTimeString()}
            </div>
        </div>
    );
}
