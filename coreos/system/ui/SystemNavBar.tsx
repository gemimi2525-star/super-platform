'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SystemNavBar — Standalone Route Nav (Phase 27A)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * URL-based navigation for /system/* routes.
 * Pattern: OpsNavBar.tsx
 *
 * @module coreos/system/ui/SystemNavBar
 * @version 1.0.0
 */

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
    { href: '/system', label: 'General', icon: '⚙️' },
    { href: '/system/configuration', label: 'Configuration', icon: '🔧' },
    { href: '/system/security', label: 'Security', icon: '🔐' },
    { href: '/system/users', label: 'Users', icon: '👥' },
    { href: '/system/organization', label: 'Organization', icon: '🏢' },
    { href: '/system/apps', label: 'Apps', icon: '🛍️' },
];

export function SystemNavBar() {
    const pathname = usePathname();

    return (
        <nav style={s.nav}>
            <div style={s.brand}>
                <span style={{ fontSize: 18 }}>🖥️</span>
                <span style={s.brandText}>System Hub</span>
                <a href="/os" style={s.backLink}>← OS Shell</a>
            </div>
            <div style={s.links}>
                {NAV_ITEMS.map(item => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            style={{
                                ...s.link,
                                ...(isActive ? s.linkActive : {}),
                            }}
                        >
                            <span>{item.icon}</span>
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}

const s: Record<string, React.CSSProperties> = {
    nav: {
        display: 'flex',
        alignItems: 'center',
        gap: 24,
        padding: '12px 24px',
        background: 'rgba(15, 23, 42, 0.95)',
        borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
        backdropFilter: 'blur(10px)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    brand: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexShrink: 0,
    },
    brandText: {
        fontSize: 16,
        fontWeight: 700,
        color: '#e2e8f0',
    },
    backLink: {
        fontSize: 11,
        color: '#64748b',
        textDecoration: 'none',
        marginLeft: 12,
        padding: '2px 8px',
        borderRadius: 4,
        border: '1px solid rgba(148, 163, 184, 0.15)',
    },
    links: {
        display: 'flex',
        gap: 4,
        overflowX: 'auto',
    },
    link: {
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '6px 12px',
        borderRadius: 6,
        fontSize: 12,
        fontWeight: 500,
        color: '#94a3b8',
        textDecoration: 'none',
        transition: 'all 0.15s',
        whiteSpace: 'nowrap' as const,
    },
    linkActive: {
        background: 'rgba(96, 165, 250, 0.12)',
        color: '#60a5fa',
    },
};

export default SystemNavBar;
