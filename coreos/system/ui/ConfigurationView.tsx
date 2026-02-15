'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ConfigurationView — System Hub Tab (Phase 27A)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * System mode, feature flags, security toggles, debug, emergency.
 * Shared between OS Shell window and /system/configuration route.
 * Placeholder — wraps SystemConfigureApp internals.
 *
 * @module coreos/system/ui/ConfigurationView
 * @version 1.0.0
 */

import React, { useState } from 'react';

interface ConfigurationViewProps {
    compact?: boolean;
}

export function ConfigurationView({ compact }: ConfigurationViewProps) {
    const [systemMode, setSystemMode] = useState<'production' | 'maintenance' | 'debug'>('production');

    return (
        <div>
            {/* System Mode */}
            <div style={s.section}>
                <div style={s.sectionHeader}>
                    <span style={{ fontSize: 18 }}>⚡</span>
                    <h3 style={s.sectionTitle}>System Mode</h3>
                </div>
                <div style={s.card}>
                    <div style={s.row}>
                        <div>
                            <div style={s.label}>Current Mode</div>
                            <div style={s.desc}>Controls system behavior and access restrictions</div>
                        </div>
                        <select
                            value={systemMode}
                            onChange={(e) => setSystemMode(e.target.value as typeof systemMode)}
                            style={s.select}
                        >
                            <option value="production">🟢 Production</option>
                            <option value="maintenance">🟡 Maintenance</option>
                            <option value="debug">🔴 Debug</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Feature Flags */}
            <div style={s.section}>
                <div style={s.sectionHeader}>
                    <span style={{ fontSize: 18 }}>🚩</span>
                    <h3 style={s.sectionTitle}>Feature Flags</h3>
                </div>
                <div style={s.card}>
                    {[
                        { label: 'Enforce Step-Up Auth', desc: 'Require additional verification for sensitive ops', enabled: true },
                        { label: 'Strict Validation', desc: 'Enable strict input validation on all forms', enabled: true },
                        { label: 'Audit Logging', desc: 'Log all decision actions to audit trail', enabled: true },
                    ].map((flag, i) => (
                        <div key={flag.label} style={s.row}>
                            <div>
                                <div style={s.label}>{flag.label}</div>
                                <div style={s.desc}>{flag.desc}</div>
                            </div>
                            <div style={{
                                ...s.toggleTrack,
                                background: flag.enabled ? '#22c55e' : 'rgba(148, 163, 184, 0.2)',
                            }}>
                                <div style={{
                                    ...s.toggleThumb,
                                    transform: flag.enabled ? 'translateX(16px)' : 'translateX(0)',
                                }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Emergency Controls */}
            <div style={s.section}>
                <div style={s.sectionHeader}>
                    <span style={{ fontSize: 18 }}>🚨</span>
                    <h3 style={s.sectionTitle}>Emergency Controls</h3>
                </div>
                <div style={s.card}>
                    <div style={s.row}>
                        <div>
                            <div style={s.label}>Soft Disable</div>
                            <div style={s.desc}>Gracefully disable non-essential capabilities</div>
                        </div>
                        <div style={{
                            ...s.toggleTrack,
                            background: 'rgba(148, 163, 184, 0.2)',
                        }}>
                            <div style={{ ...s.toggleThumb, transform: 'translateX(0)' }} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

const s: Record<string, React.CSSProperties> = {
    section: { marginBottom: 28 },
    sectionHeader: {
        display: 'flex', alignItems: 'center', gap: 8,
        marginBottom: 12, paddingBottom: 8,
        borderBottom: '1px solid rgba(148, 163, 184, 0.12)',
    },
    sectionTitle: {
        margin: 0, fontSize: 15, fontWeight: 600, color: '#e2e8f0',
    },
    card: {
        background: 'rgba(30, 41, 59, 0.5)',
        borderRadius: 10,
        border: '1px solid rgba(148, 163, 184, 0.08)',
        overflow: 'hidden',
    },
    row: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 16px',
        borderBottom: '1px solid rgba(148, 163, 184, 0.06)',
    },
    label: { fontSize: 13, fontWeight: 500, color: '#e2e8f0', marginBottom: 2 },
    desc: { fontSize: 11, color: '#94a3b8' },
    select: {
        padding: '6px 12px', border: '1px solid rgba(148, 163, 184, 0.2)',
        borderRadius: 6, fontSize: 13, cursor: 'pointer',
        background: 'rgba(30, 41, 59, 0.8)', color: '#e2e8f0',
    },
    toggleTrack: {
        width: 36, height: 20, borderRadius: 10, position: 'relative' as const,
        cursor: 'pointer', transition: 'background 0.2s',
    },
    toggleThumb: {
        width: 16, height: 16, borderRadius: '50%', background: '#fff',
        position: 'absolute' as const, top: 2, left: 2,
        transition: 'transform 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
    },
};
