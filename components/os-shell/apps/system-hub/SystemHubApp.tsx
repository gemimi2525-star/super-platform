'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SystemHubApp — OS Shell Window Component (Phase 27A)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * OS Shell window wrapper for System Hub.
 * Renders SystemHubShell with break-glass route link.
 * Pattern: MonitorHubApp.tsx
 *
 * @module components/os-shell/apps/system-hub/SystemHubApp
 * @version 1.0.0
 */

import React from 'react';
import { SystemHubShell } from '@/coreos/system/ui/SystemHubShell';
import type { AppProps } from '../registry';

export function SystemHubApp({ windowId, capabilityId, isFocused }: AppProps) {
    return (
        <div style={s.container}>
            {/* Break-glass link */}
            <div style={s.breakGlass}>
                <span style={{ fontSize: 11, color: '#64748b' }}>
                    Standalone:
                </span>
                <a
                    href="/system"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={s.breakGlassLink}
                >
                    /system →
                </a>
            </div>

            {/* Main Hub Shell */}
            <div style={s.shellWrapper}>
                <SystemHubShell />
            </div>
        </div>
    );
}

const s: Record<string, React.CSSProperties> = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(15, 23, 42, 0.95) 100%)',
    },
    breakGlass: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 12px',
        borderBottom: '1px solid rgba(148, 163, 184, 0.06)',
        background: 'rgba(15, 23, 42, 0.6)',
    },
    breakGlassLink: {
        fontSize: 11,
        color: '#60a5fa',
        textDecoration: 'none',
        fontFamily: 'monospace',
    },
    shellWrapper: {
        flex: 1,
        overflow: 'hidden',
    },
};

export default SystemHubApp;
