'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PhaseLedgerDrawer — Phase History Search & Viewer (Phase 34.1)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Collapsed by default. Expands to show a searchable list of Phase Ledger
 * snapshots with detail panel. Integrates under IntegrityTransparencyCard.
 *
 * @module coreos/ops/ui/PhaseLedgerDrawer
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES (inline to avoid server import issues)
// ═══════════════════════════════════════════════════════════════════════════

interface SnapshotItem {
    id: string;
    phaseId: string;
    commit: string;
    commitShort: string;
    tag: string;
    version: string;
    environment: 'preview' | 'production';
    integrity: {
        status: string;
        governance: { kernelFrozen: boolean; hashValid: boolean; ok: boolean };
        errorCodes: string[];
        signature: string;
        buildSha: string;
    };
    buildInfo: {
        shaResolved: boolean;
        branch?: string;
    };
    ledger?: {
        rootHash?: string;
        lastEntryHash?: string;
        chainLength?: number;
        ok?: boolean;
    };
    evidence?: {
        previewUrl?: string;
        productionUrl?: string;
        ciRunUrl?: string;
    };
    createdAt: { _seconds?: number; seconds?: number } | null;
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════

const styles = {
    container: {
        background: 'rgba(15, 23, 42, 0.6)',
        border: '1px solid rgba(148, 163, 184, 0.12)',
        borderRadius: '12px',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
    } as React.CSSProperties,
    header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 20px',
        cursor: 'pointer',
        userSelect: 'none' as const,
        transition: 'background 0.2s',
    } as React.CSSProperties,
    headerHover: {
        background: 'rgba(148, 163, 184, 0.05)',
    } as React.CSSProperties,
    headerTitle: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '14px',
        fontWeight: 600,
        color: '#94a3b8',
    } as React.CSSProperties,
    chevron: (expanded: boolean) => ({
        fontSize: '12px',
        color: '#64748b',
        transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
        transition: 'transform 0.3s ease',
    }) as React.CSSProperties,
    body: (expanded: boolean) => ({
        maxHeight: expanded ? '600px' : '0px',
        overflow: expanded ? 'auto' : 'hidden',
        transition: 'max-height 0.3s ease',
        padding: expanded ? '0 20px 16px' : '0 20px',
    }) as React.CSSProperties,
    searchBar: {
        display: 'flex',
        gap: '8px',
        marginBottom: '12px',
    } as React.CSSProperties,
    searchInput: {
        flex: 1,
        padding: '8px 12px',
        background: 'rgba(30, 41, 59, 0.8)',
        border: '1px solid rgba(148, 163, 184, 0.15)',
        borderRadius: '8px',
        color: '#e2e8f0',
        fontSize: '13px',
        outline: 'none',
    } as React.CSSProperties,
    envFilter: {
        padding: '8px 12px',
        background: 'rgba(30, 41, 59, 0.8)',
        border: '1px solid rgba(148, 163, 184, 0.15)',
        borderRadius: '8px',
        color: '#e2e8f0',
        fontSize: '13px',
        outline: 'none',
        cursor: 'pointer',
    } as React.CSSProperties,
    listItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 12px',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'background 0.15s',
        borderBottom: '1px solid rgba(148, 163, 184, 0.06)',
    } as React.CSSProperties,
    listItemHover: {
        background: 'rgba(148, 163, 184, 0.08)',
    } as React.CSSProperties,
    badge: (env: string) => ({
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 8px',
        borderRadius: '10px',
        fontSize: '11px',
        fontWeight: 600,
        background: env === 'production'
            ? 'rgba(34, 197, 94, 0.15)'
            : 'rgba(59, 130, 246, 0.15)',
        color: env === 'production' ? '#4ade80' : '#60a5fa',
    }) as React.CSSProperties,
    statusBadge: (status: string) => ({
        display: 'inline-flex',
        padding: '2px 8px',
        borderRadius: '10px',
        fontSize: '11px',
        fontWeight: 600,
        background: status === 'OK'
            ? 'rgba(34, 197, 94, 0.15)'
            : 'rgba(239, 68, 68, 0.15)',
        color: status === 'OK' ? '#4ade80' : '#f87171',
    }) as React.CSSProperties,
    timestamp: {
        fontSize: '11px',
        color: '#64748b',
        marginLeft: 'auto',
        whiteSpace: 'nowrap' as const,
    } as React.CSSProperties,
    phaseLabel: {
        fontWeight: 600,
        fontSize: '13px',
        color: '#e2e8f0',
        minWidth: '60px',
    } as React.CSSProperties,
    commitLabel: {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#94a3b8',
    } as React.CSSProperties,
    emptyState: {
        textAlign: 'center' as const,
        padding: '32px',
        color: '#64748b',
        fontSize: '13px',
    } as React.CSSProperties,
    loadMore: {
        display: 'block',
        width: '100%',
        padding: '8px',
        marginTop: '8px',
        background: 'rgba(59, 130, 246, 0.1)',
        border: '1px solid rgba(59, 130, 246, 0.2)',
        borderRadius: '8px',
        color: '#60a5fa',
        fontSize: '12px',
        cursor: 'pointer',
        textAlign: 'center' as const,
    } as React.CSSProperties,
    detailPanel: {
        marginTop: '12px',
        padding: '16px',
        background: 'rgba(15, 23, 42, 0.8)',
        border: '1px solid rgba(148, 163, 184, 0.1)',
        borderRadius: '10px',
    } as React.CSSProperties,
    detailHeader: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '12px',
    } as React.CSSProperties,
    detailTitle: {
        fontSize: '14px',
        fontWeight: 600,
        color: '#e2e8f0',
    } as React.CSSProperties,
    closeBtn: {
        padding: '4px 10px',
        background: 'rgba(148, 163, 184, 0.1)',
        border: '1px solid rgba(148, 163, 184, 0.15)',
        borderRadius: '6px',
        color: '#94a3b8',
        fontSize: '11px',
        cursor: 'pointer',
    } as React.CSSProperties,
    jsonBlock: {
        padding: '12px',
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '8px',
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#94a3b8',
        whiteSpace: 'pre-wrap' as const,
        wordBreak: 'break-all' as const,
        maxHeight: '300px',
        overflow: 'auto',
    } as React.CSSProperties,
    mismatchRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 10px',
        borderRadius: '6px',
        background: 'rgba(245, 158, 11, 0.08)',
        border: '1px solid rgba(245, 158, 11, 0.15)',
        fontSize: '12px',
        color: '#fbbf24',
        marginBottom: '6px',
    } as React.CSSProperties,
    okRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 10px',
        borderRadius: '6px',
        background: 'rgba(34, 197, 94, 0.06)',
        fontSize: '12px',
        color: '#4ade80',
        marginBottom: '6px',
    } as React.CSSProperties,
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function formatTimestamp(ts: { _seconds?: number; seconds?: number } | null): string {
    if (!ts) return '—';
    const secs = ts._seconds ?? ts.seconds;
    if (!secs) return '—';
    return new Date(secs * 1000).toLocaleString('en-US', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function PhaseLedgerDrawer() {
    const [expanded, setExpanded] = useState(false);
    const [query, setQuery] = useState('');
    const [envFilter, setEnvFilter] = useState('');
    const [items, setItems] = useState<SnapshotItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [selected, setSelected] = useState<SnapshotItem | null>(null);
    const [headerHover, setHeaderHover] = useState(false);
    const [apiWarning, setApiWarning] = useState<string | null>(null);
    const [totalDocs, setTotalDocs] = useState<number | null>(null);

    // ── Last Write-back state ────────────────────────────────────────────
    const [lastWrite, setLastWrite] = useState<{
        status: 'loading' | 'found' | 'empty' | 'auth' | 'error';
        label?: string;
    }>({ status: 'loading' });

    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    // ── Fetch latest snapshot for header indicator ────────────────────────
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch(
                    `/api/ops/phase-ledger?limit=1&env=production&cb=${Date.now()}`,
                );
                if (!cancelled) {
                    if (res.status === 401 || res.status === 403) {
                        setLastWrite({ status: 'auth', label: 'Admin-only. Login as owner/admin.' });
                        return;
                    }
                    if (!res.ok) {
                        setLastWrite({ status: 'error', label: `HTTP ${res.status}` });
                        return;
                    }
                    const json = await res.json();
                    // Handle graceful degradation (ok: false + warning)
                    if (!json.ok && json.warning) {
                        setLastWrite({ status: 'error', label: `⚠ ${json.warning}` });
                        setApiWarning(json.warning);
                        return;
                    }
                    if (json.ok && json.data?.items?.length > 0) {
                        const snap = json.data.items[0] as SnapshotItem;
                        const ts = formatTimestamp(snap.createdAt as { _seconds?: number; seconds?: number } | null);
                        setLastWrite({
                            status: 'found',
                            label: `Last snapshot: ${snap.phaseId} @ ${ts} (${snap.environment}) ✅`,
                        });
                    } else {
                        setLastWrite({
                            status: 'empty',
                            label: 'No snapshots yet — set OPS_PHASE_LEDGER_SECRET',
                        });
                    }
                }
            } catch {
                if (!cancelled) {
                    setLastWrite({ status: 'error', label: 'Failed to fetch' });
                }
            }
        })();
        return () => { cancelled = true; };
    }, []);

    // ── Fetch snapshots ──────────────────────────────────────────────────
    const fetchSnapshots = useCallback(async (
        searchQuery: string,
        env: string,
        cursor?: string,
        append = false,
    ) => {
        setLoading(true);
        setApiWarning(null);
        try {
            const params = new URLSearchParams();
            if (searchQuery) params.set('query', searchQuery);
            if (env) params.set('env', env);
            if (cursor) params.set('cursor', cursor);
            params.set('limit', '20');
            params.set('cb', Date.now().toString());

            const res = await fetch(`/api/ops/phase-ledger?${params}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const json = await res.json();
            // Handle graceful degradation
            if (!json.ok && json.warning) {
                setApiWarning(json.warning);
                if (!append) setItems([]);
                return;
            }
            if (json.ok && json.data) {
                setItems(prev => append ? [...prev, ...json.data.items] : json.data.items);
                setNextCursor(json.data.nextCursor);
                if (json.data.total !== undefined) setTotalDocs(json.data.total);
            }
        } catch (err) {
            console.error('[PhaseLedgerDrawer] Fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    // ── Auto-fetch on expand ─────────────────────────────────────────────
    useEffect(() => {
        if (expanded && items.length === 0) {
            fetchSnapshots('', '');
        }
    }, [expanded, items.length, fetchSnapshots]);

    // ── Debounced search ─────────────────────────────────────────────────
    useEffect(() => {
        if (!expanded) return;
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setSelected(null);
            fetchSnapshots(query, envFilter);
        }, 400);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [query, envFilter, expanded, fetchSnapshots]);

    const handleLoadMore = () => {
        if (nextCursor) {
            fetchSnapshots(query, envFilter, nextCursor, true);
        }
    };

    // ── Detect mismatches between preview & production ────────────────────
    const getMismatches = (item: SnapshotItem): string[] => {
        const mismatches: string[] = [];
        // Find matching item in the other environment
        const otherEnv = item.environment === 'production' ? 'preview' : 'production';
        const other = items.find(
            i => i.phaseId === item.phaseId && i.environment === otherEnv,
        );
        if (!other) return [];

        if (item.commitShort !== other.commitShort)
            mismatches.push(`commit: ${item.commitShort} vs ${other.commitShort}`);
        if (item.version !== other.version)
            mismatches.push(`version: ${item.version} vs ${other.version}`);
        if (item.integrity.status !== other.integrity.status)
            mismatches.push(`status: ${item.integrity.status} vs ${other.integrity.status}`);
        if (item.integrity.governance.ok !== other.integrity.governance.ok)
            mismatches.push(`governance.ok: ${item.integrity.governance.ok} vs ${other.integrity.governance.ok}`);

        return mismatches;
    };

    // ── Last write-back indicator color ──────────────────────────────────
    const lastWriteColor = lastWrite.status === 'found' ? '#4ade80'
        : lastWrite.status === 'auth' ? '#f59e0b'
            : lastWrite.status === 'empty' ? '#64748b'
                : lastWrite.status === 'error' ? '#f87171'
                    : '#475569';

    // ═════════════════════════════════════════════════════════════════════
    // RENDER
    // ═════════════════════════════════════════════════════════════════════

    return (
        <div style={styles.container}>
            {/* ── Header (toggle) ─────────────────────────────────── */}
            <div
                style={{
                    ...styles.header,
                    ...(headerHover ? styles.headerHover : {}),
                }}
                onClick={() => setExpanded(!expanded)}
                onMouseEnter={() => setHeaderHover(true)}
                onMouseLeave={() => setHeaderHover(false)}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                    <span style={styles.headerTitle}>
                        📜 History (Search Phases)
                        {items.length > 0 && (
                            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 400 }}>
                                — {items.length} snapshot{items.length !== 1 ? 's' : ''}
                            </span>
                        )}
                    </span>
                    {/* Last Write-back Indicator — visible even when collapsed */}
                    <span style={{
                        fontSize: '11px',
                        color: lastWriteColor,
                        fontWeight: 400,
                        lineHeight: 1.4,
                    }}>
                        {lastWrite.status === 'loading' ? '…' : lastWrite.label}
                    </span>
                </div>
                <span style={styles.chevron(expanded)}>▼</span>
            </div>

            {/* ── Body ────────────────────────────────────────────── */}
            <div style={styles.body(expanded)}>
                {expanded && (
                    <>
                        {/* Search + Filter */}
                        <div style={styles.searchBar}>
                            <input
                                type="text"
                                placeholder="Search by phase, commit, tag, version…"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                style={styles.searchInput}
                            />
                            <select
                                value={envFilter}
                                onChange={e => setEnvFilter(e.target.value)}
                                style={styles.envFilter}
                            >
                                <option value="">All envs</option>
                                <option value="production">🟢 Production</option>
                                <option value="preview">🔵 Preview</option>
                            </select>
                        </div>

                        {/* Loading */}
                        {loading && items.length === 0 && (
                            <div style={styles.emptyState}>Loading…</div>
                        )}

                        {/* Warning state */}
                        {apiWarning && (
                            <div style={{
                                padding: '12px 16px',
                                background: 'rgba(245, 158, 11, 0.08)',
                                border: '1px solid rgba(245, 158, 11, 0.2)',
                                borderRadius: '8px',
                                marginBottom: '12px',
                                fontSize: '12px',
                                color: '#fbbf24',
                                lineHeight: 1.5,
                            }}>
                                ⚠️ {apiWarning}
                            </div>
                        )}

                        {/* Empty state */}
                        {!loading && items.length === 0 && !apiWarning && (
                            <div style={styles.emptyState}>
                                <div style={{ fontSize: '24px', marginBottom: '8px' }}>📭</div>
                                No snapshots yet — they will appear after CI writes deployments
                                <br />
                                <span style={{ fontSize: '11px', opacity: 0.7 }}>
                                    or trigger manually via workflow_dispatch
                                </span>
                            </div>
                        )}

                        {/* List */}
                        {items.map(item => (
                            <div
                                key={item.id}
                                style={{
                                    ...styles.listItem,
                                    ...(selected?.id === item.id ? styles.listItemHover : {}),
                                }}
                                onClick={() => setSelected(selected?.id === item.id ? null : item)}
                                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(148, 163, 184, 0.08)')}
                                onMouseLeave={e => (e.currentTarget.style.background = selected?.id === item.id ? 'rgba(148, 163, 184, 0.08)' : 'transparent')}
                            >
                                <span style={styles.phaseLabel}>
                                    {item.phaseId}
                                </span>
                                <span style={styles.badge(item.environment)}>
                                    {item.environment === 'production' ? '🟢' : '🔵'} {item.environment}
                                </span>
                                <span style={styles.commitLabel}>
                                    {item.commitShort}
                                </span>
                                <span style={styles.statusBadge(item.integrity?.status || 'N/A')}>
                                    {item.integrity?.status || 'N/A'}
                                </span>
                                <span style={styles.timestamp}>
                                    {formatTimestamp(item.createdAt as { _seconds?: number; seconds?: number } | null)}
                                </span>
                            </div>
                        ))}

                        {/* Load More */}
                        {nextCursor && (
                            <button
                                style={styles.loadMore}
                                onClick={handleLoadMore}
                                disabled={loading}
                            >
                                {loading ? 'Loading…' : 'Load more'}
                            </button>
                        )}

                        {/* ── Detail Panel ────────────────────────────── */}
                        {selected && (
                            <div style={styles.detailPanel}>
                                <div style={styles.detailHeader}>
                                    <span style={styles.detailTitle}>
                                        Phase {selected.phaseId} — {selected.environment} — {selected.commitShort}
                                    </span>
                                    <button
                                        style={styles.closeBtn}
                                        onClick={() => setSelected(null)}
                                    >
                                        ✕ Close
                                    </button>
                                </div>

                                {/* Mismatch detection */}
                                {(() => {
                                    const mismatches = getMismatches(selected);
                                    if (mismatches.length > 0) {
                                        return (
                                            <div style={{ marginBottom: '10px' }}>
                                                <div style={{ fontSize: '12px', color: '#fbbf24', fontWeight: 600, marginBottom: '6px' }}>
                                                    ⚠ Mismatches detected (vs {selected.environment === 'production' ? 'preview' : 'production'}):
                                                </div>
                                                {mismatches.map((m, i) => (
                                                    <div key={i} style={styles.mismatchRow}>⚡ {m}</div>
                                                ))}
                                            </div>
                                        );
                                    }
                                    const otherEnv = selected.environment === 'production' ? 'preview' : 'production';
                                    const hasOther = items.some(
                                        i => i.phaseId === selected.phaseId && i.environment === otherEnv,
                                    );
                                    if (hasOther) {
                                        return (
                                            <div style={styles.okRow}>
                                                ✓ No mismatches with {otherEnv}
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}

                                {/* JSON (collapsed) */}
                                <details>
                                    <summary style={{ color: '#94a3b8', fontSize: '12px', cursor: 'pointer', marginBottom: '8px' }}>
                                        📋 Raw Snapshot JSON
                                    </summary>
                                    <pre style={styles.jsonBlock}>
                                        {JSON.stringify(selected, null, 2)}
                                    </pre>
                                </details>

                                {/* Evidence links */}
                                {selected.evidence && (
                                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#94a3b8' }}>
                                        {selected.evidence.ciRunUrl && (
                                            <div>🔗 CI Run: <a href={selected.evidence.ciRunUrl} target="_blank" rel="noopener" style={{ color: '#60a5fa' }}>{selected.evidence.ciRunUrl}</a></div>
                                        )}
                                        {selected.evidence.previewUrl && (
                                            <div>🔵 Preview: <a href={selected.evidence.previewUrl} target="_blank" rel="noopener" style={{ color: '#60a5fa' }}>{selected.evidence.previewUrl}</a></div>
                                        )}
                                        {selected.evidence.productionUrl && (
                                            <div>🟢 Production: <a href={selected.evidence.productionUrl} target="_blank" rel="noopener" style={{ color: '#60a5fa' }}>{selected.evidence.productionUrl}</a></div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
