'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * DevConsoleView — Developer Console UI (Phase 24)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 3-tab layout:
 * - Capabilities: list all manifests with metadata
 * - Validator: run deep validation on all manifests
 * - Permissions: audit event coverage overview
 */

import React, { useState, useEffect, useCallback } from 'react';
import { APP_MANIFESTS } from '@/components/os-shell/apps/manifest';
import type { ShellAppManifest } from '@/components/os-shell/apps/manifest';
import { appRegistry } from '@/components/os-shell/apps/registry';

type Tab = 'capabilities' | 'validator' | 'permissions';

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
    return (
        <button
            role="tab"
            aria-selected={active}
            onClick={onClick}
            style={{
                padding: '8px 16px',
                background: active ? 'rgba(16,185,129,0.15)' : 'transparent',
                border: active ? '1px solid rgba(16,185,129,0.4)' : '1px solid transparent',
                borderRadius: 6,
                color: active ? '#10b981' : '#94a3b8',
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
            }}
        >
            {label}
        </button>
    );
}

// ─── Capabilities Tab ──────────────────────────────────────────────────

function CapabilitiesTab() {
    const manifests = Object.values(APP_MANIFESTS);

    return (
        <div>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 12 }}>
                {manifests.length} registered capabilities
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {manifests.map(m => (
                    <CapabilityRow key={m.appId} manifest={m} hasComponent={!!appRegistry[m.appId]} />
                ))}
            </div>
        </div>
    );
}

function CapabilityRow({ manifest: m, hasComponent }: { manifest: ShellAppManifest; hasComponent: boolean }) {
    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: '32px 1fr 80px 80px 60px',
            alignItems: 'center',
            padding: '8px 12px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 8,
            fontSize: 12,
            gap: 8,
        }}>
            <span style={{ fontSize: 18 }}>{m.icon}</span>
            <div>
                <div style={{ fontWeight: 500, color: '#e2e8f0' }}>{m.name}</div>
                <div style={{ fontSize: 10, color: '#64748b', fontFamily: 'monospace' }}>{m.appId}</div>
            </div>
            <span style={{
                padding: '2px 8px',
                borderRadius: 4,
                fontSize: 10,
                fontWeight: 600,
                background: m.category === 'core' ? 'rgba(96,165,250,0.15)' :
                    m.category === 'admin' ? 'rgba(251,146,60,0.15)' :
                        m.category === 'experimental' ? 'rgba(168,85,247,0.15)' : 'rgba(255,255,255,0.08)',
                color: m.category === 'core' ? '#60a5fa' :
                    m.category === 'admin' ? '#fb923c' :
                        m.category === 'experimental' ? '#a855f7' : '#94a3b8',
            }}>
                {m.category}
            </span>
            <span style={{ fontSize: 10, color: '#94a3b8' }}>
                {m.requiredRole} {m.singleInstance ? '🔒' : ''}
            </span>
            <span style={{
                fontSize: 10,
                color: hasComponent ? '#10b981' : '#f59e0b',
                fontWeight: 600,
            }}>
                {hasComponent ? '✓ Ready' : '⚠ No Comp'}
            </span>
        </div>
    );
}

// ─── Validator Tab ─────────────────────────────────────────────────────

interface ValidationResult {
    appId: string;
    name: string;
    status: 'OK' | 'WARN' | 'ERROR';
    warnings: string[];
    errors: string[];
}

