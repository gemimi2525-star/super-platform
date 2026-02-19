'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Ops Center — Workers (Phase 26A → 39F)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * /ops/workers page — placeholder.
 * Inherits /ops layout guard (owner-only).
 *
 * @module app/ops/workers/page
 * @version 1.0.0
 */

import React from 'react';
import { OpsNavBar } from '@/coreos/ops/ui/OpsNavBar';
import { WorkersView } from '@/coreos/ops/ui/WorkersView';

export default function WorkersPage() {
    return (
        <div style={s.page}>
            <div style={s.container}>
                <header style={s.header}>
                    <div>
                        <h1 style={s.title}>◈ Ops Center</h1>
                        <p style={s.subtitle}>Workers</p>
                    </div>
                </header>

                <OpsNavBar />

                <WorkersView />
            </div>
        </div>
    );
}

const s: Record<string, React.CSSProperties> = {
    page: {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        color: '#e2e8f0',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", sans-serif',
        padding: '32px',
    },
    container: { maxWidth: 1100, margin: '0 auto' },
    header: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 20, borderBottom: '1px solid rgba(148, 163, 184, 0.15)', paddingBottom: 20,
    },
    title: {
        fontSize: 28, fontWeight: 700, margin: 0,
        background: 'linear-gradient(135deg, #60a5fa, #a78bfa)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
    },
    subtitle: { fontSize: 13, color: '#94a3b8', margin: '4px 0 0', letterSpacing: 1 },
};
