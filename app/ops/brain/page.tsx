'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Brain Dashboard Page — Break-Glass Access (Phase 25D)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Full-page wrapper for BrainDashboardView.
 * This is the "break-glass" route at /ops/brain — not the primary flow.
 * Primary flow is via OS Shell → brain.dashboard window.
 *
 * Inherits /ops layout guard (owner-only).
 *
 * @module app/ops/brain/page
 * @version 2.0.0
 */

import React from 'react';
import { BrainDashboardView } from '@/coreos/brain/ui/BrainDashboardView';

export default function BrainDashboardPage() {
    return (
        <div style={pageStyles.page}>
            <div style={pageStyles.container}>
                {/* Back to Hub */}
                <div style={{ marginBottom: 12 }}>
                    <button
                        onClick={() => window.location.href = '/ops'}
                        style={pageStyles.backBtn}
                    >
                        ← Back to Monitor Hub
                    </button>
                </div>

                {/* Full Brain Dashboard */}
                <BrainDashboardView />
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE-LEVEL STYLES (gradient bg, full viewport)
// ═══════════════════════════════════════════════════════════════════════════

const pageStyles: Record<string, React.CSSProperties> = {
    page: {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f0c29 0%, #1a1a3e 50%, #24243e 100%)',
        padding: '24px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
        color: '#e2e8f0',
    },
    container: {
        maxWidth: 900,
        margin: '0 auto',
    },
    backBtn: {
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.12)',
        color: 'rgba(255,255,255,0.6)',
        padding: '6px 14px',
        borderRadius: 8,
        cursor: 'pointer',
        fontSize: 13,
        fontWeight: 500,
        transition: 'all 0.2s',
    },
};
