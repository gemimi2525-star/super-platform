'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AboutView — System Hub Tab (Phase 27C.7 — About Parity)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Dark-themed "About" view for System Hub. Fetches /api/ops/about for
 * architecture + governance info. Mirrors Legacy SettingsAboutContent
 * with dark variant styling.
 *
 * @module coreos/system/ui/AboutView
 * @version 1.0.0 — Phase 27C.7
 */

import React, { useEffect, useState } from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface AboutData {
    product: string;
    version: string;
    phase: string;
    architecture: {
        shell: { name: string; desc: string };
        windowSystem: { name: string; desc: string };
        kernel: { name: string; desc: string };
    };
    governance: {
        consistencyGate: string;
        auditLogging: string;
    };
    ts: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function AboutView() {
    const [data, setData] = useState<AboutData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [advancedOpen, setAdvancedOpen] = useState(false);

    useEffect(() => {
        fetch('/api/ops/about')
            .then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            })
            .then(setData)
            .catch(e => setError(e.message));
    }, []);

    if (error) {
        return (
            <div style={s.errorBanner}>
                ⚠️ Failed to load system info: {error}
            </div>
        );
    }

    if (!data) {
        return (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
                Loading system info…
            </div>
        );
    }

    const stackRows = [
        { layer: 'Shell Layer', name: data.architecture.shell.name, desc: data.architecture.shell.desc },
        { layer: 'Window System', name: data.architecture.windowSystem.name, desc: data.architecture.windowSystem.desc },
        { layer: 'Kernel', name: data.architecture.kernel.name, desc: data.architecture.kernel.desc },
    ];

    const governanceRows = [
        { label: 'Consistency Gate', value: data.governance.consistencyGate },
        { label: 'Audit Logging', value: data.governance.auditLogging },
    ];

    return (
        <div style={s.wrapper}>
            {/* Title */}
            <h2 style={s.title}>{data.product}</h2>
            <p style={s.subtitle}>
                v{data.version} — Window System
            </p>

            {/* Architecture Stack Card */}
            <div style={s.card}>
                <div style={s.cardHeader}>ARCHITECTURE STACK</div>
                <div style={s.stackTable}>
                    {stackRows.map((row, i) => (
                        <div
                            key={row.name}
                            style={{
                                ...s.stackRow,
                                borderBottom: i < stackRows.length - 1
                                    ? '1px solid rgba(148, 163, 184, 0.08)'
                                    : 'none',
                            }}
                        >
                            <div style={s.stackLabel}>{row.layer}</div>
                            <div style={s.stackName}>{row.name}</div>
                            <div style={s.stackDesc}>{row.desc}</div>
                        </div>
                    ))}
                </div>

                {/* Full Stack Label */}
                <div style={s.stackBadge}>
                    {data.architecture.shell.name} → {data.architecture.windowSystem.name} → {data.architecture.kernel.name}
                </div>
            </div>

            {/* Governance Card */}
            <div style={s.card}>
                <div style={s.cardHeader}>GOVERNANCE</div>
                <div style={s.govTable}>
                    {governanceRows.map(row => (
                        <div key={row.label} style={s.govRow}>
                            <span style={s.govLabel}>{row.label}</span>
                            <span style={{
                                ...s.govValue,
                                color: row.value === 'active' || row.value === 'enabled'
                                    ? '#4ade80' : '#f87171',
                            }}>
                                <span style={{
                                    display: 'inline-block',
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    marginRight: 8,
                                    background: row.value === 'active' || row.value === 'enabled'
                                        ? '#4ade80' : '#f87171',
                                }} />
                                {row.value.charAt(0).toUpperCase() + row.value.slice(1)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Advanced (placeholder for parity) */}
            <button
                style={s.advancedToggle}
                onClick={() => setAdvancedOpen(!advancedOpen)}
            >
                {advancedOpen ? '▾' : '▸'} Advanced
            </button>
            {advancedOpen && (
                <div style={s.advancedContent}>
                    <div style={s.advRow}><span style={s.advLabel}>Phase:</span> {data.phase}</div>
                    <div style={s.advRow}><span style={s.advLabel}>Timestamp:</span> {data.ts}</div>
                    <div style={s.advRow}><span style={s.advLabel}>API Endpoint:</span> /api/ops/about</div>
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLES (dark theme — matches System Hub)
// ═══════════════════════════════════════════════════════════════════════════

const s: Record<string, React.CSSProperties> = {
    wrapper: {
        maxWidth: 560,
    },
    title: {
        margin: '0 0 4px',
        fontSize: 20,
        fontWeight: 600,
        color: 'rgba(255,255,255,0.95)',
    },
    subtitle: {
        margin: '0 0 24px',
        fontSize: 13,
        color: '#94a3b8',
    },
    card: {
        marginBottom: 20,
        borderRadius: 10,
        border: '1px solid rgba(148, 163, 184, 0.12)',
        overflow: 'hidden',
    },
    cardHeader: {
        padding: '10px 16px',
        fontSize: 11,
        fontWeight: 600,
        color: '#94a3b8',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.8px',
        background: 'rgba(148, 163, 184, 0.06)',
        borderBottom: '1px solid rgba(148, 163, 184, 0.08)',
    },
    stackTable: {},
    stackRow: {
        display: 'flex',
        alignItems: 'center',
        padding: '12px 16px',
    },
    stackLabel: {
        width: 120,
        fontSize: 12,
        color: '#94a3b8',
    },
    stackName: {
        width: 90,
        fontWeight: 600,
        fontSize: 13,
        fontFamily: 'SF Mono, Monaco, Consolas, monospace',
        color: '#e2e8f0',
    },
    stackDesc: {
        flex: 1,
        fontSize: 12,
        color: '#64748b',
    },
    stackBadge: {
        margin: '0 16px 12px',
        padding: '8px 12px',
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        borderRadius: 6,
        color: 'rgba(255,255,255,0.8)',
        fontSize: 11,
        fontFamily: 'SF Mono, Monaco, Consolas, monospace',
        textAlign: 'center' as const,
        letterSpacing: '0.3px',
        border: '1px solid rgba(96, 165, 250, 0.15)',
    },
    govTable: {},
    govRow: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: '1px solid rgba(148, 163, 184, 0.08)',
    },
    govLabel: {
        fontSize: 13,
        color: '#cbd5e1',
    },
    govValue: {
        fontSize: 13,
        fontWeight: 500,
        display: 'flex',
        alignItems: 'center',
    },
    advancedToggle: {
        background: 'none',
        border: 'none',
        color: '#64748b',
        fontSize: 12,
        cursor: 'pointer',
        padding: '8px 0',
        fontFamily: 'inherit',
    },
    advancedContent: {
        padding: '12px 16px',
        background: 'rgba(15, 23, 42, 0.5)',
        borderRadius: 8,
        border: '1px solid rgba(148, 163, 184, 0.08)',
    },
    advRow: {
        fontSize: 12,
        color: '#94a3b8',
        marginBottom: 6,
        fontFamily: 'SF Mono, Monaco, Consolas, monospace',
    },
    advLabel: {
        color: '#64748b',
        marginRight: 8,
    },
    errorBanner: {
        padding: '12px 16px',
        background: 'rgba(248, 113, 113, 0.1)',
        border: '1px solid rgba(248, 113, 113, 0.3)',
        borderRadius: 8,
        color: '#fca5a5',
        fontSize: 13,
    },
};
