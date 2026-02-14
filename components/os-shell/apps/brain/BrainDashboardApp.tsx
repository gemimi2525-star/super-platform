/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Brain Dashboard App — OS Shell Mirror View (Phase 25D)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Owner-only in-shell window that renders the FULL Brain Dashboard
 * inside the OS Shell window — no redirect needed.
 *
 * Primary flow: Owner uses this inside /os
 * Break-glass: "Open in Browser" button → /ops/brain
 *
 * @module components/os-shell/apps/brain/BrainDashboardApp
 * @version 2.0.0
 */

'use client';

import React from 'react';
import type { AppProps } from '../registry';
import { BrainDashboardView } from '@/coreos/brain/ui/BrainDashboardView';

export function BrainDashboardApp({ windowId, capabilityId, isFocused }: AppProps) {
    return (
        <div style={styles.container}>
            {/* Full Brain Dashboard — mirror view */}
            <BrainDashboardView compact />

            {/* Break-glass access */}
            <div style={styles.breakGlass}>
                <button
                    onClick={() => window.open('/ops/brain', '_blank')}
                    style={styles.breakGlassBtn}
                >
                    🔗 Open in Browser (break-glass)
                </button>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════

const styles: Record<string, React.CSSProperties> = {
    container: {
        background: 'var(--nx-surface-window, #1a1a2e)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
    },
    breakGlass: {
        flexShrink: 0,
        padding: '8px 16px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        justifyContent: 'flex-end',
    },
    breakGlassBtn: {
        background: 'transparent',
        border: '1px solid rgba(255,255,255,0.1)',
        color: 'rgba(255,255,255,0.4)',
        padding: '4px 12px',
        borderRadius: 6,
        cursor: 'pointer',
        fontSize: 11,
        fontWeight: 500,
        transition: 'all 0.2s',
    },
};
