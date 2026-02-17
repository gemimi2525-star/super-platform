'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SnapshotDiffCard — Phase 35B
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Owner-only expandable card showing diff between latest and previous
 * deployment snapshot. Includes Evidence Pack (Markdown) export.
 *
 * @module coreos/ops/ui/SnapshotDiffCard
 */

import React, { useState, useEffect, useCallback } from 'react';
import type { DiffSnapshotSummary, DiffChange } from '@/coreos/ops/phaseLedger/types';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface DiffData {
    latest: DiffSnapshotSummary;
    previous: DiffSnapshotSummary | null;
    changes: DiffChange[];
    driftDetected: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// EVIDENCE PACK GENERATOR
// ═══════════════════════════════════════════════════════════════════════════

function generateEvidencePack(data: DiffData): string {
    const ts = new Date().toISOString();
    const lines: string[] = [
        `# Evidence Pack — Phase ${data.latest.phaseId}`,
        ``,
        `> Generated: ${ts}`,
        `> Environment: production`,
        ``,
        `## Latest Snapshot`,
        `| Field | Value |`,
        `|-------|-------|`,
        `| Phase | ${data.latest.phaseId} |`,
        `| Commit | \`${data.latest.commitShort}\` |`,
        `| Version | ${data.latest.version} |`,
        `| Tag | ${data.latest.tag} |`,
        `| Integrity | ${data.latest.integrityStatus} |`,
        `| Governance OK | ${data.latest.governanceOk ? '✅' : '❌'} |`,
        `| Hash Valid | ${data.latest.hashValid ? '✅' : '❌'} |`,
        ``,
    ];

    if (data.previous) {
        lines.push(
            `## Previous Snapshot`,
            `| Field | Value |`,
            `|-------|-------|`,
            `| Phase | ${data.previous.phaseId} |`,
            `| Commit | \`${data.previous.commitShort}\` |`,
            `| Version | ${data.previous.version} |`,
            `| Tag | ${data.previous.tag} |`,
            `| Integrity | ${data.previous.integrityStatus} |`,
            `| Governance OK | ${data.previous.governanceOk ? '✅' : '❌'} |`,
            `| Hash Valid | ${data.previous.hashValid ? '✅' : '❌'} |`,
            ``,
        );
    }

    if (data.changes.length > 0) {
        lines.push(
            `## Changes Detected`,
            `| Field | From | To |`,
            `|-------|------|----|`,
        );
        for (const c of data.changes) {
            lines.push(`| ${c.field} | \`${c.from}\` | \`${c.to}\` |`);
        }
        lines.push(``);
    } else {
        lines.push(`## Parity Result`, `✅ No drift detected — latest matches previous.`, ``);
    }

    lines.push(
        `## Summary`,
        `- Drift Detected: **${data.driftDetected ? 'YES ⚠️' : 'NO ✅'}**`,
        `- Total Changes: ${data.changes.length}`,
        `- Report Generated: ${ts}`,
    );

    return lines.join('\n');
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function SnapshotDiffCard() {
    const [expanded, setExpanded] = useState(false);
    const [data, setData] = useState<DiffData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const fetchDiff = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/ops/phase-ledger/diff?env=production');
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();
            if (json.ok && json.data.latest) setData(json.data);
            else throw new Error(json.error ?? 'No data');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (expanded) fetchDiff();
    }, [expanded, fetchDiff]);

    const handleCopyEvidence = async () => {
        if (!data) return;
        const md = generateEvidencePack(data);
        await navigator.clipboard.writeText(md);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

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
                <span style={st.headerTitle}>🔍 Snapshot Diff & Evidence</span>
                {data?.driftDetected && (
                    <span style={st.driftBadge}>⚠ DRIFT</span>
                )}
            </button>

            {/* Body */}
            {expanded && (
                <div style={st.body}>
                    {loading && <div style={st.loadingText}>Loading…</div>}
                    {error && <div style={st.errorText}>⚠ {error}</div>}

                    {!loading && data && (
                        <>
                            {/* Drift Warning */}
                            {data.driftDetected && (
                                <div style={st.driftBanner}>
                                    ⚠ Drift detected between latest and previous deployment
                                </div>
                            )}

                            {/* Two-column comparison */}
                            <div style={st.compGrid}>
                                {/* Latest */}
                                <div style={st.compPanel}>
                                    <div style={st.compHeader}>
                                        <span style={st.compLabel}>Latest</span>
                                        <code style={st.compCommit}>{data.latest.commitShort}</code>
                                    </div>
                                    <SnapshotDetail snap={data.latest} formatTs={formatTs} />
                                </div>

                                {/* Previous */}
                                <div style={st.compPanel}>
                                    <div style={st.compHeader}>
                                        <span style={st.compLabel}>Previous</span>
                                        <code style={st.compCommit}>
                                            {data.previous?.commitShort ?? '—'}
                                        </code>
                                    </div>
                                    {data.previous ? (
                                        <SnapshotDetail snap={data.previous} formatTs={formatTs} />
                                    ) : (
                                        <div style={st.noData}>No previous snapshot</div>
                                    )}
                                </div>
                            </div>

                            {/* Changes */}
                            {data.changes.length > 0 && (
                                <div style={st.changesSection}>
                                    <h4 style={st.changesTitle}>
                                        Changes ({data.changes.length})
                                    </h4>
                                    {data.changes.map((c, i) => (
                                        <div key={i} style={st.changeRow}>
                                            <span style={st.changeField}>{c.field}</span>
                                            <span style={st.changeMinus}>- {c.from}</span>
                                            <span style={st.changePlus}>+ {c.to}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {data.changes.length === 0 && (
                                <div style={st.parityOk}>
                                    ✅ No parity drift — latest matches previous
                                </div>
                            )}

                            {/* Evidence Pack Button */}
                            <div style={st.evidenceFooter}>
                                <button onClick={handleCopyEvidence} style={st.evidenceBtn}>
                                    {copied ? '✓ Copied!' : '📋 Copy Evidence Pack (Markdown)'}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function SnapshotDetail({
    snap,
    formatTs,
}: {
    snap: DiffSnapshotSummary;
    formatTs: (ts: any) => string;
}) {
    return (
        <div style={st.detailGrid}>
            <DetailRow label="Phase" value={snap.phaseId} />
            <DetailRow label="Version" value={snap.version} />
            <DetailRow label="Tag" value={snap.tag} />
            <DetailRow
                label="Integrity"
                value={snap.integrityStatus}
                color={snap.integrityStatus === 'OK' ? '#4ade80' : '#fca5a5'}
            />
            <DetailRow
                label="Governance"
                value={snap.governanceOk ? 'OK' : 'FAIL'}
                color={snap.governanceOk ? '#4ade80' : '#fca5a5'}
            />
            <DetailRow
                label="Hash"
                value={snap.hashValid ? 'Valid' : 'Invalid'}
                color={snap.hashValid ? '#4ade80' : '#fca5a5'}
            />
            <DetailRow label="Created" value={formatTs(snap.createdAt)} />
        </div>
    );
}

function DetailRow({
    label,
    value,
    color,
}: {
    label: string;
    value: string;
    color?: string;
}) {
    return (
        <div style={st.detailRow}>
            <span style={st.detailLabel}>{label}</span>
            <span style={{ ...st.detailValue, color: color ?? '#e2e8f0' }}>{value}</span>
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
    driftBadge: {
        fontSize: 10, fontWeight: 700, color: '#fbbf24',
        background: 'rgba(251, 191, 36, 0.12)',
        borderRadius: 4, padding: '2px 8px',
    },
    body: { padding: '0 20px 16px' },
    loadingText: { fontSize: 12, color: '#64748b', padding: '8px 0' },
    errorText: { fontSize: 12, color: '#fca5a5', padding: '8px 0' },
    driftBanner: {
        background: 'rgba(251, 191, 36, 0.08)',
        border: '1px solid rgba(251, 191, 36, 0.25)',
        borderRadius: 8, padding: '10px 14px',
        fontSize: 12, color: '#fbbf24', fontWeight: 500,
        marginBottom: 14,
    },
    compGrid: {
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: 12, marginBottom: 14,
    },
    compPanel: {
        background: 'rgba(15, 23, 42, 0.4)',
        border: '1px solid rgba(148, 163, 184, 0.08)',
        borderRadius: 8, padding: 12,
    },
    compHeader: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 10, paddingBottom: 8,
        borderBottom: '1px solid rgba(148, 163, 184, 0.08)',
    },
    compLabel: {
        fontSize: 12, fontWeight: 600, color: '#94a3b8',
        textTransform: 'uppercase' as const, letterSpacing: 0.5,
    },
    compCommit: {
        fontFamily: 'monospace', fontSize: 11, color: '#a78bfa',
        background: 'rgba(167, 139, 250, 0.1)',
        borderRadius: 3, padding: '1px 5px',
    },
    noData: {
        fontSize: 12, color: '#64748b', padding: '16px 0', textAlign: 'center' as const,
    },
    detailGrid: {
        display: 'flex', flexDirection: 'column' as const, gap: 4,
    },
    detailRow: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '2px 0',
    },
    detailLabel: { fontSize: 11, color: '#64748b' },
    detailValue: {
        fontSize: 11, fontWeight: 600, fontFamily: 'monospace',
    },
    changesSection: {
        background: 'rgba(251, 191, 36, 0.04)',
        border: '1px solid rgba(251, 191, 36, 0.15)',
        borderRadius: 8, padding: '12px 14px',
        marginBottom: 14,
    },
    changesTitle: {
        fontSize: 12, fontWeight: 600, color: '#fbbf24',
        margin: '0 0 8px',
    },
    changeRow: {
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '4px 0', fontSize: 11,
        borderBottom: '1px solid rgba(148, 163, 184, 0.06)',
    },
    changeField: {
        fontFamily: 'monospace', color: '#94a3b8', minWidth: 140,
    },
    changeMinus: {
        fontFamily: 'monospace', color: '#ef4444',
    },
    changePlus: {
        fontFamily: 'monospace', color: '#4ade80',
    },
    parityOk: {
        background: 'rgba(74, 222, 128, 0.06)',
        border: '1px solid rgba(74, 222, 128, 0.15)',
        borderRadius: 8, padding: '12px 14px',
        fontSize: 12, color: '#4ade80', fontWeight: 500,
        marginBottom: 14, textAlign: 'center' as const,
    },
    evidenceFooter: {
        display: 'flex', justifyContent: 'flex-end',
        paddingTop: 8, borderTop: '1px solid rgba(148, 163, 184, 0.08)',
    },
    evidenceBtn: {
        background: 'rgba(96, 165, 250, 0.12)',
        color: '#60a5fa',
        border: '1px solid rgba(96, 165, 250, 0.3)',
        borderRadius: 8, padding: '8px 16px',
        cursor: 'pointer', fontSize: 12, fontWeight: 600,
        transition: 'all 0.2s ease',
    },
};
