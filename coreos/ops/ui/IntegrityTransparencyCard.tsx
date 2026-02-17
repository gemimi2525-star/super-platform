'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * INTEGRITY TRANSPARENCY CARD — Phase 34
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Advanced Integrity View for the Ops Center (System Status tab).
 *
 * Features:
 *   - Multi-layer Integrity Matrix (Production/Preview/Ledger/Local/GitHub)
 *   - Mismatch detection with red highlights & reasons
 *   - Copy Evidence Pack (JSON clipboard)
 *   - Paste Local Snapshot (modal)
 *   - Auto-refresh with cache-bust
 *
 * @module coreos/ops/ui/IntegrityTransparencyCard
 * @version 1.0.0
 */

import React, { useState, useCallback, useEffect } from 'react';
import type {
    IntegritySnapshot,
    IntegrityMatrixRow,
    EvidencePack,
    LedgerStatusResponse,
    LocalSnapshotInput,
    IntegrityLayer,
} from '@/coreos/integrity/IntegrityContract';
import {
    LAYER_ORDER,
    LAYER_LABELS,
    detectMismatch,
} from '@/coreos/integrity/IntegrityContract';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES (internal endpoint shapes)
// ═══════════════════════════════════════════════════════════════════════════

interface BuildInfo {
    commit: string;
    branch: string;
    buildTime: string;
    environment: string;
    version: string;
    shaResolved: boolean;
}