function ValidatorTab() {
    const [results, setResults] = useState<ValidationResult[] | null>(null);
    const [loading, setLoading] = useState(false);

    const runValidation = useCallback(async () => {
        setLoading(true);
        try {
            // Dynamic import to avoid bundling validator in prod
            const { validateAllDeep } = await import('@/coreos/dev/validator/manifestValidator');
            const report = validateAllDeep();
            setResults(report.results);
        } catch (e) {
            console.error('[DevConsole] Validator error:', e);
        }
        setLoading(false);
    }, []);

    return (
        <div>
            <button
                onClick={runValidation}
                disabled={loading}
                style={{
                    padding: '8px 20px',
                    background: 'rgba(16,185,129,0.15)',
                    border: '1px solid rgba(16,185,129,0.3)',
                    borderRadius: 6,
                    color: '#10b981',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: loading ? 'wait' : 'pointer',
                    marginBottom: 16,
                }}
            >
                {loading ? 'Validating…' : '▶ Run Validation'}
            </button>

            {results && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {results.map(r => (
                        <div key={r.appId} style={{
                            padding: '8px 12px',
                            background: 'rgba(255,255,255,0.03)',
                            border: `1px solid ${r.status === 'ERROR' ? 'rgba(239,68,68,0.3)' : r.status === 'WARN' ? 'rgba(245,158,11,0.3)' : 'rgba(16,185,129,0.2)'}`,
                            borderRadius: 8,
                            fontSize: 12,
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 500, color: '#e2e8f0' }}>
                                    {r.name} <span style={{ color: '#64748b', fontFamily: 'monospace', fontSize: 10 }}>({r.appId})</span>
                                </span>
                                <span style={{
                                    padding: '2px 8px',
                                    borderRadius: 4,
                                    fontSize: 10,
                                    fontWeight: 700,
                                    color: r.status === 'OK' ? '#10b981' : r.status === 'WARN' ? '#f59e0b' : '#ef4444',
                                    background: r.status === 'OK' ? 'rgba(16,185,129,0.15)' : r.status === 'WARN' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                                }}>
                                    {r.status}
                                </span>
                            </div>
                            {r.errors.length > 0 && (
                                <ul style={{ margin: '4px 0 0', paddingLeft: 16, color: '#ef4444', fontSize: 11 }}>
                                    {r.errors.map((e, i) => <li key={i}>{e}</li>)}
                                </ul>
                            )}
                            {r.warnings.length > 0 && (
                                <ul style={{ margin: '4px 0 0', paddingLeft: 16, color: '#f59e0b', fontSize: 11 }}>
                                    {r.warnings.map((w, i) => <li key={i}>{w}</li>)}
                                </ul>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Permissions Tab ───────────────────────────────────────────────────

function PermissionsTab() {
    const manifests = Object.values(APP_MANIFESTS);
    const domains = new Map<string, { apps: string[]; capabilities: string[] }>();

    for (const m of manifests) {
        const domain = m.appId.split('.')[0];
        if (!domains.has(domain)) {
            domains.set(domain, { apps: [], capabilities: [] });
        }
        const d = domains.get(domain)!;
        d.apps.push(m.appId);
        d.capabilities.push(...m.capabilities);
    }

    return (
        <div>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 12 }}>
                Permission domains: {domains.size}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Array.from(domains.entries()).map(([domain, data]) => (
                    <div key={domain} style={{
                        padding: '10px 12px',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: 8,
                    }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#e2e8f0', marginBottom: 6 }}>
                            {domain}
                        </div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>
                            Apps: {data.apps.join(', ')}
                        </div>
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                            Capabilities: {data.capabilities.length > 0 ? data.capabilities.join(', ') : '(none declared)'}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Main Component ────────────────────────────────────────────────────

export function DevConsoleView() {
    const [activeTab, setActiveTab] = useState<Tab>('capabilities');
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    if (!mounted) return null;

    return (
        <div style={{ padding: 20, height: '100%', overflow: 'auto', color: '#e2e8f0', fontFamily: '-apple-system, sans-serif' }}>
            <div style={{ marginBottom: 16 }}>
                <h2 style={{
                    margin: 0, fontSize: 16, fontWeight: 700,
                    background: 'linear-gradient(135deg, #10b981, #34d399)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>
                    🛠️ Developer Console
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: 11, color: '#64748b' }}>
                    SDK Skeleton • Phase 24 • Dev-only
                </p>
            </div>

            {/* Tab Bar */}
            <div role="tablist" aria-label="Dev Console tabs" style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
                <TabButton label="Capabilities" active={activeTab === 'capabilities'} onClick={() => setActiveTab('capabilities')} />
                <TabButton label="Validator" active={activeTab === 'validator'} onClick={() => setActiveTab('validator')} />
                <TabButton label="Permissions" active={activeTab === 'permissions'} onClick={() => setActiveTab('permissions')} />
            </div>

            {/* Content */}
            <div role="tabpanel">
                {activeTab === 'capabilities' && <CapabilitiesTab />}
                {activeTab === 'validator' && <ValidatorTab />}
                {activeTab === 'permissions' && <PermissionsTab />}
            </div>
        </div>
    );
}

export default DevConsoleView;
