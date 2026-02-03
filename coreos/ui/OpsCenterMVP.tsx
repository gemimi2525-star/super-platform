/**
 * ═══════════════════════════════════════════════════════════════════════════
 * OPS CENTER MVP — Phase 5 Operational Visibility
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Admin observability dashboard with 4 tabs:
 * 1. System Health — Current system status
 * 2. Audit Trail — Browse audit logs
 * 3. Incidents — Highlighted security/access events
 * 4. API Monitor — Endpoint status
 * 
 * @module coreos/ui/OpsCenterMVP
 */

'use client';

import React, { useState, useEffect } from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface HealthData {
    status: string;
    timestamp: string;
    build: {
        commit: string;
        environment: string;
    };
    project: {
        kind: string;
        domain: string;
    };
    uptime: number;
}

interface MeData {
    uid: string;
    email: string;
    role: string;
    isPlatformUser: boolean;
    permissions: string[];
}

interface AuditLogEntry {
    id: string;
    timestamp: string;
    action: string;
    actor?: { uid: string; email?: string };
    target?: { type: string; id: string };
    success: boolean;
    decision?: string;
    capability?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// TOKENS
// ═══════════════════════════════════════════════════════════════════════════

const tokens = {
    bgPrimary: '#ffffff',
    bgSecondary: '#f5f5f7',
    bgAccent: '#e8f4fd',
    textPrimary: '#1d1d1f',
    textSecondary: '#6e6e73',
    border: '#d2d2d7',
    accent: '#0066cc',
    success: '#30d158',
    warning: '#ff9f0a',
    error: '#ff453a',
    radius: 8,
};

// ═══════════════════════════════════════════════════════════════════════════
// TAB NAVIGATION
// ═══════════════════════════════════════════════════════════════════════════

type TabId = 'health' | 'audit' | 'incidents' | 'api';

const tabs: { id: TabId; label: string; icon: string }[] = [
    { id: 'health', label: 'System Health', icon: '💚' },
    { id: 'audit', label: 'Audit Trail', icon: '📋' },
    { id: 'incidents', label: 'Incidents', icon: '⚠️' },
    { id: 'api', label: 'API Monitor', icon: '📡' },
];

// ═══════════════════════════════════════════════════════════════════════════
// HOOKS
// ═══════════════════════════════════════════════════════════════════════════

function useHealthData() {
    const [data, setData] = useState<HealthData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/platform/health')
            .then(res => res.json())
            .then(json => {
                if (json.success) setData(json.data);
                else setError(json.error?.message || 'Failed to fetch health');
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    return { data, loading, error };
}

function useMeData() {
    const [data, setData] = useState<MeData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/platform/me')
            .then(res => res.json())
            .then(json => {
                if (json.success) setData(json.data);
                else setError(json.error?.message || 'Unauthorized');
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    return { data, loading, error };
}

function useAuditLogs(limit = 25) {
    const [data, setData] = useState<AuditLogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch(`/api/platform/audit-logs?limit=${limit}`)
            .then(res => res.json())
            .then(json => {
                if (json.success) setData(json.data?.items || []);
                else setError(json.error?.message || 'Failed to fetch logs');
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, [limit]);

    return { data, loading, error };
}

// ═══════════════════════════════════════════════════════════════════════════
// INCIDENT DETECTION
// ═══════════════════════════════════════════════════════════════════════════

interface Incident {
    id: string;
    type: 'critical' | 'warning' | 'info';
    message: string;
    timestamp: string;
    source: AuditLogEntry;
}

function detectIncidents(logs: AuditLogEntry[]): Incident[] {
    const incidents: Incident[] = [];

    for (const log of logs) {
        // Skip stepup.cancel — this is NORMAL user behavior
        if (log.action === 'stepup.cancel' || log.capability === 'stepup.cancel') {
            continue;
        }

        // 5xx errors or critical failures
        if (log.action?.includes('error') || log.action?.includes('500')) {
            incidents.push({
                id: log.id,
                type: 'critical',
                message: `Server error: ${log.action}`,
                timestamp: log.timestamp,
                source: log,
            });
            continue;
        }

        // Security denials (DENY decisions)
        if (log.decision === 'DENY' && log.success === false) {
            const isSensitive = [
                'org.manage',
                'platform:users:write',
                'platform:users:delete',
                'system.configure',
            ].some(cap => log.capability?.includes(cap) || log.action?.includes(cap));

            if (isSensitive) {
                incidents.push({
                    id: log.id,
                    type: 'warning',
                    message: `Access denied: ${log.capability || log.action}`,
                    timestamp: log.timestamp,
                    source: log,
                });
            }
        }

        // 401/403 access issues
        if (log.action?.includes('401') || log.action?.includes('403')) {
            incidents.push({
                id: log.id,
                type: 'warning',
                message: `Auth failure: ${log.action}`,
                timestamp: log.timestamp,
                source: log,
            });
        }
    }

    return incidents;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function LoadingState({ message = 'Loading...' }: { message?: string }) {
    return (
        <div style={{
            padding: 40,
            textAlign: 'center',
            color: tokens.textSecondary
        }}>
            ⏳ {message}
        </div>
    );
}

function ErrorState({ message }: { message: string }) {
    return (
        <div style={{
            padding: 20,
            background: '#fff0f0',
            borderRadius: tokens.radius,
            color: tokens.error,
            border: `1px solid ${tokens.error}`,
        }}>
            ❌ {message}
        </div>
    );
}

function Card({ title, children, accent }: { title: string; children: React.ReactNode; accent?: string }) {
    return (
        <div style={{
            background: tokens.bgPrimary,
            borderRadius: tokens.radius,
            border: `1px solid ${tokens.border}`,
            overflow: 'hidden',
        }}>
            <div style={{
                padding: '12px 16px',
                borderBottom: `1px solid ${tokens.border}`,
                background: accent || tokens.bgSecondary,
                fontWeight: 600,
                fontSize: 13,
            }}>
                {title}
            </div>
            <div style={{ padding: 16 }}>
                {children}
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: 'healthy' | 'degraded' | 'down' | string }) {
    const colors = {
        healthy: { bg: '#e8f8e8', text: tokens.success },
        degraded: { bg: '#fff8e0', text: tokens.warning },
        down: { bg: '#ffe8e8', text: tokens.error },
    };
    const c = colors[status as keyof typeof colors] || colors.degraded;

    return (
        <span style={{
            display: 'inline-block',
            padding: '4px 12px',
            borderRadius: 20,
            background: c.bg,
            color: c.text,
            fontSize: 12,
            fontWeight: 600,
            textTransform: 'uppercase',
        }}>
            {status}
        </span>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB: SYSTEM HEALTH
// ═══════════════════════════════════════════════════════════════════════════

function HealthTab() {
    const health = useHealthData();
    const me = useMeData();

    if (health.loading || me.loading) return <LoadingState />;
    if (health.error) return <ErrorState message={health.error} />;
    if (!health.data) return <ErrorState message="No health data" />;

    const h = health.data;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Status Overview */}
            <Card title="System Status" accent={tokens.bgAccent}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <StatusBadge status={h.status} />
                    <span style={{ color: tokens.textSecondary, fontSize: 13 }}>
                        Last checked: {new Date(h.timestamp).toLocaleTimeString()}
                    </span>
                </div>
            </Card>

            {/* Build Info */}
            <Card title="Build Information">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
                    <div>
                        <div style={{ color: tokens.textSecondary, marginBottom: 4 }}>Commit</div>
                        <code style={{ background: tokens.bgSecondary, padding: '2px 6px', borderRadius: 4 }}>
                            {h.build.commit}
                        </code>
                    </div>
                    <div>
                        <div style={{ color: tokens.textSecondary, marginBottom: 4 }}>Environment</div>
                        <span>{h.build.environment}</span>
                    </div>
                    <div>
                        <div style={{ color: tokens.textSecondary, marginBottom: 4 }}>Domain</div>
                        <span>{h.project.domain}</span>
                    </div>
                    <div>
                        <div style={{ color: tokens.textSecondary, marginBottom: 4 }}>Uptime</div>
                        <span>{Math.floor(h.uptime / 60)}m</span>
                    </div>
                </div>
            </Card>

            {/* Current User */}
            {me.data && (
                <Card title="Current User">
                    <div style={{ fontSize: 13 }}>
                        <div style={{ marginBottom: 8 }}>
                            <strong>{me.data.email}</strong>
                            <span style={{
                                marginLeft: 8,
                                padding: '2px 8px',
                                background: tokens.bgAccent,
                                borderRadius: 4,
                                fontSize: 11,
                            }}>
                                {me.data.role}
                            </span>
                        </div>
                        <div style={{ color: tokens.textSecondary }}>
                            Permissions: {me.data.permissions?.slice(0, 3).join(', ')}
                            {me.data.permissions?.length > 3 && ` +${me.data.permissions.length - 3} more`}
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB: AUDIT TRAIL
// ═══════════════════════════════════════════════════════════════════════════

function AuditTab() {
    const { data: logs, loading, error } = useAuditLogs(50);
    const [filter, setFilter] = useState('');

    if (loading) return <LoadingState message="Loading audit logs..." />;
    if (error) return <ErrorState message={error} />;

    const filtered = filter
        ? logs.filter(l =>
            l.action?.toLowerCase().includes(filter.toLowerCase()) ||
            l.capability?.toLowerCase().includes(filter.toLowerCase()) ||
            l.actor?.email?.toLowerCase().includes(filter.toLowerCase())
        )
        : logs;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Search */}
            <input
                type="text"
                placeholder="Filter by action, capability, or email..."
                value={filter}
                onChange={e => setFilter(e.target.value)}
                style={{
                    padding: '10px 14px',
                    borderRadius: tokens.radius,
                    border: `1px solid ${tokens.border}`,
                    fontSize: 13,
                    outline: 'none',
                }}
            />

            {/* Logs Table */}
            <div style={{
                background: tokens.bgPrimary,
                borderRadius: tokens.radius,
                border: `1px solid ${tokens.border}`,
                overflow: 'hidden',
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                        <tr style={{ background: tokens.bgSecondary }}>
                            <th style={{ padding: 10, textAlign: 'left' }}>Time</th>
                            <th style={{ padding: 10, textAlign: 'left' }}>Action</th>
                            <th style={{ padding: 10, textAlign: 'left' }}>Actor</th>
                            <th style={{ padding: 10, textAlign: 'center' }}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={4} style={{ padding: 20, textAlign: 'center', color: tokens.textSecondary }}>
                                    No logs found
                                </td>
                            </tr>
                        ) : (
                            filtered.slice(0, 20).map(log => (
                                <tr key={log.id} style={{ borderTop: `1px solid ${tokens.border}` }}>
                                    <td style={{ padding: 10, color: tokens.textSecondary }}>
                                        {new Date(log.timestamp).toLocaleTimeString()}
                                    </td>
                                    <td style={{ padding: 10 }}>
                                        {log.action || log.capability || '-'}
                                    </td>
                                    <td style={{ padding: 10 }}>
                                        {log.actor?.email?.split('@')[0] || log.actor?.uid?.slice(0, 8) || '-'}
                                    </td>
                                    <td style={{ padding: 10, textAlign: 'center' }}>
                                        {log.success ? '✅' : '❌'}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div style={{ fontSize: 11, color: tokens.textSecondary, textAlign: 'center' }}>
                Showing {Math.min(filtered.length, 20)} of {filtered.length} entries
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB: INCIDENTS
// ═══════════════════════════════════════════════════════════════════════════

function IncidentsTab() {
    const { data: logs, loading, error } = useAuditLogs(100);

    if (loading) return <LoadingState message="Analyzing logs for incidents..." />;
    if (error) return <ErrorState message={error} />;

    const incidents = detectIncidents(logs);
    const criticalCount = incidents.filter(i => i.type === 'critical').length;
    const warningCount = incidents.filter(i => i.type === 'warning').length;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Summary */}
            <div style={{ display: 'flex', gap: 16 }}>
                <Card title="Critical">
                    <div style={{ fontSize: 32, fontWeight: 700, color: criticalCount > 0 ? tokens.error : tokens.success }}>
                        {criticalCount}
                    </div>
                </Card>
                <Card title="Warnings">
                    <div style={{ fontSize: 32, fontWeight: 700, color: warningCount > 0 ? tokens.warning : tokens.success }}>
                        {warningCount}
                    </div>
                </Card>
            </div>

            {/* Info Banner */}
            <div style={{
                padding: 12,
                background: tokens.bgAccent,
                borderRadius: tokens.radius,
                fontSize: 12,
                color: tokens.textSecondary,
            }}>
                ℹ️ <strong>Note:</strong> <code>stepup.cancel</code> events are normal user cancellations and not shown as incidents.
            </div>

            {/* Incident List */}
            {incidents.length === 0 ? (
                <Card title="All Clear">
                    <div style={{ textAlign: 'center', padding: 20, color: tokens.success }}>
                        ✅ No incidents detected
                    </div>
                </Card>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {incidents.slice(0, 10).map(incident => (
                        <div
                            key={incident.id}
                            style={{
                                padding: 12,
                                borderRadius: tokens.radius,
                                border: `1px solid ${incident.type === 'critical' ? tokens.error : tokens.warning}`,
                                background: incident.type === 'critical' ? '#fff8f8' : '#fffbf0',
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <strong style={{ fontSize: 13 }}>
                                    {incident.type === 'critical' ? '🔴' : '🟠'} {incident.message}
                                </strong>
                                <span style={{ fontSize: 11, color: tokens.textSecondary }}>
                                    {new Date(incident.timestamp).toLocaleTimeString()}
                                </span>
                            </div>
                            <div style={{ fontSize: 11, color: tokens.textSecondary }}>
                                Actor: {incident.source.actor?.email || incident.source.actor?.uid || 'system'}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB: API MONITOR
// ═══════════════════════════════════════════════════════════════════════════

const MONITORED_ENDPOINTS = [
    { name: 'Health', path: '/api/platform/health', auth: false },
    { name: 'Me', path: '/api/platform/me', auth: true },
    { name: 'Audit Logs', path: '/api/platform/audit-logs', auth: true },
    { name: 'Organizations', path: '/api/platform/orgs', auth: true },
    { name: 'Users', path: '/api/platform/users', auth: true },
];

function ApiMonitorTab() {
    const [results, setResults] = useState<Record<string, { status: number; latency: number; error?: string }>>({});
    const [checking, setChecking] = useState(false);

    const checkEndpoints = async () => {
        setChecking(true);
        const newResults: typeof results = {};

        for (const endpoint of MONITORED_ENDPOINTS) {
            const start = Date.now();
            try {
                const res = await fetch(endpoint.path);
                newResults[endpoint.path] = {
                    status: res.status,
                    latency: Date.now() - start,
                };
            } catch (err: any) {
                newResults[endpoint.path] = {
                    status: 0,
                    latency: Date.now() - start,
                    error: err.message,
                };
            }
        }

        setResults(newResults);
        setChecking(false);
    };

    useEffect(() => {
        checkEndpoints();
    }, []);

    const getStatusColor = (status: number) => {
        if (status >= 200 && status < 300) return tokens.success;
        if (status >= 400 && status < 500) return tokens.warning;
        if (status >= 500 || status === 0) return tokens.error;
        return tokens.textSecondary;
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Refresh Button */}
            <button
                onClick={checkEndpoints}
                disabled={checking}
                style={{
                    padding: '10px 20px',
                    background: tokens.accent,
                    color: '#fff',
                    border: 'none',
                    borderRadius: tokens.radius,
                    cursor: checking ? 'wait' : 'pointer',
                    fontSize: 13,
                    fontWeight: 500,
                    opacity: checking ? 0.7 : 1,
                }}
            >
                {checking ? '⏳ Checking...' : '🔄 Refresh All'}
            </button>

            {/* Endpoints Table */}
            <div style={{
                background: tokens.bgPrimary,
                borderRadius: tokens.radius,
                border: `1px solid ${tokens.border}`,
                overflow: 'hidden',
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                        <tr style={{ background: tokens.bgSecondary }}>
                            <th style={{ padding: 12, textAlign: 'left' }}>Endpoint</th>
                            <th style={{ padding: 12, textAlign: 'center' }}>Status</th>
                            <th style={{ padding: 12, textAlign: 'right' }}>Latency</th>
                        </tr>
                    </thead>
                    <tbody>
                        {MONITORED_ENDPOINTS.map(endpoint => {
                            const result = results[endpoint.path];
                            return (
                                <tr key={endpoint.path} style={{ borderTop: `1px solid ${tokens.border}` }}>
                                    <td style={{ padding: 12 }}>
                                        <div>{endpoint.name}</div>
                                        <div style={{ fontSize: 11, color: tokens.textSecondary }}>
                                            {endpoint.path}
                                        </div>
                                    </td>
                                    <td style={{ padding: 12, textAlign: 'center' }}>
                                        {result ? (
                                            <span style={{
                                                color: getStatusColor(result.status),
                                                fontWeight: 600,
                                            }}>
                                                {result.status || 'ERR'}
                                            </span>
                                        ) : (
                                            <span style={{ color: tokens.textSecondary }}>—</span>
                                        )}
                                    </td>
                                    <td style={{ padding: 12, textAlign: 'right', color: tokens.textSecondary }}>
                                        {result?.latency ? `${result.latency}ms` : '—'}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Legend */}
            <div style={{ fontSize: 11, color: tokens.textSecondary }}>
                <span style={{ color: tokens.success }}>●</span> 2xx OK &nbsp;
                <span style={{ color: tokens.warning }}>●</span> 4xx Auth Required &nbsp;
                <span style={{ color: tokens.error }}>●</span> 5xx Error
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function OpsCenterMVP() {
    const [activeTab, setActiveTab] = useState<TabId>('health');

    return (
        <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: tokens.bgSecondary,
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
        }}>
            {/* Tab Bar */}
            <div style={{
                display: 'flex',
                borderBottom: `1px solid ${tokens.border}`,
                background: tokens.bgPrimary,
            }}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            flex: 1,
                            padding: '12px 16px',
                            background: activeTab === tab.id ? tokens.bgAccent : 'transparent',
                            border: 'none',
                            borderBottom: activeTab === tab.id ? `2px solid ${tokens.accent}` : '2px solid transparent',
                            cursor: 'pointer',
                            fontSize: 13,
                            fontWeight: activeTab === tab.id ? 600 : 400,
                            color: activeTab === tab.id ? tokens.accent : tokens.textSecondary,
                            transition: 'all 0.15s ease',
                        }}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
                {activeTab === 'health' && <HealthTab />}
                {activeTab === 'audit' && <AuditTab />}
                {activeTab === 'incidents' && <IncidentsTab />}
                {activeTab === 'api' && <ApiMonitorTab />}
            </div>

            {/* Footer */}
            <div style={{
                padding: '8px 16px',
                borderTop: `1px solid ${tokens.border}`,
                fontSize: 11,
                color: tokens.textSecondary,
                textAlign: 'center',
                background: tokens.bgPrimary,
            }}>
                Ops Center • Phase 5 Operational Visibility
            </div>
        </div>
    );
}

export default OpsCenterMVP;