interface IntegrityResponse {
    status: string;
    checks: {
        governance: { kernelFrozen: boolean; hashValid: boolean; ok: boolean };
        build: { sha: string; lockedTag: string; ok: boolean };
    };
    errorCodes: string[];
    phase: string;
    version: string;
    signature: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// DATA FETCHERS
// ═══════════════════════════════════════════════════════════════════════════

async function fetchProductionSnapshot(): Promise<IntegritySnapshot> {
    const cb = Date.now();
    try {
        const [biRes, intRes] = await Promise.all([
            fetch(`/api/build-info?cb=${cb}`),
            fetch(`/api/platform/integrity?cb=${cb}`),
        ]);
        if (!biRes.ok || !intRes.ok) throw new Error(`HTTP ${biRes.status}/${intRes.status}`);
        const bi: BuildInfo = await biRes.json();
        const int: IntegrityResponse = await intRes.json();
        return {
            layer: 'production',
            commit: bi.commit,
            version: bi.version,
            lockedTag: int.checks.build.lockedTag,
            shaResolved: bi.shaResolved,
            governance: {
                kernelFrozen: int.checks.governance.kernelFrozen,
                hashValid: int.checks.governance.hashValid,
            },
            ledger: null,
            signature: int.signature,
            status: int.status,
            errorCodes: int.errorCodes,
            phase: int.phase,
            fetchedAt: new Date().toISOString(),
        };
    } catch (err: any) {
        return emptySnapshot('production', err.message);
    }
}

async function fetchLedgerSnapshot(): Promise<IntegritySnapshot> {
    try {
        const res = await fetch(`/api/ops/ledger-status?cb=${Date.now()}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: LedgerStatusResponse = await res.json();
        return {
            layer: 'ledger',
            commit: null,
            version: null,
            lockedTag: null,
            shaResolved: null,
            governance: null,
            ledger: {
                rootHash: data.ledgerRootHash,
                lastHash: data.lastEntryHash,
                chainLength: data.chainLength,
                ok: data.isValid,
            },
            signature: null,
            status: data.isValid ? 'OK' : 'DEGRADED',
            errorCodes: data.isValid ? [] : ['LEDGER_CHAIN_BROKEN'],
            phase: null,
            fetchedAt: data.fetchedAt,
        };
    } catch (err: any) {
        return emptySnapshot('ledger', err.message);
    }
}

function makeLocalSnapshot(input: LocalSnapshotInput): IntegritySnapshot {
    return {
        layer: 'local',
        commit: input.commit,
        version: input.version,
        lockedTag: input.lockedTag ?? null,
        shaResolved: null,
        governance: null,
        ledger: null,
        signature: null,
        status: 'OK',
        errorCodes: [],
        phase: input.phase ?? null,
        fetchedAt: new Date().toISOString(),
    };
}

function emptySnapshot(layer: IntegrityLayer, errorMsg?: string): IntegritySnapshot {
    return {
        layer,
        commit: null,
        version: null,
        lockedTag: null,
        shaResolved: null,
        governance: null,
        ledger: null,
        signature: null,
        status: errorMsg ? 'ERROR' : 'N/A',
        errorCodes: errorMsg ? [errorMsg] : [],
        phase: null,
        fetchedAt: new Date().toISOString(),
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function IntegrityTransparencyCard() {
    const [rows, setRows] = useState<IntegrityMatrixRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [localInput, setLocalInput] = useState<LocalSnapshotInput | null>(null);
    const [showPasteModal, setShowPasteModal] = useState(false);
    const [pasteText, setPasteText] = useState('');
    const [pasteError, setPasteError] = useState('');
    const [copied, setCopied] = useState(false);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        const [prod, ledger] = await Promise.all([
            fetchProductionSnapshot(),
            fetchLedgerSnapshot(),
        ]);

        const preview = emptySnapshot('preview');
        const local = localInput ? makeLocalSnapshot(localInput) : emptySnapshot('local');
        const github = emptySnapshot('github');

        const all: IntegritySnapshot[] = [prod, preview, ledger, local, github];
        const reference = prod;

        const matrix: IntegrityMatrixRow[] = all.map(snap => {
            if (snap.layer === 'production') {
                return { ...snap, match: 'OK' as const, mismatchReasons: [] };
            }
            const { match, reasons } = detectMismatch(reference, snap);
            return { ...snap, match, mismatchReasons: reasons };
        });

        setRows(matrix);
        setLoading(false);
    }, [localInput]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    // ── Paste Handler ──────────────────────────────────────────────────
    const handlePaste = () => {
        setPasteError('');
        try {
            const parsed = JSON.parse(pasteText);
            if (!parsed.commit || !parsed.version) {
                setPasteError('JSON must contain "commit" and "version" fields');
                return;
            }
            setLocalInput(parsed as LocalSnapshotInput);
            setShowPasteModal(false);
            setPasteText('');
        } catch {
            setPasteError('Invalid JSON');
        }
    };

    // ── Copy Evidence Pack ─────────────────────────────────────────────
    const handleCopyEvidence = async () => {
        const prod = rows.find(r => r.layer === 'production');
        const pack: EvidencePack = {
            generatedAt: new Date().toISOString(),
            referenceLayer: 'production',
            phase: prod?.phase ?? null,
            layers: rows,
        };
        await navigator.clipboard.writeText(JSON.stringify(pack, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // ── Helpers ─────────────────────────────────────────────────────────
    const shortHash = (h: string | null) => h ? h.slice(0, 7) : '—';
    const boolIcon = (v: boolean | null | undefined) =>
        v === true ? '✓' : v === false ? '✗' : '—';
    const boolColor = (v: boolean | null | undefined) =>
        v === true ? '#4ade80' : v === false ? '#ef4444' : '#64748b';

    const hasMismatch = rows.some(r => r.match === 'MISMATCH');

    return (
        <div style={st.root}>
            {/* ── Header ──────────────────────────────────────────── */}
            <div style={st.header}>
                <div style={st.headerLeft}>
                    <span style={st.icon}>🔍</span>
                    <h3 style={st.title}>Integrity Transparency (Advanced)</h3>
                    {hasMismatch && <span style={st.badge_mismatch}>⚠ MISMATCH</span>}
                </div>
                <div style={st.headerRight}>
                    <button style={st.btn} onClick={fetchAll} disabled={loading}>
                        🔄 {loading ? 'Loading…' : 'Refresh'}
                    </button>
                    <button style={st.btn} onClick={() => setShowPasteModal(true)}>
                        📥 Paste Local
                    </button>
                    <button
                        style={{ ...st.btn, ...(copied ? st.btnCopied : {}) }}
                        onClick={handleCopyEvidence}
                    >
                        {copied ? '✅ Copied!' : '📋 Copy Evidence'}
                    </button>
                </div>
            </div>

            {/* ── Matrix Table ────────────────────────────────────── */}
            <div style={st.tableWrap}>
                <table style={st.table}>
                    <thead>
                        <tr>
                            {['Layer', 'Commit', 'Version', 'Tag', 'SHA✓', 'Frozen', 'Hash',
                                'Ledger', 'Signature', 'Status'].map(h => (
                                    <th key={h} style={st.th}>{h}</th>
                                ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map(row => {
                            const isMismatch = row.match === 'MISMATCH';
                            const rowBg = isMismatch
                                ? 'rgba(239, 68, 68, 0.06)'
                                : 'transparent';
                            return (
                                <tr key={row.layer} style={{ background: rowBg }}>
                                    <td style={st.td}>
                                        <span style={st.layerLabel}>
                                            {LAYER_LABELS[row.layer]}
                                        </span>
                                    </td>
                                    <td style={st.tdMono}>{shortHash(row.commit)}</td>
                                    <td style={st.tdMono}>{row.version ?? '—'}</td>
                                    <td style={st.tdMono}>{row.lockedTag ?? '—'}</td>
                                    <td style={{ ...st.td, color: boolColor(row.shaResolved) }}>
                                        {boolIcon(row.shaResolved)}
                                    </td>
                                    <td style={{ ...st.td, color: boolColor(row.governance?.kernelFrozen) }}>
                                        {boolIcon(row.governance?.kernelFrozen)}
                                    </td>
                                    <td style={{ ...st.td, color: boolColor(row.governance?.hashValid) }}>
                                        {boolIcon(row.governance?.hashValid)}
                                    </td>
                                    <td style={st.tdMono}>
                                        {row.ledger
                                            ? `${row.ledger.chainLength} entries ${row.ledger.ok ? '✓' : '✗'}`
                                            : '—'}
                                    </td>
                                    <td style={st.tdMono}>
                                        {row.signature ? row.signature.slice(0, 8) + '…' : '—'}
                                    </td>
                                    <td style={st.td}>
                                        <span style={{
                                            ...st.matchBadge,
                                            background: row.match === 'OK'
                                                ? 'rgba(74, 222, 128, 0.12)'
                                                : row.match === 'MISMATCH'
                                                    ? 'rgba(239, 68, 68, 0.12)'
                                                    : 'rgba(148, 163, 184, 0.1)',
                                            color: row.match === 'OK'
                                                ? '#4ade80'
                                                : row.match === 'MISMATCH'
                                                    ? '#ef4444'
                                                    : '#64748b',
                                        }}>
                                            {row.match}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* ── Mismatch Reasons ────────────────────────────────── */}
            {hasMismatch && (
                <div style={st.mismatchSection}>
                    <h4 style={st.mismatchTitle}>⚠ Mismatch Details</h4>
                    {rows.filter(r => r.match === 'MISMATCH').map(r => (
                        <div key={r.layer} style={st.mismatchRow}>
                            <span style={st.mismatchLayer}>{LAYER_LABELS[r.layer]}:</span>
                            <span style={st.mismatchReasons}>
                                {r.mismatchReasons.join(' · ')}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Paste Modal ─────────────────────────────────────── */}
            {showPasteModal && (
                <div style={st.modalOverlay} onClick={() => setShowPasteModal(false)}>
                    <div style={st.modal} onClick={e => e.stopPropagation()}>
                        <h3 style={st.modalTitle}>📥 Paste Local Snapshot</h3>
                        <p style={st.modalDesc}>
                            Paste JSON with <code style={st.codeBg}>commit</code> and{' '}
                            <code style={st.codeBg}>version</code> fields.
                            Optional: <code style={st.codeBg}>lockedTag</code>,{' '}
                            <code style={st.codeBg}>phase</code>.
                        </p>
                        <textarea
                            style={st.textarea}
                            placeholder='{"commit":"5e1e493","version":"0.32.5"}'
                            value={pasteText}
                            onChange={e => setPasteText(e.target.value)}
                            rows={6}
                        />
                        {pasteError && <p style={st.error}>{pasteError}</p>}
                        <div style={st.modalActions}>
                            <button style={st.btnCancel} onClick={() => setShowPasteModal(false)}>
                                Cancel
                            </button>
                            <button style={st.btnApply} onClick={handlePaste}>
                                Apply Snapshot
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════

const st: Record<string, React.CSSProperties> = {
    root: {
        background: 'rgba(99, 102, 241, 0.04)',
        border: '1px solid rgba(99, 102, 241, 0.15)',
        borderRadius: 12,
        padding: '16px 20px',
        marginTop: 16,
    },
    header: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 14, flexWrap: 'wrap' as const, gap: 8,
    },
    headerLeft: {
        display: 'flex', alignItems: 'center', gap: 8,
    },
    headerRight: {
        display: 'flex', gap: 6, flexWrap: 'wrap' as const,
    },
    icon: { fontSize: 18 },
    title: {
        fontSize: 14, fontWeight: 600, color: '#c4b5fd', margin: 0,
    },
    badge_mismatch: {
        fontSize: 10, fontWeight: 700, color: '#ef4444',
        background: 'rgba(239, 68, 68, 0.12)',
        borderRadius: 4, padding: '2px 8px',
        fontFamily: 'monospace',
    },
    btn: {
        background: 'rgba(148, 163, 184, 0.08)',
        border: '1px solid rgba(148, 163, 184, 0.2)',
        borderRadius: 6, padding: '5px 12px',
        fontSize: 11, fontWeight: 600, color: '#94a3b8',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
    },
    btnCopied: {
        background: 'rgba(74, 222, 128, 0.1)',
        borderColor: 'rgba(74, 222, 128, 0.3)',
        color: '#4ade80',
    },

    // Table
    tableWrap: {
        overflowX: 'auto' as const,
        borderRadius: 8,
        border: '1px solid rgba(148, 163, 184, 0.08)',
    },
    table: {
        width: '100%', borderCollapse: 'collapse' as const,
        fontSize: 11,
    },
    th: {
        textAlign: 'left' as const,
        padding: '8px 10px',
        fontSize: 10, fontWeight: 600, color: '#64748b',
        textTransform: 'uppercase' as const, letterSpacing: 0.5,
        borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
        background: 'rgba(15, 23, 42, 0.3)',
        whiteSpace: 'nowrap' as const,
    },
    td: {
        padding: '7px 10px',
        borderBottom: '1px solid rgba(148, 163, 184, 0.06)',
        color: '#cbd5e1',
        whiteSpace: 'nowrap' as const,
    },
    tdMono: {
        padding: '7px 10px',
        borderBottom: '1px solid rgba(148, 163, 184, 0.06)',
        color: '#94a3b8',
        fontFamily: 'monospace', fontSize: 11,
        whiteSpace: 'nowrap' as const,
    },
    layerLabel: {
        fontWeight: 600, color: '#e2e8f0',
    },
    matchBadge: {
        fontSize: 10, fontWeight: 700,
        borderRadius: 4, padding: '2px 8px',
        fontFamily: 'monospace',
    },

    // Mismatch
    mismatchSection: {
        marginTop: 12,
        background: 'rgba(239, 68, 68, 0.04)',
        border: '1px solid rgba(239, 68, 68, 0.15)',
        borderRadius: 8, padding: '10px 14px',
    },
    mismatchTitle: {
        fontSize: 12, fontWeight: 600, color: '#fca5a5', margin: '0 0 6px',
    },
    mismatchRow: {
        display: 'flex', gap: 8, marginTop: 4, fontSize: 11,
    },
    mismatchLayer: {
        fontWeight: 600, color: '#f87171', minWidth: 100,
    },
    mismatchReasons: {
        color: '#fca5a5',
    },

    // Modal
    modalOverlay: {
        position: 'fixed' as const, inset: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999,
    },
    modal: {
        background: '#1e293b',
        border: '1px solid rgba(148, 163, 184, 0.2)',
        borderRadius: 12, padding: 24,
        width: 480, maxWidth: '90vw',
    },
    modalTitle: {
        fontSize: 16, fontWeight: 600, color: '#e2e8f0', margin: '0 0 8px',
    },
    modalDesc: {
        fontSize: 12, color: '#94a3b8', margin: '0 0 12px', lineHeight: 1.5,
    },
    codeBg: {
        background: 'rgba(148, 163, 184, 0.1)',
        borderRadius: 3, padding: '1px 5px',
        fontFamily: 'monospace', fontSize: 11,
    },
    textarea: {
        width: '100%', boxSizing: 'border-box' as const,
        background: 'rgba(15, 23, 42, 0.6)',
        border: '1px solid rgba(148, 163, 184, 0.15)',
        borderRadius: 8, padding: 12,
        color: '#e2e8f0', fontFamily: 'monospace', fontSize: 12,
        resize: 'vertical' as const,
    },
    error: {
        fontSize: 11, color: '#ef4444', margin: '6px 0 0',
    },
    modalActions: {
        display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12,
    },
    btnCancel: {
        background: 'rgba(148, 163, 184, 0.08)',
        border: '1px solid rgba(148, 163, 184, 0.2)',
        borderRadius: 6, padding: '6px 16px',
        fontSize: 12, color: '#94a3b8', cursor: 'pointer',
    },
    btnApply: {
        background: 'rgba(99, 102, 241, 0.15)',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        borderRadius: 6, padding: '6px 16px',
        fontSize: 12, fontWeight: 600, color: '#818cf8', cursor: 'pointer',
    },
};
