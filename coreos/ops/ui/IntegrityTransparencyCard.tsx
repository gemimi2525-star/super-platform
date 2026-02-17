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
// TYPES — Firestore Snapshot (for drilldown)
// ═══════════════════════════════════════════════════════════════════════════

interface FirestoreSnapshotItem {
    id: string;
    phaseId: string;
    commitShort: string;
    environment: string;
    createdAt: { _seconds?: number; seconds?: number } | null;
    evidence?: { ciRunUrl?: string };
}

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

    // ── Firestore Snapshot drilldown state ──────────────────────────────
    const [fsSnapshots, setFsSnapshots] = useState<FirestoreSnapshotItem[]>([]);
    const [fsCount, setFsCount] = useState<number | null>(null);
    const [fsWarning, setFsWarning] = useState<string | null>(null);
    const [showDrilldown, setShowDrilldown] = useState(false);
    const [fsLoading, setFsLoading] = useState(false);

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

    // ── Fetch Firestore Snapshots (for drilldown) ──────────────────────
    const fetchFirestoreSnapshots = useCallback(async () => {
        setFsLoading(true);
        setFsWarning(null);
        try {
            const res = await fetch(`/api/ops/phase-ledger?limit=10&cb=${Date.now()}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();
            if (!json.ok && json.warning) {
                setFsWarning(json.warning);
                setFsSnapshots([]);
                setFsCount(0);
                return;
            }
            if (json.ok && json.data) {
                setFsSnapshots(json.data.items || []);
                setFsCount(json.data.total ?? json.data.items?.length ?? 0);
            }
        } catch (err: any) {
            setFsWarning(err.message);
        } finally {
            setFsLoading(false);
        }
    }, []);

    useEffect(() => { fetchFirestoreSnapshots(); }, [fetchFirestoreSnapshots]);

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
                                        {row.layer === 'ledger' && fsCount !== null ? (
                                            <span>
                                                <strong style={{ color: '#e2e8f0' }}>{fsCount}</strong> docs
                                                {row.ledger?.ok && ' ✓'}
                                                {fsSnapshots.length > 0 && (
                                                    <span style={{ color: '#64748b', marginLeft: '6px' }}>
                                                        (latest: {fsSnapshots[0].commitShort})
                                                    </span>
                                                )}
                                            </span>
                                        ) : row.ledger
                                            ? `${row.ledger.chainLength} entries ${row.ledger.ok ? '✓' : '✗'}`
                                            : '—'}
                                    </td>
                                    <td style={st.tdMono}>
                                        {row.signature ? row.signature.slice(0, 8) + '…' : '—'}
                                    </td>
                                    <td style={st.td}>
                                        <span
                                            title={
                                                row.match === 'N/A'
                                                    ? row.layer === 'preview'
                                                        ? 'No snapshot yet (CI write-back not run or OPS_PHASE_LEDGER_SECRET not set). Snapshots available in History after first CI write.'
                                                        : row.layer === 'github'
                                                            ? 'Not collected in runtime (no GitHub token by policy). Provided via CI write-back only.'
                                                            : 'N/A — no snapshot written yet. Enable CI write-back.'
                                                    : undefined
                                            }
                                            style={{
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
                                                cursor: row.match === 'N/A' ? 'help' : undefined,
                                            }}
                                        >
                                            {row.match}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Helper text for N/A layers */}
            {rows.some(r => r.match === 'N/A') && (
                <p style={{ fontSize: 11, color: '#64748b', margin: '8px 0 0', lineHeight: 1.5 }}>
                    ℹ Hover N/A badges for details — Preview & GitHub layers are populated via CI write-back.
                </p>
            )}

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

            {/* ── Ledger Drilldown ──────────────────────────────── */}
            <div style={{
                marginTop: 12,
                background: 'rgba(99, 102, 241, 0.03)',
                border: '1px solid rgba(99, 102, 241, 0.1)',
                borderRadius: 8,
                overflow: 'hidden',
            }}>
                <div
                    style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 14px', cursor: 'pointer',
                        transition: 'background 0.2s',
                    }}
                    onClick={() => {
                        if (!showDrilldown) fetchFirestoreSnapshots();
                        setShowDrilldown(!showDrilldown);
                    }}
                >
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#c4b5fd' }}>
                        🗄️ Ledger / Firestore Drilldown
                        {fsCount !== null && (
                            <span style={{
                                marginLeft: 8, fontSize: 10, fontWeight: 700,
                                background: 'rgba(74, 222, 128, 0.12)', color: '#4ade80',
                                borderRadius: 10, padding: '2px 8px',
                            }}>{fsCount} docs</span>
                        )}
                    </span>
                    <span style={{
                        fontSize: 12, color: '#64748b',
                        transform: showDrilldown ? 'rotate(180deg)' : 'rotate(0)',
                        transition: 'transform 0.2s',
                    }}>▼</span>
                </div>
                {showDrilldown && (
                    <div style={{ padding: '0 14px 14px' }}>
                        {fsWarning && (
                            <div style={{
                                padding: '8px 12px', marginBottom: 8,
                                background: 'rgba(245, 158, 11, 0.08)',
                                border: '1px solid rgba(245, 158, 11, 0.2)',
                                borderRadius: 6, fontSize: 11, color: '#fbbf24',
                            }}>⚠️ {fsWarning}</div>
                        )}
                        {fsLoading && <div style={{ color: '#64748b', fontSize: 12 }}>Loading…</div>}
                        {!fsLoading && fsSnapshots.length === 0 && !fsWarning && (
                            <div style={{ color: '#64748b', fontSize: 12 }}>No snapshots found</div>
                        )}
                        {fsSnapshots.length > 0 && (
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                                <thead>
                                    <tr>
                                        {['Doc ID', 'Phase', 'Commit', 'Env', 'Created', 'CI Run'].map(h => (
                                            <th key={h} style={{
                                                textAlign: 'left', padding: '6px 8px', fontSize: 10,
                                                fontWeight: 600, color: '#64748b',
                                                textTransform: 'uppercase', letterSpacing: 0.5,
                                                borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
                                                background: 'rgba(15, 23, 42, 0.3)',
                                            }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {fsSnapshots.map(snap => {
                                        const ts = snap.createdAt;
                                        const secs = ts?._seconds ?? ts?.seconds;
                                        const timeStr = secs
                                            ? new Date(secs * 1000).toLocaleString('en-US', {
                                                month: 'short', day: 'numeric',
                                                hour: '2-digit', minute: '2-digit',
                                            }) : '—';
                                        return (
                                            <tr key={snap.id} style={{
                                                borderBottom: '1px solid rgba(148, 163, 184, 0.06)',
                                            }}>
                                                <td style={{ padding: '6px 8px', fontFamily: 'monospace', color: '#94a3b8' }}>
                                                    {snap.id}
                                                </td>
                                                <td style={{ padding: '6px 8px', fontWeight: 600, color: '#e2e8f0' }}>
                                                    {snap.phaseId}
                                                </td>
                                                <td style={{ padding: '6px 8px', fontFamily: 'monospace', color: '#94a3b8' }}>
                                                    {snap.commitShort}
                                                </td>
                                                <td style={{ padding: '6px 8px' }}>
                                                    <span style={{
                                                        fontSize: 10, fontWeight: 600, padding: '1px 6px',
                                                        borderRadius: 8,
                                                        background: snap.environment === 'production'
                                                            ? 'rgba(34, 197, 94, 0.12)' : 'rgba(59, 130, 246, 0.12)',
                                                        color: snap.environment === 'production'
                                                            ? '#4ade80' : '#60a5fa',
                                                    }}>
                                                        {snap.environment === 'production' ? '🟢' : '🔵'} {snap.environment}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '6px 8px', fontSize: 10, color: '#64748b' }}>
                                                    {timeStr}
                                                </td>
                                                <td style={{ padding: '6px 8px' }}>
                                                    {snap.evidence?.ciRunUrl ? (
                                                        <a href={snap.evidence.ciRunUrl} target="_blank" rel="noopener"
                                                            style={{ color: '#60a5fa', fontSize: 10 }}>
                                                            🔗 View
                                                        </a>
                                                    ) : <span style={{ color: '#475569', fontSize: 10 }}>—</span>}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </div>


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
