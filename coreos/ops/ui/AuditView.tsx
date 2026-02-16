'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AuditView — Audit Log Explorer (Phase 32.4)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Full audit log viewer with:
 *   - Search by traceId / event prefix
 *   - Severity filter (ALL / INFO / WARN / ERROR / CRITICAL)
 *   - Event table with color-coded severity
 *   - Cursor-based pagination ("Load More")
 *   - Detail drawer (click row → redacted JSON envelope)
 *
 * Data fetched from GET /api/ops/audit (redaction enforced server-side)
 *
 * @module coreos/ops/ui/AuditView
 * @version 2.0.0 (Phase 32.4)
 */

import React, { useState, useCallback, useEffect } from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface AuditItem {
    id: string;
    version?: string;
    event: string;
    traceId: string;
    timestamp: number;
    severity: string;
    actor?: { type: string; id: string };
    context?: Record<string, unknown>;
}

interface AuditResponse {
    ok: boolean;
    data?: {
        items: AuditItem[];
        nextCursor: string | null;
        count: number;
        role: string;
    };
    error?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// SEVERITY CONFIG
// ═══════════════════════════════════════════════════════════════════════════

const SEVERITY_OPTIONS = ['ALL', 'INFO', 'WARN', 'ERROR', 'CRITICAL'] as const;

const SEVERITY_COLORS: Record<string, string> = {
    INFO: '#60a5fa',
    WARN: '#fbbf24',
    ERROR: '#f87171',
    CRITICAL: '#ef4444',
};

const SEVERITY_BG: Record<string, string> = {
    INFO: 'rgba(96, 165, 250, 0.12)',
    WARN: 'rgba(251, 191, 36, 0.12)',
    ERROR: 'rgba(248, 113, 113, 0.12)',
    CRITICAL: 'rgba(239, 68, 68, 0.15)',
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function AuditView() {
    const [items, setItems] = useState<AuditItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [cursor, setCursor] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(false);
    const [role, setRole] = useState<string>('');

    // Filters
    const [search, setSearch] = useState('');
    const [severity, setSeverity] = useState<string>('ALL');

    // Detail drawer
    const [selected, setSelected] = useState<AuditItem | null>(null);

    // ── Fetch ───────────────────────────────────────────────────────────
    const fetchAudit = useCallback(async (append = false, cursorVal?: string | null) => {
        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams();
            params.set('limit', '50');

            if (search.trim()) {
                // Detect if search looks like a traceId (UUID-ish or contains -)
                if (search.includes('-') && search.length > 8) {
                    params.set('traceId', search.trim());
                } else {
                    params.set('eventPrefix', search.trim());
                }
            }
            if (severity !== 'ALL') {
                params.set('severity', severity);
            }
            if (append && cursorVal) {
                params.set('cursor', cursorVal);
            }

            const res = await fetch(`/api/ops/audit?${params.toString()}`);
            const json: AuditResponse = await res.json();

            if (!json.ok) {
                setError(json.error || `HTTP ${res.status}`);
                return;
            }

            const data = json.data!;
            setRole(data.role);

            if (append) {
                setItems(prev => [...prev, ...data.items]);
            } else {
                setItems(data.items);
            }

            setCursor(data.nextCursor);
            setHasMore(!!data.nextCursor);
        } catch (e: any) {
            setError(e.message || 'Failed to fetch audit logs');
        } finally {
            setLoading(false);
        }
    }, [search, severity]);

    // Initial load
    useEffect(() => {
        fetchAudit(false);
    }, []);  // eslint-disable-line react-hooks/exhaustive-deps

    // ── Handlers ────────────────────────────────────────────────────────
    const handleSearch = () => {
        setCursor(null);
        setHasMore(false);
        fetchAudit(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSearch();
    };

    const handleLoadMore = () => {
        fetchAudit(true, cursor);
    };

    const handleRefresh = () => {
        setCursor(null);
        setHasMore(false);
        fetchAudit(false);
    };

    // ── Format Helpers ──────────────────────────────────────────────────
    const fmtTime = (ts: number) => {
        if (!ts) return '—';
        try {
            return new Date(ts).toLocaleString('en-GB', {
                day: '2-digit', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit', second: '2-digit',
            });
        } catch {
            return String(ts);
        }
    };

    const fmtTrace = (t: string) => t ? t.substring(0, 12) + '…' : '—';

    // ═══════════════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════════════

    return (
        <div style={s.root}>
            {/* ── Toolbar ──────────────────────────────────────────── */}
            <div style={s.toolbar}>
                <div style={s.searchRow}>
                    <input
                        id="audit-search"
                        type="text"
                        placeholder="Search by traceId or event prefix…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        onKeyDown={handleKeyDown}
                        style={s.searchInput}
                    />
                    <button id="audit-search-btn" onClick={handleSearch} style={s.btnPrimary}>
                        Search
                    </button>
                    <button id="audit-refresh-btn" onClick={handleRefresh} style={s.btnSecondary}>
                        ↻ Refresh
                    </button>
                </div>

                <div style={s.filterRow}>
                    <label style={s.filterLabel}>Severity:</label>
                    {SEVERITY_OPTIONS.map(sev => (
                        <button
                            key={sev}
                            id={`audit-sev-${sev.toLowerCase()}`}
                            onClick={() => { setSeverity(sev); }}
                            style={{
                                ...s.sevBtn,
                                ...(severity === sev ? s.sevBtnActive : {}),
                                ...(sev !== 'ALL' ? { color: SEVERITY_COLORS[sev] } : {}),
                            }}
                        >
                            {sev}
                        </button>
                    ))}
                    {role && (
                        <span style={s.roleTag}>
                            👤 {role}
                        </span>
                    )}
                </div>
            </div>

            {/* ── Error ────────────────────────────────────────────── */}
            {error && (
                <div style={s.errorBar}>⚠ {error}</div>
            )}

            {/* ── Table ────────────────────────────────────────────── */}
            <div style={s.tableWrap}>
                <table style={s.table}>
                    <thead>
                        <tr>
                            <th style={s.th}>Event</th>
                            <th style={{ ...s.th, width: 80 }}>Severity</th>
                            <th style={{ ...s.th, width: 170 }}>Timestamp</th>
                            <th style={{ ...s.th, width: 130 }}>Trace ID</th>
                            <th style={{ ...s.th, width: 100 }}>Actor</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map(item => (
                            <tr
                                key={item.id}
                                id={`audit-row-${item.id}`}
                                onClick={() => setSelected(item)}
                                style={{
                                    ...s.tr,
                                    ...(selected?.id === item.id ? s.trSelected : {}),
                                }}
                            >
                                <td style={s.td}>
                                    <code style={s.eventCode}>{item.event}</code>
                                </td>
                                <td style={s.td}>
                                    <span style={{
                                        ...s.sevBadge,
                                        color: SEVERITY_COLORS[item.severity] || '#94a3b8',
                                        background: SEVERITY_BG[item.severity] || 'transparent',
                                    }}>
                                        {item.severity}
                                    </span>
                                </td>
                                <td style={{ ...s.td, fontSize: 12, color: '#94a3b8' }}>
                                    {fmtTime(item.timestamp)}
                                </td>
                                <td style={{ ...s.td, fontSize: 11, fontFamily: 'monospace', color: '#818cf8' }}>
                                    {fmtTrace(item.traceId)}
                                </td>
                                <td style={{ ...s.td, fontSize: 12, color: '#94a3b8' }}>
                                    {item.actor
                                        ? ((item.actor as any).email || item.actor.id || item.actor.type)
                                        : '—'}
                                </td>
                            </tr>
                        ))}

                        {items.length === 0 && !loading && (
                            <tr>
                                <td colSpan={5} style={s.empty}>
                                    {error ? 'Error loading audit logs' : 'No audit events found'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* ── Pagination ───────────────────────────────────────── */}
            <div style={s.pagination}>
                {loading && <span style={s.loadingText}>Loading…</span>}
                {hasMore && !loading && (
                    <button id="audit-load-more" onClick={handleLoadMore} style={s.btnPrimary}>
                        Load More
                    </button>
                )}
                <span style={s.countText}>
                    {items.length} event{items.length !== 1 ? 's' : ''}
                </span>
            </div>

            {/* ── Detail Drawer ─────────────────────────────────────── */}
            {selected && (
                <div style={s.drawer}>
                    <div style={s.drawerHeader}>
                        <h3 style={s.drawerTitle}>
                            📋 Event Detail
                        </h3>
                        <button
                            id="audit-drawer-close"
                            onClick={() => setSelected(null)}
                            style={s.drawerClose}
                        >
                            ✕
                        </button>
                    </div>

                    <div style={s.drawerMeta}>
                        <div style={s.metaRow}>
                            <span style={s.metaLabel}>Event</span>
                            <code style={s.metaValue}>{selected.event}</code>
                        </div>
                        <div style={s.metaRow}>
                            <span style={s.metaLabel}>Severity</span>
                            <span style={{
                                ...s.sevBadge,
                                color: SEVERITY_COLORS[selected.severity] || '#94a3b8',
                                background: SEVERITY_BG[selected.severity] || 'transparent',
                            }}>
                                {selected.severity}
                            </span>
                        </div>
                        <div style={s.metaRow}>
                            <span style={s.metaLabel}>Trace ID</span>
                            <code style={{ ...s.metaValue, color: '#818cf8' }}>{selected.traceId}</code>
                        </div>
                        <div style={s.metaRow}>
                            <span style={s.metaLabel}>Timestamp</span>
                            <span style={s.metaValue}>{fmtTime(selected.timestamp)}</span>
                        </div>
                        {selected.actor && (
                            <div style={s.metaRow}>
                                <span style={s.metaLabel}>Actor</span>
                                <span style={s.metaValue}>{selected.actor.type}: {selected.actor.id}</span>
                            </div>
                        )}
                    </div>

                    <div style={s.drawerSection}>
                        <h4 style={s.drawerSubtitle}>Redacted Envelope (JSON)</h4>
                        <pre style={s.jsonPre}>
                            {JSON.stringify(selected, null, 2)}
                        </pre>
                    </div>
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════

const s: Record<string, React.CSSProperties> = {
    root: {
        position: 'relative',
    },

    // Toolbar
    toolbar: {
        background: 'rgba(30, 41, 59, 0.6)',
        border: '1px solid rgba(148, 163, 184, 0.1)',
        borderRadius: 12,
        padding: '16px 20px',
        marginBottom: 16,
    },
    searchRow: {
        display: 'flex', gap: 8, marginBottom: 12,
    },
    searchInput: {
        flex: 1, background: 'rgba(15, 23, 42, 0.8)',
        border: '1px solid rgba(148, 163, 184, 0.2)',
        borderRadius: 8, padding: '10px 14px', color: '#e2e8f0',
        fontSize: 13, fontFamily: 'monospace',
        outline: 'none',
    },
    filterRow: {
        display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' as const,
    },
    filterLabel: {
        fontSize: 12, color: '#94a3b8', marginRight: 4,
    },
    sevBtn: {
        background: 'transparent', border: '1px solid rgba(148, 163, 184, 0.15)',
        borderRadius: 6, padding: '4px 10px', color: '#94a3b8',
        fontSize: 11, fontWeight: 600, cursor: 'pointer',
        transition: 'all 0.2s ease',
    },
    sevBtnActive: {
        background: 'rgba(96, 165, 250, 0.15)',
        borderColor: 'rgba(96, 165, 250, 0.4)',
    },
    roleTag: {
        marginLeft: 'auto', fontSize: 11, color: '#a78bfa',
        background: 'rgba(167, 139, 250, 0.1)',
        padding: '4px 10px', borderRadius: 6,
    },

    // Buttons
    btnPrimary: {
        background: 'rgba(96, 165, 250, 0.15)', border: '1px solid rgba(96, 165, 250, 0.3)',
        borderRadius: 8, padding: '10px 18px', color: '#60a5fa',
        fontSize: 13, fontWeight: 600, cursor: 'pointer',
        transition: 'all 0.2s ease',
    },
    btnSecondary: {
        background: 'transparent', border: '1px solid rgba(148, 163, 184, 0.15)',
        borderRadius: 8, padding: '10px 14px', color: '#94a3b8',
        fontSize: 13, cursor: 'pointer',
        transition: 'all 0.2s ease',
    },

    // Error
    errorBar: {
        background: 'rgba(248, 113, 113, 0.1)', border: '1px solid rgba(248, 113, 113, 0.2)',
        borderRadius: 8, padding: '10px 16px', color: '#f87171',
        fontSize: 13, marginBottom: 12,
    },

    // Table
    tableWrap: {
        background: 'rgba(30, 41, 59, 0.6)',
        border: '1px solid rgba(148, 163, 184, 0.1)',
        borderRadius: 12, overflow: 'hidden',
    },
    table: {
        width: '100%', borderCollapse: 'collapse' as const,
    },
    th: {
        textAlign: 'left' as const, padding: '12px 16px',
        fontSize: 11, fontWeight: 600, color: '#64748b',
        textTransform: 'uppercase' as const, letterSpacing: 0.5,
        borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
        background: 'rgba(15, 23, 42, 0.3)',
    },
    tr: {
        cursor: 'pointer',
        transition: 'background 0.15s ease',
        borderBottom: '1px solid rgba(148, 163, 184, 0.06)',
    },
    trSelected: {
        background: 'rgba(96, 165, 250, 0.08)',
    },
    td: {
        padding: '10px 16px', fontSize: 13,
    },
    eventCode: {
        fontSize: 12, fontFamily: 'monospace', color: '#e2e8f0',
        background: 'rgba(15, 23, 42, 0.4)', padding: '2px 6px',
        borderRadius: 4,
    },
    sevBadge: {
        fontSize: 10, fontWeight: 700, padding: '3px 8px',
        borderRadius: 4, textTransform: 'uppercase' as const,
    },
    empty: {
        textAlign: 'center' as const, padding: '40px 16px',
        color: '#64748b', fontSize: 13, fontStyle: 'italic' as const,
    },

    // Pagination
    pagination: {
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 0',
    },
    loadingText: {
        fontSize: 13, color: '#94a3b8',
    },
    countText: {
        fontSize: 12, color: '#64748b', marginLeft: 'auto',
    },

    // Drawer
    drawer: {
        position: 'fixed' as const, top: 0, right: 0,
        width: 480, height: '100vh',
        background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
        borderLeft: '1px solid rgba(148, 163, 184, 0.15)',
        boxShadow: '-8px 0 32px rgba(0,0,0,0.4)',
        zIndex: 1000, overflowY: 'auto' as const,
        padding: '24px',
    },
    drawerHeader: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 20, paddingBottom: 16,
        borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
    },
    drawerTitle: {
        fontSize: 16, fontWeight: 700, margin: 0, color: '#e2e8f0',
    },
    drawerClose: {
        background: 'transparent', border: '1px solid rgba(148, 163, 184, 0.2)',
        borderRadius: 6, padding: '6px 10px', color: '#94a3b8',
        cursor: 'pointer', fontSize: 14,
    },
    drawerMeta: {
        marginBottom: 20,
    },
    metaRow: {
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '8px 0',
        borderBottom: '1px solid rgba(148, 163, 184, 0.06)',
    },
    metaLabel: {
        fontSize: 11, color: '#64748b', width: 80,
        textTransform: 'uppercase' as const, fontWeight: 600,
    },
    metaValue: {
        fontSize: 13, color: '#e2e8f0',
    },
    drawerSection: {
        marginTop: 16,
    },
    drawerSubtitle: {
        fontSize: 12, color: '#64748b', fontWeight: 600,
        textTransform: 'uppercase' as const, marginBottom: 8,
        letterSpacing: 0.5,
    },
    jsonPre: {
        background: 'rgba(15, 23, 42, 0.6)',
        border: '1px solid rgba(148, 163, 184, 0.1)',
        borderRadius: 8, padding: 16,
        fontSize: 11, fontFamily: 'monospace',
        color: '#94a3b8', whiteSpace: 'pre-wrap' as const,
        wordBreak: 'break-all' as const,
        maxHeight: '60vh', overflowY: 'auto' as const,
    },
};
