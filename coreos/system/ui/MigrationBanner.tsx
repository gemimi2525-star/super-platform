'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MigrationBanner — Phase 27A Safe Migration
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Displays a non-blocking deprecation banner in legacy apps:
 *   - core.settings → System Hub > General
 *   - user.manage → System Hub > Users
 *   - org.manage → System Hub > Organization
 *   - system.configure → System Hub > Configuration
 *
 * Does NOT remove any functionality.
 * Can be hidden by user (sessionStorage).
 *
 * @module coreos/system/ui/MigrationBanner
 * @version 1.0.0
 */

import React, { useState } from 'react';

interface MigrationBannerProps {
    /** The hub tab this legacy app maps to */
    hubTab: string;
    /** Human-readable label for the hub section */
    hubLabel: string;
}

export function MigrationBanner({ hubTab, hubLabel }: MigrationBannerProps) {
    const storageKey = `migration-banner-dismissed-${hubTab}`;
    const [dismissed, setDismissed] = useState(() => {
        try { return sessionStorage.getItem(storageKey) === 'true'; } catch { return false; }
    });

    if (dismissed) return null;

    const handleDismiss = () => {
        setDismissed(true);
        try { sessionStorage.setItem(storageKey, 'true'); } catch { /* noop */ }
    };

    return (
        <div style={s.banner}>
            <div style={s.content}>
                <span style={{ fontSize: 16 }}>📢</span>
                <div style={s.text}>
                    <strong>This app is moving to System Hub</strong>
                    <span style={s.sub}>
                        You can now access {hubLabel} in the unified{' '}
                        <strong>System Hub</strong> app from the dock.
                    </span>
                </div>
            </div>
            <button onClick={handleDismiss} style={s.dismiss} aria-label="Dismiss banner">
                ✕
            </button>
        </div>
    );
}

const s: Record<string, React.CSSProperties> = {
    banner: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: '10px 16px',
        margin: '0 0 12px 0',
        borderRadius: 8,
        background: 'linear-gradient(135deg, rgba(96, 165, 250, 0.12) 0%, rgba(167, 139, 250, 0.08) 100%)',
        border: '1px solid rgba(96, 165, 250, 0.2)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    content: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
    },
    text: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: 2,
        fontSize: 12,
        color: '#e2e8f0',
    },
    sub: {
        fontSize: 11,
        color: '#94a3b8',
    },
    dismiss: {
        background: 'none',
        border: 'none',
        color: '#64748b',
        cursor: 'pointer',
        fontSize: 14,
        padding: '4px 6px',
        borderRadius: 4,
        flexShrink: 0,
    },
};

export default MigrationBanner;
