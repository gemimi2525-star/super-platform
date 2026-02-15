'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AppsView — System Hub Tab (Phase 27A)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * App Store entry + permissions overview placeholder.
 * Links to core.store capability.
 *
 * @module coreos/system/ui/AppsView
 * @version 1.0.0
 */

import React from 'react';

interface AppsViewProps {
    compact?: boolean;
}

export function AppsView({ compact }: AppsViewProps) {
    return (
        <div>
            {/* App Store Link */}
            <div style={s.section}>
                <div style={s.sectionHeader}>
                    <span style={{ fontSize: 18 }}>🛍️</span>
                    <h3 style={s.sectionTitle}>App Store</h3>
                </div>
                <div style={s.card}>
                    <div style={s.row}>
                        <div>
                            <div style={s.label}>Browse & Install Apps</div>
                            <div style={s.desc}>Open the App Store to manage installed applications</div>
                        </div>
                        <button
                            onClick={() => window.open('/os', '_self')}
                            style={s.actionBtn}
                        >
                            Open App Store →
                        </button>
                    </div>
                </div>
            </div>

            {/* Permissions Overview */}
            <div style={s.section}>
                <div style={s.sectionHeader}>
                    <span style={{ fontSize: 18 }}>🔑</span>
                    <h3 style={s.sectionTitle}>App Permissions</h3>
                </div>
                <div style={s.card}>
                    <div style={{ padding: 20, textAlign: 'center' as const }}>
                        <div style={{ fontSize: 32, marginBottom: 8 }}>🔐</div>
                        <div style={{ fontSize: 14, color: '#e2e8f0', fontWeight: 500, marginBottom: 4 }}>
                            Permissions Overview
                        </div>
                        <div style={{ fontSize: 12, color: '#94a3b8' }}>
                            App permission management will be available in Phase 27B
                        </div>
                    </div>
                </div>
            </div>

            {/* Installed Apps Summary */}
            <div style={s.section}>
                <div style={s.sectionHeader}>
                    <span style={{ fontSize: 18 }}>📦</span>
                    <h3 style={s.sectionTitle}>Installed Apps</h3>
                </div>
                <div style={s.card}>
                    {[
                        { name: 'Finder', icon: '📁', version: '1.0.0', tier: 'Core' },
                        { name: 'System Settings', icon: '⚙️', version: '2.0.0', tier: 'Core' },
                        { name: 'Brain', icon: '🧠', version: '1.0.0', tier: 'Core' },
                        { name: 'Monitor Hub', icon: '◈', version: '3.0.0', tier: 'Core' },
                        { name: 'Notes', icon: '📝', version: '1.0.0', tier: 'Core' },
                    ].map(app => (
                        <div key={app.name} style={s.row}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 2 }}>
                                <span style={{ fontSize: 20 }}>{app.icon}</span>
                                <div>
                                    <div style={s.label}>{app.name}</div>
                                    <div style={s.desc}>v{app.version}</div>
                                </div>
                            </div>
                            <div style={{ flex: 1 }}>
                                <span style={s.tierBadge}>{app.tier}</span>
                            </div>
                        </div>
                    ))}
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
        padding: '12px 16px',
        borderBottom: '1px solid rgba(148, 163, 184, 0.06)',
    },
    label: { fontSize: 13, fontWeight: 500, color: '#e2e8f0', marginBottom: 2 },
    desc: { fontSize: 11, color: '#94a3b8' },
    actionBtn: {
        padding: '8px 16px', border: '1px solid rgba(96, 165, 250, 0.3)',
        borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 500,
        background: 'rgba(96, 165, 250, 0.1)', color: '#60a5fa',
        transition: 'all 0.2s',
    },
    tierBadge: {
        fontSize: 11, fontWeight: 500, padding: '2px 8px',
        borderRadius: 4, background: 'rgba(148, 163, 184, 0.1)',
        color: '#94a3b8',
    },
};
