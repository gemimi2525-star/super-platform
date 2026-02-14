'use client';

/**
 * WorkersView — Placeholder (Phase 26A)
 *
 * Shared placeholder for the Workers tab.
 * Used by /ops/workers page and OS Shell Monitor Hub.
 */

import React from 'react';

export function WorkersView() {
    return (
        <div style={s.root}>
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>⚙️</div>
            <h3 style={s.title}>Workers — Coming Soon</h3>
            <p style={s.text}>This section will be available in a future phase.</p>
        </div>
    );
}

const s: Record<string, React.CSSProperties> = {
    root: {
        background: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(148, 163, 184, 0.1)',
        borderRadius: 12, padding: '60px 24px', textAlign: 'center',
    },
    title: {
        fontSize: 16, fontWeight: 600, color: '#64748b', margin: '0 0 8px',
        display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8,
    },
    text: { color: '#64748b', fontSize: 13, fontStyle: 'italic' as const },
};
