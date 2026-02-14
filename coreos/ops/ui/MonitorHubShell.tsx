'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MonitorHubShell — OS Shell Mirror (Phase 26A)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Internal tab navigation shell for the OS Shell Monitor Hub window.
 * Uses state-based navigation (no URL params) to switch between
 * the same shared views used by /ops/* routes.
 *
 * Tabs: System Status | Runtime Metrics | Brain | Workers | Audit
 *
 * @module coreos/ops/ui/MonitorHubShell
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { SystemStatusView } from './SystemStatusView';
import { RuntimeMetricsView } from './RuntimeMetricsView';
import { BrainDashboardView } from '@/coreos/brain/ui/BrainDashboardView';
import { WorkersView } from './WorkersView';
import { AuditView } from './AuditView';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

type ViewId = 'status' | 'metrics' | 'brain' | 'workers' | 'audit';

const TABS: { id: ViewId; label: string; icon: string }[] = [
    { id: 'status', label: 'System Status', icon: '🟢' },
    { id: 'metrics', label: 'Runtime Metrics', icon: '📊' },
    { id: 'brain', label: 'Brain', icon: '🧠' },
    { id: 'workers', label: 'Workers', icon: '⚙️' },
    { id: 'audit', label: 'Audit', icon: '📋' },
];

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function MonitorHubShell() {
    const [activeView, setActiveView] = useState<ViewId>('status');

    return (
        <div style={s.root}>
            {/* Header (Matched to /ops) */}
            <header style={s.header}>
                <div>
                    <h1 style={s.title}>◈ Monitor Hub</h1>
                    <p style={s.subtitle}>Phase 26A — Unified Operations Center</p>
                </div>
            </header>

            {/* Tab Navigation */}
            <nav style={s.tabBar}>
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveView(tab.id)}
                        style={{
                            ...s.tabBtn,
                            ...(activeView === tab.id ? s.tabActive : {}),
                        }}
                    >
                        <span>{tab.icon}</span> {tab.label}
                    </button>
                ))}
            </nav>

            {/* View Content */}
            <div style={s.content}>
                {activeView === 'status' && <SystemStatusView compact />}
                {activeView === 'metrics' && <RuntimeMetricsView compact />}
                {activeView === 'brain' && <BrainDashboardView compact />}
                {activeView === 'workers' && <WorkersView />}
                {activeView === 'audit' && <AuditView />}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════

const s: Record<string, React.CSSProperties> = {
    root: {
        display: 'flex', flexDirection: 'column', height: '100%',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', // Match /ops styles
        color: '#e2e8f0',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", sans-serif',
    },
    header: {
        padding: '16px 20px 0',
    },
    title: {
        fontSize: 20, fontWeight: 700, margin: 0,
        background: 'linear-gradient(135deg, #60a5fa, #a78bfa)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
    },
    subtitle: { fontSize: 11, color: '#94a3b8', margin: '2px 0 0', letterSpacing: 0.5 },
    tabBar: {
        display: 'flex', gap: 2, flexShrink: 0,
        borderBottom: '1px solid rgba(148, 163, 184, 0.12)',
        padding: '12px 16px 0', flexWrap: 'wrap',
        marginTop: 12,
        // background: 'rgba(15, 23, 42, 0.3)', // Removed to blend with main gradient
    },
    tabBtn: {
        background: 'transparent', border: 'none', color: '#94a3b8',
        padding: '8px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 500,
        borderBottom: '2px solid transparent', display: 'flex', alignItems: 'center', gap: 4,
        transition: 'all 0.2s ease', whiteSpace: 'nowrap' as const,
    },
    tabActive: {
        color: '#60a5fa', borderBottomColor: '#60a5fa', fontWeight: 600,
    },
    content: {
        flex: 1, overflow: 'auto', padding: 20,
    },
};
