'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * DevBadge — Phase 36A Dev-Mode Clarity
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Shows a "🔧 DEV" badge in development environments to prevent confusion.
 * Only renders on localhost or 127.0.0.1.
 */

import React from 'react';

export function DevBadge() {
    const [show, setShow] = React.useState(false);

    React.useEffect(() => {
        const h = window.location.hostname;
        const isDev = h === 'localhost' || h === '127.0.0.1';
        console.log('[DevBadge] hostname:', h, 'isDev:', isDev);
        setShow(isDev);
    }, []);

    if (!show) return null;

    return (
        <div
            title="Running in local development mode"
            style={{
                position: 'fixed',
                top: 4,
                left: 50,
                zIndex: 99999,
                padding: '2px 8px',
                fontSize: 10,
                fontWeight: 700,
                fontFamily: '"SF Mono", Monaco, monospace',
                color: '#fbbf24',
                background: 'rgba(251, 191, 36, 0.15)',
                border: '1px solid rgba(251, 191, 36, 0.3)',
                borderRadius: 4,
                letterSpacing: 1,
                pointerEvents: 'none' as const,
                userSelect: 'none' as const,
            }}
        >
            🔧 DEV
        </div>
    );
}
