/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Monitor Hub App — OS Shell Mirror (Phase 26A)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Owner-only in-shell window that renders the full MonitorHubShell
 * with 5 internal tabs (status, metrics, brain, workers, audit).
 *
 * Replaces legacy OpsCenterMVP (1830 lines, 10 tabs) with
 * a lighter shell that uses the same shared views as /ops/* routes.
 *
 * @module components/os-shell/apps/ops/MonitorHubApp
 * @version 1.0.0
 */

'use client';

import React from 'react';
import type { AppProps } from '../registry';
import { MonitorHubShell } from '@/coreos/ops/ui/MonitorHubShell';

export function MonitorHubApp({ windowId, capabilityId, isFocused }: AppProps) {
    return (
        <div style={styles.container}>
            <MonitorHubShell />

            {/* Break-glass access */}
            <div style={styles.breakGlass}>
                <button
                    onClick={() => window.open('/ops', '_blank')}
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
