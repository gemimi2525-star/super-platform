/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Brain Dashboard App — In-shell Window (Phase 25B)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Owner-only in-shell window that provides:
 * - Trust indicator (DRAFTER + LOCKED)
 * - Quick proposal count from API
 * - "Open Brain Dashboard" link to /os/brain (→ /ops/brain)
 *
 * This is NOT the full dashboard — it's a quick-access launcher.
 *
 * @module components/os-shell/apps/brain/BrainDashboardApp
 * @version 1.0.0
 */

'use client';

import React, { useState, useEffect } from 'react';
import type { AppProps } from '../registry';

export function BrainDashboardApp({ windowId, capabilityId, isFocused }: AppProps) {
    const [proposalCount, setProposalCount] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/brain/proposals?limit=10')
            .then(res => res.ok ? res.json() : Promise.reject('API error'))
            .then(data => setProposalCount(data.count ?? 0))
            .catch(() => setProposalCount(null))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div style={styles.container}>
            {/* Trust Indicator */}
            <div style={styles.trustBanner}>
                <div style={styles.trustItem}>
                    <span style={styles.trustLabel}>MODE</span>
                    <span style={styles.trustDrafter}>DRAFTER</span>
                </div>
                <div style={styles.trustDivider} />
                <div style={styles.trustItem}>
                    <span style={styles.trustLabel}>EXECUTION</span>
                    <span style={styles.trustLocked}>🔒 LOCKED</span>
                </div>
            </div>

            {/* Status */}
            <div style={styles.statusCard}>
                <h3 style={styles.cardTitle}>📊 Proposal Status</h3>
                {loading ? (
                    <p style={styles.statusText}>Loading...</p>
                ) : proposalCount !== null ? (
                    <p style={styles.statusText}>
                        <span style={styles.countBadge}>{proposalCount}</span> active proposals
                    </p>
                ) : (
                    <p style={styles.statusText}>Unable to fetch proposals</p>
                )}
            </div>

            {/* Actions */}
            <div style={styles.actions}>
                <button
                    onClick={() => window.location.href = '/os/brain'}
                    style={styles.primaryBtn}
                >
                    🧠 Open Brain Dashboard
                </button>
                <button
                    onClick={() => window.location.href = '/os/ops'}
                    style={styles.secondaryBtn}
                >
                    📊 Open Ops Center
                </button>
            </div>

            {/* Info */}
            <p style={styles.footerText}>
                Phase 25B — Owner-only control plane access
            </p>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════

const styles: Record<string, React.CSSProperties> = {
    container: {
        padding: 24,
        fontFamily: 'var(--nx-font-system, -apple-system, BlinkMacSystemFont, sans-serif)',
        color: 'var(--nx-text-primary, #e2e8f0)',
        background: 'var(--nx-surface-window, #1a1a2e)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
    },
    trustBanner: {
        display: 'flex',
        alignItems: 'center',
        gap: 0,
        background: 'rgba(99, 102, 241, 0.08)',
        border: '1px solid rgba(99, 102, 241, 0.25)',
        borderRadius: 10,
        padding: '10px 20px',
    },
    trustItem: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        flex: 1,
        gap: 3,
    },
    trustDivider: {
        width: 1,
        height: 30,
        background: 'rgba(99, 102, 241, 0.25)',
    },
    trustLabel: {
        fontSize: 9,
        textTransform: 'uppercase' as const,
        letterSpacing: 1.5,
        color: 'rgba(255,255,255,0.35)',
    },
    trustDrafter: {
        fontSize: 13,
        fontWeight: 700,
        color: '#818cf8',
        letterSpacing: 1,
    },
    trustLocked: {
        fontSize: 13,
        fontWeight: 700,
        color: '#f59e0b',
        letterSpacing: 1,
    },
    statusCard: {
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 10,
        padding: '16px 20px',
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: 600,
        margin: '0 0 8px 0',
        color: 'var(--nx-text-primary, #f8fafc)',
    },
    statusText: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.6)',
        margin: 0,
    },
    countBadge: {
        fontSize: 20,
        fontWeight: 700,
        color: '#818cf8',
        marginRight: 6,
    },
    actions: {
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
    },
    primaryBtn: {
        padding: '10px 20px',
        borderRadius: 8,
        border: 'none',
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        color: '#fff',
        fontWeight: 600,
        fontSize: 13,
        cursor: 'pointer',
        textAlign: 'center' as const,
    },
    secondaryBtn: {
        padding: '10px 20px',
        borderRadius: 8,
        border: '1px solid rgba(255,255,255,0.15)',
        background: 'rgba(255,255,255,0.06)',
        color: 'rgba(255,255,255,0.8)',
        fontWeight: 500,
        fontSize: 13,
        cursor: 'pointer',
        textAlign: 'center' as const,
    },
    footerText: {
        marginTop: 'auto',
        fontSize: 11,
        color: 'rgba(255,255,255,0.25)',
        textAlign: 'center' as const,
    },
};
