/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Tenant Switcher — Minimal UI (Phase 29.1, Dev-Only Initially)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Dropdown for switching between tenants.
 * Only shown in development mode initially.
 * Calm-first: minimal, functional, non-intrusive.
 */

'use client';

import React, { useState } from 'react';
import { useTenantStore } from './store';

export function TenantSwitcher() {
    const session = useTenantStore(s => s.session);
    const memberships = useTenantStore(s => s.memberships);
    const switchTenant = useTenantStore(s => s.switchTenant);
    const loading = useTenantStore(s => s.loading);
    const multiTenantEnabled = useTenantStore(s => s.multiTenantEnabled);
    const [open, setOpen] = useState(false);

    // Only show in dev mode
    if (process.env.NODE_ENV === 'production') return null;
    if (!multiTenantEnabled) return null;
    if (memberships.length <= 1) return null;

    return (
        <div style={{ position: 'relative', display: 'inline-block' }}>
            <button
                onClick={() => setOpen(!open)}
                disabled={loading}
                style={{
                    padding: '4px 10px',
                    background: 'rgba(99,102,241,0.1)',
                    border: '1px solid rgba(99,102,241,0.2)',
                    borderRadius: 6,
                    color: '#818cf8',
                    fontSize: 11,
                    cursor: loading ? 'wait' : 'pointer',
                    fontFamily: '-apple-system, sans-serif',
                }}
            >
                🏢 {session?.tenantId || 'No tenant'}
                <span style={{ marginLeft: 4, fontSize: 9 }}>▼</span>
            </button>

            {open && (
                <div style={{
                    position: 'absolute',
                    top: '110%',
                    left: 0,
                    background: 'rgba(30,41,59,0.98)',
                    border: '1px solid rgba(99,102,241,0.2)',
                    borderRadius: 8,
                    padding: 4,
                    minWidth: 180,
                    zIndex: 1000,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                }}>
                    {memberships.map(m => (
                        <button
                            key={m.tenantId}
                            onClick={async () => {
                                await switchTenant(m.tenantId);
                                setOpen(false);
                            }}
                            disabled={m.tenantId === session?.tenantId}
                            style={{
                                display: 'block',
                                width: '100%',
                                padding: '6px 10px',
                                background: m.tenantId === session?.tenantId
                                    ? 'rgba(99,102,241,0.15)'
                                    : 'transparent',
                                border: 'none',
                                borderRadius: 4,
                                color: m.tenantId === session?.tenantId ? '#818cf8' : '#cbd5e1',
                                fontSize: 11,
                                textAlign: 'left',
                                cursor: m.tenantId === session?.tenantId ? 'default' : 'pointer',
                                fontFamily: '-apple-system, sans-serif',
                            }}
                        >
                            {m.tenantName}
                            <span style={{
                                float: 'right',
                                fontSize: 9,
                                color: '#64748b',
                            }}>{m.role}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
