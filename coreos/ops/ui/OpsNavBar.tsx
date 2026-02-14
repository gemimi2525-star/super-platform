'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * OpsNavBar — Shared Navigation (Phase 26A)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Navigation bar shared across all /ops/* route pages.
 * Highlights the active route and provides links to all 5 sections.
 *
 * @module coreos/ops/ui/OpsNavBar
 * @version 1.0.0
 */

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';

// ═══════════════════════════════════════════════════════════════════════════
// NAV ITEMS
// ═══════════════════════════════════════════════════════════════════════════

const NAV_ITEMS = [
    { path: '/ops', label: 'System Status', icon: '🟢' },
    { path: '/ops/runtime-metrics', label: 'Runtime Metrics', icon: '📊' },
    { path: '/ops/brain', label: 'Brain', icon: '🧠' },
    { path: '/ops/workers', label: 'Workers', icon: '⚙️' },
    { path: '/ops/audit', label: 'Audit', icon: '📋' },
];

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function OpsNavBar() {
    const router = useRouter();
    const pathname = usePathname();

    return (
        <nav style={s.tabBar}>
            {NAV_ITEMS.map(item => {
                const isActive = pathname === item.path;
                return (
                    <button
                        key={item.path}
                        onClick={() => router.push(item.path)}
                        style={{
                            ...s.tabBtn,
                            ...(isActive ? s.tabActive : {}),
                        }}
                    >
                        <span>{item.icon}</span> {item.label}
                    </button>
                );
            })}
        </nav>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════

const s: Record<string, React.CSSProperties> = {
    tabBar: {
        display: 'flex', gap: 4, marginBottom: 24,
        borderBottom: '1px solid rgba(148, 163, 184, 0.12)', paddingBottom: 0,
        flexWrap: 'wrap',
    },
    tabBtn: {
        background: 'transparent', border: 'none', color: '#94a3b8',
        padding: '10px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 500,
        borderBottom: '2px solid transparent', display: 'flex', alignItems: 'center', gap: 6,
        transition: 'all 0.2s ease', whiteSpace: 'nowrap' as const,
    },
    tabActive: {
        color: '#60a5fa', borderBottomColor: '#60a5fa', fontWeight: 600,
    },
};
