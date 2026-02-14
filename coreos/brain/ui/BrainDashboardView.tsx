'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * BrainDashboardView — Shared UI Component (Phase 25D)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Extracted from /ops/brain/page.tsx for shared use:
 * - /ops/brain/page.tsx (break-glass, full page)
 * - BrainDashboardApp.tsx (OS Shell mirror window)
 *
 * @module coreos/brain/ui/BrainDashboardView
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
// PROPS
// ═══════════════════════════════════════════════════════════════════════════

export interface BrainDashboardViewProps {
    /** If true, adapts layout for OS Shell window (no 100vh, compact padding) */
    compact?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function BrainDashboardView({ compact = false }: BrainDashboardViewProps) {
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
        <div style={compact ? s.rootCompact : s.root}>
            {/* Header */}
            <div style={s.header}>
                <div>
                    <h1 style={compact ? s.titleCompact : s.title}>🧠 Brain Dashboard</h1>
                    <p style={s.subtitle}>Phase 25A — Proposal Engine</p>
                </div>
                <button onClick={fetchProposals} style={s.refreshBtn}>↻ Refresh</button>
            </div>

            {/* Trust Indicator */}
            <div style={s.trustBanner}>
                <div style={s.trustItem}>
                    <span style={s.trustLabel}>Mode</span>
                    <span style={s.trustValueDrafter}>DRAFTER</span>
                </div>
                <div style={s.trustDivider} />
                <div style={s.trustItem}>
                    <span style={s.trustLabel}>Execution</span>
                    <span style={s.trustValueLocked}>🔒 LOCKED</span>
                </div>
                <div style={s.trustDivider} />
                <div style={s.trustItem}>
                    <span style={s.trustLabel}>Authority</span>
                    <span style={s.trustValueOwner}>OWNER ONLY</span>
                </div>
            </div>

            {/* Messages */}
            {error && <div style={s.errorBox}>⚠ {error}</div>}
            {successMsg && <div style={s.successBox}>✅ {successMsg}</div>}

            {/* Propose Form */}
            <div style={s.card}>
                <h2 style={s.cardTitle}>Create Proposal</h2>
                <div style={s.formRow}>
                    <label style={s.label}>Scope</label>
                    <div style={s.scopeSelector}>
                        {(['notes', 'files', 'ops', 'jobs'] as Scope[]).map(sv => (
                            <button
                                key={sv}
                                onClick={() => setScope(sv)}
                                style={{
                                    ...s.scopeBtn,
                                    ...(scope === sv ? s.scopeBtnActive : {}),
                                }}
                            >
                                {sv === 'notes' && '📝'}
                                {sv === 'files' && '📁'}
                                {sv === 'ops' && '⚙️'}
                                {sv === 'jobs' && '🔄'}
                                {' '}{sv.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>
                <div style={s.formRow}>
                    <label style={s.label}>Goal</label>
                    <textarea
                        style={s.textarea}
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
                        ...s.proposeBtn,
                        ...(submitting || !userGoal.trim() ? s.proposeBtnDisabled : {}),
                    }}
                >
                    {submitting ? '⏳ Generating...' : '🧠 Generate Proposal'}
                </button>
            </div>

            {/* Filter */}
            <div style={s.filterRow}>
                <span style={s.filterLabel}>Filter:</span>
                {['', 'PROPOSED', 'APPROVED', 'REJECTED'].map(f => (
                    <button
                        key={f}
                        onClick={() => setStatusFilter(f)}
                        style={{
                            ...s.filterBtn,
                            ...(statusFilter === f ? s.filterBtnActive : {}),
                        }}
                    >
                        {f || 'ALL'}
                    </button>
                ))}
                <span style={s.countBadge}>{proposals.length} proposals</span>
            </div>

            {/* Proposals List */}
            {loading ? (
                <div style={s.loadingText}>Loading proposals...</div>
            ) : proposals.length === 0 ? (
                <div style={s.empty}>No proposals yet. Create one above.</div>
            ) : (
                proposals.map(p => (
                    <div key={p.id} style={s.proposalCard}>
                        <div style={s.proposalHeader}>
                            <div style={s.proposalMeta}>
                                <span style={{
                                    ...s.statusBadge,
                                    ...(p.status === 'PROPOSED' ? s.statusProposed : {}),
                                    ...(p.status === 'APPROVED' ? s.statusApproved : {}),
                                    ...(p.status === 'REJECTED' ? s.statusRejected : {}),
                                }}>{p.status}</span>
                                <span style={s.scopeBadge}>{p.scope}</span>
                                <span style={s.timestamp}>
                                    {new Date(p.createdAt).toLocaleString()}
                                </span>
                            </div>
                            {p.status === 'PROPOSED' && (
                                <div style={s.actionBtns}>
                                    <button
                                        onClick={() => handleAction(p.id, 'APPROVE')}
                                        style={s.approveBtn}
                                    >✓ Approve</button>
                                    <button
                                        onClick={() => handleAction(p.id, 'REJECT')}
                                        style={s.rejectBtn}
                                    >✗ Reject</button>
                                </div>
                            )}
                        </div>

                        <p style={s.goalText}>{p.userGoal}</p>
                        <p style={s.summaryText}>{p.proposal.summary}</p>

                        {/* Steps */}
                        <div style={s.stepsContainer}>
                            {p.proposal.steps.map((step, i) => (
                                <div key={i} style={s.stepItem}>
                                    <span style={{
                                        ...s.riskBadge,
                                        ...(step.riskLevel === 'low' ? s.riskLow : {}),
                                        ...(step.riskLevel === 'medium' ? s.riskMedium : {}),
                                        ...(step.riskLevel === 'high' ? s.riskHigh : {}),
                                    }}>{step.riskLevel.toUpperCase()}</span>
                                    <code style={s.toolName}>{step.toolName}</code>
                                    <span style={s.stepIntent}>{step.intent}</span>
                                </div>
                            ))}
                        </div>

                        {/* Blocked Actions */}
                        {p.proposal.blockedActions.length > 0 && (
                            <div style={s.blockedBox}>
                                <strong>🚫 Blocked:</strong>
                                {p.proposal.blockedActions.map((b, i) => (
                                    <div key={i} style={s.blockedItem}>{b}</div>
                                ))}
                            </div>
                        )}

                        <div style={s.impactText}>
                            <strong>Impact:</strong> {p.proposal.estimatedImpact}
                        </div>

                        {/* ID */}
                        <div style={s.proposalId}>ID: {p.id}</div>
                    </div>
                ))
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════

const s: Record<string, React.CSSProperties> = {
    root: {
        padding: 24,
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
        color: '#e2e8f0',
        maxWidth: 900,
        margin: '0 auto',
    },
    rootCompact: {
        padding: 16,
        fontFamily: 'var(--nx-font-system, -apple-system, BlinkMacSystemFont, sans-serif)',
        color: '#e2e8f0',
        overflowY: 'auto' as const,
        height: '100%',
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
    titleCompact: {
        fontSize: 20,
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
    loadingText: {
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
};
