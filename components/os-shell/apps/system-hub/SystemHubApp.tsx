'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SystemHubApp — OS Shell Window Component (Phase 27A → 39E)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * OS Shell window wrapper for System Hub.
 * Phase 39E: Removed break-glass link to /system (rescue layer boundary).
 * System Hub is an OS app — /system is a separate Recovery environment.
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
            {/* Main Hub Shell — Phase 39E: no /system link (rescue boundary) */}
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
    shellWrapper: {
        flex: 1,
        overflow: 'hidden',
    },
};

export default SystemHubApp;
