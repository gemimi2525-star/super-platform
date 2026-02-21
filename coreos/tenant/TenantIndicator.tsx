/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Tenant Indicator — Subtle UI Badge (Phase 29.1)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Shows current tenant name + role in the OS shell (dev-only initially).
 * Calm-first: minimal, non-intrusive badge.
 */

'use client';

import React from 'react';
import { useTenantStore } from './store';

export function TenantIndicator() {
    const session = useTenantStore(s => s.session);
    const multiTenantEnabled = useTenantStore(s => s.multiTenantEnabled);

    if (!session) return null;

    return (
        <div
            style={{
                position: 'fixed',
                bottom: 58,
                right: 12,
                padding: '3px 10px',
                background: multiTenantEnabled
                    ? 'rgba(99,102,241,0.15)'
                    : 'rgba(100,116,139,0.1)',
                border: `1px solid ${multiTenantEnabled ? 'rgba(99,102,241,0.25)' : 'rgba(100,116,139,0.15)'}`,
                borderRadius: 6,
                fontSize: 10,
                fontFamily: '-apple-system, sans-serif',
                color: multiTenantEnabled ? '#818cf8' : '#64748b',
                zIndex: 50,
                pointerEvents: 'none',
                userSelect: 'none',
            }}
        >
            🏢 {session.tenantId === 'default' ? 'Default' : session.tenantId}
            <span style={{ marginLeft: 6, opacity: 0.7 }}>• {session.role}</span>
            {multiTenantEnabled && (
                <span style={{ marginLeft: 6, color: '#10b981', fontSize: 9 }}>MT</span>
            )}
        </div>
    );
}
