'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Brain Dashboard (Phase 25A — Brain Skeleton)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Owner-only page (inherits /ops layout guard) for:
 * - Creating proposals (DRAFTER mode)
 * - Viewing proposal list
 * - Approving/Rejecting proposals
 *
 * Trust Indicator: Mode=DRAFTER, Execution=LOCKED
 *
 * @module app/ops/brain/page
 * @version 1.0.0
 */

import React, { useState, useEffect, useCallback } from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface ProposalStep {
    toolName: string;
    intent: string;
    riskLevel: 'low' | 'medium' | 'high';
    requiresApproval: boolean;
}

interface ProposalContent {
    summary: string;
    steps: ProposalStep[];
    estimatedImpact: string;
    blockedActions: string[];
}

interface ProposalDoc {
    id: string;
    createdAt: number;
    createdByUid: string;
    scope: string;
    userGoal: string;
    proposal: ProposalContent;
    status: 'PROPOSED' | 'APPROVED' | 'REJECTED';
    approvedAt?: number;
    approvedByUid?: string;
    auditTrail: { event: string; timestamp: number; uid: string }[];
}

type Scope = 'notes' | 'files' | 'ops' | 'jobs';

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function BrainDashboard() {
    const [proposals, setProposals] = useState<ProposalDoc[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [scope, setScope] = useState<Scope>('notes');
    const [userGoal, setUserGoal] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // ─── Fetch Proposals ───
    const fetchProposals = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (statusFilter) params.set('status', statusFilter);
            const res = await fetch(`/api/brain/proposals?${params.toString()}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            setProposals(data.proposals || []);
        } catch (err: any) {
            console.error('[Brain] fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, [statusFilter]);

    useEffect(() => {
        fetchProposals();
        const interval = setInterval(fetchProposals, 15_000);
        return () => clearInterval(interval);
    }, [fetchProposals]);

    // ─── Create Proposal ───
    const handlePropose = async () => {
        if (!userGoal.trim()) return;
        setSubmitting(true);
        setError(null);
        setSuccessMsg(null);

        try {
            const res = await fetch('/api/brain/propose', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ scope, userGoal }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
            setSuccessMsg(`Proposal created: ${data.proposalId}`);
            setUserGoal('');
            fetchProposals();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    // ─── Approve / Reject ───
    const handleAction = async (proposalId: string, action: 'APPROVE' | 'REJECT') => {
        try {
            setError(null);
            const res = await fetch('/api/brain/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ proposalId, action }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
            setSuccessMsg(`Proposal ${action === 'APPROVE' ? 'approved' : 'rejected'}`);
            fetchProposals();
        } catch (err: any) {
            setError(err.message);
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════════════════

    return (
        <div style={styles.page}>
            <div style={styles.container}>
                {/* Back to Hub */}
                <div style={{ marginBottom: 12 }}>
                    <button
                        onClick={() => window.location.href = '/ops'}
                        style={styles.backBtn}
                    >
                        ← Back to Monitor Hub
                    </button>
                </div>

                {/* Header */}
                <div style={styles.header}>
                    <div>
                        <h1 style={styles.title}>🧠 Brain Dashboard</h1>
                        <p style={styles.subtitle}>Phase 25A — Proposal Engine</p>
                    </div>
                    <button onClick={fetchProposals} style={styles.refreshBtn}>↻ Refresh</button>
                </div>

                {/* Trust Indicator */}
                <div style={styles.trustBanner}>
                    <div style={styles.trustItem}>
                        <span style={styles.trustLabel}>Mode</span>
                        <span style={styles.trustValueDrafter}>DRAFTER</span>
                    </div>
                    <div style={styles.trustDivider} />
                    <div style={styles.trustItem}>
                        <span style={styles.trustLabel}>Execution</span>
                        <span style={styles.trustValueLocked}>🔒 LOCKED</span>
                    </div>
                    <div style={styles.trustDivider} />
                    <div style={styles.trustItem}>
                        <span style={styles.trustLabel}>Authority</span>
                        <span style={styles.trustValueOwner}>OWNER ONLY</span>
                    </div>
                </div>

                {/* Messages */}
                {error && <div style={styles.errorBox}>⚠ {error}</div>}
                {successMsg && <div style={styles.successBox}>✅ {successMsg}</div>}

                {/* Propose Form */}
                <div style={styles.card}>
                    <h2 style={styles.cardTitle}>Create Proposal</h2>
                    <div style={styles.formRow}>
                        <label style={styles.label}>Scope</label>
                        <div style={styles.scopeSelector}>
                            {(['notes', 'files', 'ops', 'jobs'] as Scope[]).map(s => (
                                <button
                                    key={s}
                                    onClick={() => setScope(s)}
                                    style={{
                                        ...styles.scopeBtn,
                                        ...(scope === s ? styles.scopeBtnActive : {}),
                                    }}
                                >
                                    {s === 'notes' && '📝'}
                                    {s === 'files' && '📁'}
                                    {s === 'ops' && '⚙️'}
                                    {s === 'jobs' && '🔄'}
                                    {' '}{s.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div style={styles.formRow}>
                        <label style={styles.label}>Goal</label>
                        <textarea
                            style={styles.textarea}
                            placeholder="Describe what you want Brain to plan..."
                            value={userGoal}
                            onChange={e => setUserGoal(e.target.value)}
                            rows={3}
                        />
                    </div>
                    <button
                        onClick={handlePropose}
                        disabled={submitting || !userGoal.trim()}
                        style={{
                            ...styles.proposeBtn,
                            ...(submitting || !userGoal.trim() ? styles.proposeBtnDisabled : {}),
                        }}
                    >
                        {submitting ? '⏳ Generating...' : '🧠 Generate Proposal'}
                    </button>
                </div>

                {/* Filter */}
                <div style={styles.filterRow}>
                    <span style={styles.filterLabel}>Filter:</span>
                    {['', 'PROPOSED', 'APPROVED', 'REJECTED'].map(f => (
                        <button
                            key={f}
                            onClick={() => setStatusFilter(f)}
                            style={{
                                ...styles.filterBtn,
                                ...(statusFilter === f ? styles.filterBtnActive : {}),
                            }}
                        >
                            {f || 'ALL'}
                        </button>
                    ))}
                    <span style={styles.countBadge}>{proposals.length} proposals</span>
                </div>

                {/* Proposals List */}
                {loading ? (
                    <div style={styles.loading}>Loading proposals...</div>
                ) : proposals.length === 0 ? (
                    <div style={styles.empty}>No proposals yet. Create one above.</div>
                ) : (
                    proposals.map(p => (
                        <div key={p.id} style={styles.proposalCard}>
                            <div style={styles.proposalHeader}>
                                <div style={styles.proposalMeta}>
                                    <span style={{
                                        ...styles.statusBadge,
                                        ...(p.status === 'PROPOSED' ? styles.statusProposed : {}),
                                        ...(p.status === 'APPROVED' ? styles.statusApproved : {}),
                                        ...(p.status === 'REJECTED' ? styles.statusRejected : {}),
                                    }}>{p.status}</span>
                                    <span style={styles.scopeBadge}>{p.scope}</span>
                                    <span style={styles.timestamp}>
                                        {new Date(p.createdAt).toLocaleString()}
                                    </span>
                                </div>
                                {p.status === 'PROPOSED' && (
                                    <div style={styles.actionBtns}>
                                        <button
                                            onClick={() => handleAction(p.id, 'APPROVE')}
                                            style={styles.approveBtn}
                                        >✓ Approve</button>
                                        <button
                                            onClick={() => handleAction(p.id, 'REJECT')}
                                            style={styles.rejectBtn}
                                        >✗ Reject</button>
                                    </div>
                                )}
                            </div>

                            <p style={styles.goalText}>{p.userGoal}</p>
                            <p style={styles.summaryText}>{p.proposal.summary}</p>

                            {/* Steps */}
                            <div style={styles.stepsContainer}>
                                {p.proposal.steps.map((step, i) => (
                                    <div key={i} style={styles.stepItem}>
                                        <span style={{
                                            ...styles.riskBadge,
                                            ...(step.riskLevel === 'low' ? styles.riskLow : {}),
                                            ...(step.riskLevel === 'medium' ? styles.riskMedium : {}),
                                            ...(step.riskLevel === 'high' ? styles.riskHigh : {}),
                                        }}>{step.riskLevel.toUpperCase()}</span>
                                        <code style={styles.toolName}>{step.toolName}</code>
                                        <span style={styles.stepIntent}>{step.intent}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Blocked Actions */}
                            {p.proposal.blockedActions.length > 0 && (
                                <div style={styles.blockedBox}>
                                    <strong>🚫 Blocked:</strong>
                                    {p.proposal.blockedActions.map((b, i) => (
                                        <div key={i} style={styles.blockedItem}>{b}</div>
                                    ))}
                                </div>
                            )}

                            <div style={styles.impactText}>
                                <strong>Impact:</strong> {p.proposal.estimatedImpact}
                            </div>

                            {/* ID */}
                            <div style={styles.proposalId}>ID: {p.id}</div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLES (inline, no Tailwind)
// ═══════════════════════════════════════════════════════════════════════════

const styles: Record<string, React.CSSProperties> = {
    page: {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f0c29 0%, #1a1a3e 50%, #24243e 100%)',
        padding: '24px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
        color: '#e2e8f0',
    },
    container: {
        maxWidth: 900,
        margin: '0 auto',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 700,
        color: '#f8fafc',
        margin: 0,
    },
    subtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.5)',
        margin: '4px 0 0 0',
    },
    refreshBtn: {
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.15)',
        color: '#e2e8f0',
        padding: '8px 16px',
        borderRadius: 8,
        cursor: 'pointer',
        fontSize: 13,
    },

    // Trust Banner
    trustBanner: {
        display: 'flex',
        alignItems: 'center',
        gap: 0,
        background: 'rgba(99, 102, 241, 0.1)',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        borderRadius: 12,
        padding: '12px 24px',
        marginBottom: 20,
    },
    trustItem: {
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        flex: 1,
        gap: 4,
    },
    trustDivider: {
        width: 1,
        height: 36,
        background: 'rgba(99, 102, 241, 0.3)',
    },
    trustLabel: {
        fontSize: 10,
        textTransform: 'uppercase' as const,
        letterSpacing: 1.5,
        color: 'rgba(255,255,255,0.4)',
    },
    trustValueDrafter: {
        fontSize: 14,
        fontWeight: 700,
        color: '#818cf8',
        letterSpacing: 1,
    },
    trustValueLocked: {
        fontSize: 14,
        fontWeight: 700,
        color: '#f59e0b',
        letterSpacing: 1,
    },
    trustValueOwner: {
        fontSize: 14,
        fontWeight: 700,
        color: '#34d399',
        letterSpacing: 1,
    },

    // Messages
    errorBox: {
        background: 'rgba(239, 68, 68, 0.15)',
        border: '1px solid rgba(239, 68, 68, 0.4)',
        color: '#fca5a5',
        padding: '10px 16px',
        borderRadius: 8,
        marginBottom: 16,
        fontSize: 13,
    },
    successBox: {
        background: 'rgba(52, 211, 153, 0.15)',
        border: '1px solid rgba(52, 211, 153, 0.4)',
        color: '#6ee7b7',
        padding: '10px 16px',
        borderRadius: 8,
        marginBottom: 16,
        fontSize: 13,
    },

    // Card
    card: {
        background: 'rgba(30, 30, 60, 0.6)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12,
        padding: 24,
        marginBottom: 20,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 600,
        color: '#f8fafc',
        margin: '0 0 16px 0',
    },
    formRow: {
        marginBottom: 14,
    },
    label: {
        display: 'block',
        fontSize: 12,
        textTransform: 'uppercase' as const,
        letterSpacing: 1,
        color: 'rgba(255,255,255,0.5)',
        marginBottom: 6,
    },
    scopeSelector: {
        display: 'flex',
        gap: 8,
    },
    scopeBtn: {
        padding: '8px 14px',
        borderRadius: 8,
        border: '1px solid rgba(255,255,255,0.12)',
        background: 'rgba(255,255,255,0.04)',
        color: 'rgba(255,255,255,0.6)',
        cursor: 'pointer',
        fontSize: 12,
        fontWeight: 500,
        transition: 'all 0.2s',
    },
    scopeBtnActive: {
        background: 'rgba(99, 102, 241, 0.25)',
        borderColor: 'rgba(99, 102, 241, 0.6)',
        color: '#c7d2fe',
    },
    textarea: {
        width: '100%',
        padding: '10px 14px',
        borderRadius: 8,
        border: '1px solid rgba(255,255,255,0.12)',
        background: 'rgba(0,0,0,0.3)',
        color: '#e2e8f0',
        fontSize: 14,
        fontFamily: 'inherit',
        resize: 'vertical' as const,
        outline: 'none',
        boxSizing: 'border-box' as const,
    },
    proposeBtn: {
        padding: '10px 24px',
        borderRadius: 8,
        border: 'none',
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        color: '#fff',
        fontWeight: 600,
        fontSize: 14,
        cursor: 'pointer',
        transition: 'all 0.2s',
    },
    proposeBtnDisabled: {
        opacity: 0.5,
        cursor: 'not-allowed',
    },

    // Filter
    filterRow: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    filterLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.5)',
        textTransform: 'uppercase' as const,
        letterSpacing: 1,
    },
    filterBtn: {
        padding: '4px 12px',
        borderRadius: 6,
        border: '1px solid rgba(255,255,255,0.1)',
        background: 'transparent',
        color: 'rgba(255,255,255,0.5)',
        cursor: 'pointer',
        fontSize: 11,
    },
    filterBtnActive: {
        background: 'rgba(99, 102, 241, 0.2)',
        borderColor: 'rgba(99, 102, 241, 0.5)',
        color: '#c7d2fe',
    },
    countBadge: {
        marginLeft: 'auto',
        fontSize: 12,
        color: 'rgba(255,255,255,0.4)',
    },

    // Proposal Card
    proposalCard: {
        background: 'rgba(30, 30, 60, 0.5)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 12,
        padding: 20,
        marginBottom: 12,
    },
    proposalHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    proposalMeta: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
    },
    statusBadge: {
        padding: '3px 10px',
        borderRadius: 20,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: 0.5,
    },
    statusProposed: {
        background: 'rgba(251, 191, 36, 0.2)',
        color: '#fbbf24',
    },
    statusApproved: {
        background: 'rgba(52, 211, 153, 0.2)',
        color: '#34d399',
    },
    statusRejected: {
        background: 'rgba(239, 68, 68, 0.2)',
        color: '#ef4444',
    },
    scopeBadge: {
        padding: '3px 8px',
        borderRadius: 6,
        fontSize: 10,
        fontWeight: 600,
        background: 'rgba(99, 102, 241, 0.2)',
        color: '#a5b4fc',
        textTransform: 'uppercase' as const,
    },
    timestamp: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.3)',
    },
    actionBtns: {
        display: 'flex',
        gap: 6,
    },
    approveBtn: {
        padding: '5px 12px',
        borderRadius: 6,
        border: '1px solid rgba(52, 211, 153, 0.4)',
        background: 'rgba(52, 211, 153, 0.15)',
        color: '#34d399',
        cursor: 'pointer',
        fontSize: 12,
        fontWeight: 600,
    },
    rejectBtn: {
        padding: '5px 12px',
        borderRadius: 6,
        border: '1px solid rgba(239, 68, 68, 0.4)',
        background: 'rgba(239, 68, 68, 0.15)',
        color: '#ef4444',
        cursor: 'pointer',
        fontSize: 12,
        fontWeight: 600,
    },
    goalText: {
        fontSize: 14,
        color: '#e2e8f0',
        margin: '0 0 6px 0',
        fontWeight: 500,
    },
    summaryText: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.6)',
        margin: '0 0 12px 0',
        lineHeight: 1.5,
    },
    stepsContainer: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: 6,
        marginBottom: 10,
    },
    stepItem: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 10px',
        background: 'rgba(0,0,0,0.2)',
        borderRadius: 6,
        fontSize: 12,
    },
    riskBadge: {
        padding: '2px 6px',
        borderRadius: 4,
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: 0.5,
        minWidth: 42,
        textAlign: 'center' as const,
    },
    riskLow: {
        background: 'rgba(52, 211, 153, 0.2)',
        color: '#34d399',
    },
    riskMedium: {
        background: 'rgba(251, 191, 36, 0.2)',
        color: '#fbbf24',
    },
    riskHigh: {
        background: 'rgba(239, 68, 68, 0.2)',
        color: '#ef4444',
    },
    toolName: {
        fontFamily: '"SF Mono", "Fira Code", monospace',
        fontSize: 11,
        color: '#a5b4fc',
        background: 'rgba(99, 102, 241, 0.1)',
        padding: '2px 6px',
        borderRadius: 4,
    },
    stepIntent: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
    },
    blockedBox: {
        background: 'rgba(239, 68, 68, 0.08)',
        border: '1px solid rgba(239, 68, 68, 0.2)',
        borderRadius: 8,
        padding: '10px 14px',
        marginBottom: 10,
        fontSize: 12,
        color: '#fca5a5',
    },
    blockedItem: {
        marginTop: 4,
        paddingLeft: 16,
        color: 'rgba(255,255,255,0.5)',
    },
    impactText: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.5)',
        lineHeight: 1.5,
    },
    proposalId: {
        marginTop: 8,
        fontSize: 10,
        color: 'rgba(255,255,255,0.2)',
        fontFamily: '"SF Mono", monospace',
    },
    loading: {
        textAlign: 'center' as const,
        padding: 40,
        color: 'rgba(255,255,255,0.4)',
    },
    empty: {
        textAlign: 'center' as const,
        padding: 40,
        color: 'rgba(255,255,255,0.3)',
        fontSize: 14,
    },
    backBtn: {
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.12)',
        color: 'rgba(255,255,255,0.6)',
        padding: '6px 14px',
        borderRadius: 8,
        cursor: 'pointer',
        fontSize: 13,
        fontWeight: 500,
        transition: 'all 0.2s',
    },
};
