/**
 * ═══════════════════════════════════════════════════════════════════════════
 * OPS CENTER MVP — Phase 5/6.5.2 Operational Intelligence
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Admin observability dashboard with 5 tabs:
 * 1. System Health — Current system status
 * 2. Audit Trail — Browse audit logs
 * 3. Incidents — Highlighted security/access events
 * 4. API Monitor — Endpoint status
 * 5. Alerts & Intelligence — Phase 6.5.2 Self-Aware OS (READ-ONLY)
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

// Phase 13: Governance Legibility - Audit Log Entry
interface AuditLogEntry {
    id: string;
    traceId: string;
    timestamp: string;
    action: string;
    status: 'SUCCESS' | 'DENIED' | 'FAILED' | 'INFO';
    actor: {
        kind: 'user' | 'service' | 'system';
        displayName: string;
        actorId?: string;
    };
    reason?: {
        code: string;
        summary: string;
    };
    decision?: {
        decision: 'ALLOW' | 'DENY' | 'SKIP';
        policyId?: string;
        capability?: string;
        ruleHit?: string; // Phase 14.3
    };
    rawPayload?: Record<string, unknown>;
}

// Phase 5.4: Session Debug
interface SessionDebugData {
    session: {
        isAuth: boolean;
        userId: string;
        email: string | null;
        hasSessionCookie: boolean;
        hasLocaleCookie: boolean;
    };
    environment: {
        nodeEnv: string;
        vercelEnv: string;
        devBypassConfigured: boolean;
        devBypassActive: boolean;
    };
    request: {
        host: string;
    };
    timestamp: string;
}

// Phase 6.5.2: Alerts Data
interface AlertData {
    id: string;
    type: string;  // e.g., 'warning', 'info', 'critical'
    title: string;
    description: string;
    severity: 'high' | 'medium' | 'low';
    timestamp: string;
    correlatedRequestIds: string[];
    acknowledged: boolean;
}

interface AlertsResponse {
    alerts: AlertData[];
    summary: { critical: number; warn?: number; warning?: number; info: number; total: number };
    history: AlertData[];
    timestamp: string;
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

type TabId = 'health' | 'audit' | 'incidents' | 'api' | 'alerts';

const tabs: { id: TabId; label: string; icon: string }[] = [
    { id: 'health', label: 'System Health', icon: '💚' },
    { id: 'audit', label: 'Audit Trail', icon: '📋' },
    { id: 'incidents', label: 'Incidents', icon: '⚠️' },
    { id: 'api', label: 'API Monitor', icon: '📡' },
    { id: 'alerts', label: 'Alerts & Intelligence', icon: '🚨' },
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

// Phase 5.4: Session Debug Hook
function useSessionDebug() {
    const [data, setData] = useState<SessionDebugData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refetch = () => {
        setLoading(true);
        fetch('/api/platform/session-debug')
            .then(res => res.json())
            .then(json => {
                if (json.success) setData(json.data);
                else setError(json.error?.message || 'Not authorized');
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        refetch();
    }, []);

    return { data, loading, error, refetch };
}

// Phase 6.5.2: Alerts Hook
function useAlerts() {
    const [data, setData] = useState<AlertsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [errorId, setErrorId] = useState<string | null>(null);
    const [errorTimestamp, setErrorTimestamp] = useState<string | null>(null);

    const refetch = () => {
        setLoading(true);
        setError(null);
        setErrorId(null);
        setErrorTimestamp(null);

        fetch('/api/platform/alerts')
            .then(res => res.json())
            .then(json => {
                if (json.success) {
                    setData(json.data);
                } else {
                    setError(json.error?.message || 'Failed to fetch alerts');
                    setErrorId(json.error?.errorId || null);
                    setErrorTimestamp(json.error?.timestamp || null);
                }
            })
            .catch(err => {
                setError(err.message || 'Network error occurred');
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        refetch();
        // Auto-refresh every 30 seconds
        const interval = setInterval(refetch, 30000);
        return () => clearInterval(interval);
    }, []);

    return { data, loading, error, errorId, errorTimestamp, refetch };
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
        if (log.action === 'stepup.cancel' || log.decision?.capability === 'stepup.cancel') {
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

        // Security denials (DENY decisions) - Phase 13: use new status
        if (log.status === 'DENIED' || log.decision?.decision === 'DENY') {
            const capability = log.decision?.capability || log.action;
            const isSensitive = [
                'org.manage',
                'platform:users:write',
                'platform:users:delete',
                'system.configure',
            ].some(cap => capability?.includes(cap));

            if (isSensitive) {
                incidents.push({
                    id: log.id,
                    type: 'warning',
                    message: `Access denied: ${capability}`,
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

function ErrorState({ message, errorId, timestamp }: { message: string; errorId?: string; timestamp?: string }) {
    return (
        <div style={{
            padding: 20,
            background: '#fff0f0',
            borderRadius: tokens.radius,
            color: tokens.error,
            border: `1px solid ${tokens.error}`,
        }}>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
                ❌ {message}
            </div>
            {errorId && (
                <div style={{ fontSize: 12, color: tokens.textSecondary, marginTop: 8, fontFamily: 'monospace' }}>
                    Error ID: {errorId}
                </div>
            )}
            {timestamp && (
                <div style={{ fontSize: 11, color: tokens.textSecondary, marginTop: 4 }}>
                    {new Date(timestamp).toLocaleString()}
                </div>
            )}
        </div>
    );
}

function CalmState({ message, subtitle }: { message: string; subtitle?: string }) {
    return (
        <div style={{
            padding: 20,
            textAlign: 'center',
            background: '#f0fdf4',
            borderRadius: tokens.radius,
            border: `1px solid ${tokens.success}`,
        }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: tokens.success, marginBottom: 8 }}>
                ✅ {message}
            </div>
            {subtitle && (
                <div style={{ fontSize: 13, color: tokens.textSecondary }}>
                    {subtitle}
                </div>
            )}
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
    const session = useSessionDebug();

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

            {/* Phase 5.4: Session Status */}
            <Card title="🔐 Session Status">
                {session.loading ? (
                    <span style={{ color: tokens.textSecondary }}>Loading...</span>
                ) : session.error ? (
                    <div style={{ fontSize: 13 }}>
                        <div style={{ color: tokens.warning, marginBottom: 8 }}>
                            ⚠️ Session check failed: {session.error}
                        </div>
                        <a
                            href="/login?callbackUrl=/os"
                            style={{
                                color: tokens.accent,
                                textDecoration: 'none',
                                padding: '8px 16px',
                                background: tokens.bgAccent,
                                borderRadius: 6,
                                display: 'inline-block',
                            }}
                        >
                            🔑 Go to Login
                        </a>
                    </div>
                ) : session.data ? (
                    <div style={{ fontSize: 13 }}>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'auto 1fr',
                            gap: '8px 16px',
                            marginBottom: 12
                        }}>
                            <span style={{ color: tokens.textSecondary }}>Authenticated:</span>
                            <span style={{ color: session.data.session.isAuth ? tokens.success : tokens.error }}>
                                {session.data.session.isAuth ? '✅ Yes' : '❌ No'}
                            </span>

                            <span style={{ color: tokens.textSecondary }}>Session Cookie:</span>
                            <span>{session.data.session.hasSessionCookie ? '✅ Present' : '❌ Missing'}</span>

                            <span style={{ color: tokens.textSecondary }}>Environment:</span>
                            <span>{session.data.environment.vercelEnv}</span>

                            <span style={{ color: tokens.textSecondary }}>Dev Bypass:</span>
                            <span style={{
                                color: session.data.environment.devBypassActive ? tokens.warning : tokens.success
                            }}>
                                {session.data.environment.devBypassActive ? '⚠️ ACTIVE' : '🔒 Locked'}
                            </span>

                            <span style={{ color: tokens.textSecondary }}>Host:</span>
                            <span>{session.data.request.host}</span>
                        </div>
                        <button
                            onClick={session.refetch}
                            style={{
                                padding: '6px 12px',
                                background: tokens.bgSecondary,
                                border: `1px solid ${tokens.border}`,
                                borderRadius: 4,
                                cursor: 'pointer',
                                fontSize: 12,
                            }}
                        >
                            🔄 Refresh
                        </button>
                    </div>
                ) : null}
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

            {/* Phase 14.3: Test Governance DENY */}
            <Card title="🛡️ Governance Testing">
                <TestGovernanceDenyButton />
            </Card>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT: Test Governance DENY Button (Phase 14.3)
// ═══════════════════════════════════════════════════════════════════════════

function TestGovernanceDenyButton() {
    const [testing, setTesting] = useState(false);
    const [result, setResult] = useState<{ success: boolean; status: number; message: string } | null>(null);

    const testDeny = async () => {
        setTesting(true);
        setResult(null);

        try {
            const response = await fetch('/api/platform/audit-intents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'os.governance.bypass',
                    target: 'system.production',
                    meta: { test: true },
                    timestamp: Date.now(),
                }),
            });

            const data = await response.json();

            setResult({
                success: response.status === 403,
                status: response.status,
                message: response.status === 403
                    ? `✅ DENY policy enforced correctly (${data.decision?.reason || 'Production protected action'})`
                    : `❌ Expected 403, got ${response.status}`,
            });
        } catch (error: unknown) {
            setResult({
                success: false,
                status: 0,
                message: error instanceof Error ? error.message : 'Network error',
            });
        } finally {
            setTesting(false);
        }
    };

    return (
        <div style={{ fontSize: 13 }}>
            <div style={{ marginBottom: 12, color: tokens.textSecondary }}>
                Test the governance policy evaluator by attempting a production-protected action.
                This should result in a <strong>403 Forbidden</strong> response with a <strong>DENY</strong> decision.
            </div>

            <button
                onClick={testDeny}
                disabled={testing}
                style={{
                    padding: '10px 16px',
                    background: testing ? tokens.bgSecondary : tokens.warning,
                    color: testing ? tokens.textSecondary : '#fff',
                    border: 'none',
                    borderRadius: tokens.radius,
                    cursor: testing ? 'wait' : 'pointer',
                    fontSize: 13,
                    fontWeight: 600,
                    opacity: testing ? 0.6 : 1,
                }}
            >
                {testing ? '⏳ Testing...' : '⛔ Test Governance DENY'}
            </button>

            {result && (
                <div style={{
                    marginTop: 12,
                    padding: 12,
                    borderRadius: tokens.radius,
                    background: result.success ? '#e8f8e8' : '#fff8f0',
                    border: `1px solid ${result.success ? tokens.success : tokens.warning}`,
                }}>
                    <div style={{
                        fontSize: 12,
                        fontWeight: 600,
                        marginBottom: 4,
                        color: result.success ? tokens.success : tokens.warning,
                    }}>
                        Status: {result.status}
                    </div>
                    <div style={{ fontSize: 12, color: tokens.textPrimary }}>
                        {result.message}
                    </div>
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB: AUDIT TRAIL
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Phase 14.3: Legacy Compatibility Guard
 * 
 * Normalizes decision field from audit logs to handle both:
 * - Old schema: {outcome, policyKey, reason, severity}
 * - New schema: {decision, policyId, ruleHit, capability}
 * 
 * This prevents React crashes when rendering legacy audit logs.
 */
function normalizeDecision(log: AuditLogEntry): {
    decision: 'ALLOW' | 'DENY' | 'SKIP';
    policyId?: string;
    capability?: string;
    ruleHit?: string;
} | null {
    if (!log.decision) return null;

    const raw: any = log.decision;

    // New schema (already normalized)
    if (raw.decision && typeof raw.decision === 'string') {
        return {
            decision: raw.decision as 'ALLOW' | 'DENY' | 'SKIP',
            policyId: raw.policyId || undefined,
            capability: raw.capability || undefined,
            ruleHit: raw.ruleHit || undefined,
        };
    }

    // Old schema (needs normalization)
    if (raw.outcome && typeof raw.outcome === 'string') {
        return {
            decision: raw.outcome as 'ALLOW' | 'DENY' | 'SKIP',
            policyId: raw.policyKey || undefined,
            capability: raw.capability || undefined,
            ruleHit: raw.reason || undefined,
        };
    }

    // Fallback: assume ALLOW if decision exists but is malformed
    return {
        decision: 'ALLOW',
        policyId: undefined,
        capability: undefined,
        ruleHit: undefined,
    };
}

function AuditTab() {
    const { data: logs, loading, error } = useAuditLogs(50);
    const [filter, setFilter] = useState('');
    const [expandedRow, setExpandedRow] = useState<string | null>(null); // Phase 14.3: Row expand

    if (loading) return <LoadingState message="Loading audit logs..." />;
    if (error) return <ErrorState message={error} />;

    // Phase 14.3: Enhanced filter - decision/policyKey/capability
    const filtered = filter
        ? logs.filter(l => {
            const normalized = normalizeDecision(l);
            return (
                l.action?.toLowerCase().includes(filter.toLowerCase()) ||
                normalized?.capability?.toLowerCase().includes(filter.toLowerCase()) ||
                l.actor.displayName.toLowerCase().includes(filter.toLowerCase()) ||
                l.traceId?.toLowerCase().includes(filter.toLowerCase()) ||
                normalized?.decision?.toLowerCase().includes(filter.toLowerCase()) ||
                normalized?.policyId?.toLowerCase().includes(filter.toLowerCase())
            );
        })
        : logs;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Search */}
            <input
                type="text"
                placeholder="Filter by action, decision, policyKey, capability, email, or traceId..."
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
                            <th style={{ padding: 10, textAlign: 'left', width: 30 }}></th>
                            <th style={{ padding: 10, textAlign: 'left' }}>Time</th>
                            <th style={{ padding: 10, textAlign: 'left' }}>Action</th>
                            <th style={{ padding: 10, textAlign: 'left' }}>Actor</th>
                            <th style={{ padding: 10, textAlign: 'left' }}>Trace</th>
                            <th style={{ padding: 10, textAlign: 'center' }}>Decision</th>
                            <th style={{ padding: 10, textAlign: 'center' }}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={7} style={{ padding: 20 }}>
                                    <CalmState
                                        message={filter ? "No Matching Logs" : "No Recent Activity"}
                                        subtitle={filter ? "Try adjusting your filter" : "System logs will appear here as actions occur"}
                                    />
                                </td>
                            </tr>
                        ) : (
                            filtered.slice(0, 20).map(log => {
                                // Phase 13: Status icons
                                const statusIcons = {
                                    SUCCESS: '✅',
                                    DENIED: '⛔',
                                    FAILED: '❌',
                                    INFO: 'ℹ️',
                                };
                                const statusColors = {
                                    SUCCESS: tokens.success,
                                    DENIED: tokens.warning,
                                    FAILED: tokens.error,
                                    INFO: tokens.textSecondary,
                                };

                                // Phase 14.3: Decision chips (with legacy compatibility)
                                const normalized = normalizeDecision(log);
                                const decisionOutcome = normalized?.decision || 'ALLOW';
                                const decisionConfig = {
                                    ALLOW: { icon: '✅', bg: '#e8f8e8', text: tokens.success },
                                    DENY: { icon: '⛔', bg: '#fff8e0', text: tokens.warning },
                                    SKIP: { icon: '⏭', bg: tokens.bgSecondary, text: tokens.textSecondary },
                                };
                                const dc = decisionConfig[decisionOutcome as keyof typeof decisionConfig] || decisionConfig.ALLOW;

                                const isExpanded = expandedRow === log.id;

                                return (
                                    <React.Fragment key={log.id}>
                                        <tr style={{ borderTop: `1px solid ${tokens.border}` }}>
                                            <td style={{ padding: '6px 10px' }}>
                                                <button
                                                    onClick={() => setExpandedRow(isExpanded ? null : log.id)}
                                                    style={{
                                                        background: 'transparent',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        fontSize: 12,
                                                        padding: '2px 4px',
                                                        opacity: 0.6,
                                                    }}
                                                    title="Expand details"
                                                >
                                                    {isExpanded ? '▼' : '▶'}
                                                </button>
                                            </td>
                                            <td style={{ padding: 10, color: tokens.textSecondary }}>
                                                {new Date(log.timestamp).toLocaleTimeString()}
                                            </td>
                                            <td style={{ padding: 10 }}>
                                                {log.action}
                                            </td>
                                            <td style={{ padding: 10 }}>
                                                <span style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: 4,
                                                }}>
                                                    {log.actor.kind === 'user' && '👤'}
                                                    {log.actor.kind === 'service' && '🔧'}
                                                    {log.actor.kind === 'system' && '⚙️'}
                                                    {log.actor.displayName}
                                                </span>
                                            </td>
                                            <td style={{ padding: '6px 10px' }}>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 6,
                                                }}>
                                                    <code style={{
                                                        fontSize: 10,
                                                        fontFamily: 'SF Mono, Menlo, Monaco, monospace',
                                                        color: tokens.textSecondary,
                                                        background: tokens.bgSecondary,
                                                        padding: '2px 6px',
                                                        borderRadius: 4,
                                                    }}>
                                                        {log.traceId?.substring(0, 8) || 'legacy'}
                                                    </code>
                                                    {log.traceId && (
                                                        <button
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(log.traceId!);
                                                            }}
                                                            style={{
                                                                padding: '2px 6px',
                                                                fontSize: 10,
                                                                border: 'none',
                                                                background: 'transparent',
                                                                cursor: 'pointer',
                                                                opacity: 0.6,
                                                            }}
                                                            title="Copy full traceId"
                                                        >
                                                            📋
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                            <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                                                <span style={{
                                                    display: 'inline-block',
                                                    padding: '3px 8px',
                                                    borderRadius: 12,
                                                    background: dc.bg,
                                                    color: dc.text,
                                                    fontSize: 11,
                                                    fontWeight: 600,
                                                }}>
                                                    {dc.icon} {decisionOutcome}
                                                </span>
                                            </td>
                                            <td style={{
                                                padding: 10,
                                                textAlign: 'center',
                                                color: statusColors[log.status],
                                            }}>
                                                {statusIcons[log.status]}
                                            </td>
                                        </tr>
                                        {/* Phase 14.3: Expanded Details Row */}
                                        {isExpanded && (
                                            <tr style={{ borderTop: `1px solid ${tokens.border}`, background: tokens.bgSecondary }}>
                                                <td colSpan={7} style={{ padding: 16 }}>
                                                    <div style={{
                                                        display: 'grid',
                                                        gridTemplateColumns: 'auto 1fr',
                                                        gap: '8px 16px',
                                                        fontSize: 12,
                                                    }}>
                                                        <span style={{ color: tokens.textSecondary, fontWeight: 600 }}>Trace ID:</span>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                            <code style={{
                                                                background: tokens.bgPrimary,
                                                                padding: '4px 8px',
                                                                borderRadius: 4,
                                                                fontFamily: 'monospace',
                                                                fontSize: 11,
                                                            }}>
                                                                {log.traceId || 'N/A'}
                                                            </code>
                                                            {log.traceId && (
                                                                <button
                                                                    onClick={() => navigator.clipboard.writeText(log.traceId!)}
                                                                    style={{
                                                                        padding: '4px 8px',
                                                                        fontSize: 11,
                                                                        background: tokens.bgPrimary,
                                                                        border: `1px solid ${tokens.border}`,
                                                                        borderRadius: 4,
                                                                        cursor: 'pointer',
                                                                    }}
                                                                >
                                                                    📋 Copy
                                                                </button>
                                                            )}
                                                        </div>

                                                        <span style={{ color: tokens.textSecondary, fontWeight: 600 }}>Policy Key:</span>
                                                        <span>{normalized?.policyId || 'N/A'}</span>

                                                        <span style={{ color: tokens.textSecondary, fontWeight: 600 }}>Reason:</span>
                                                        <span>{normalized?.ruleHit || log.reason?.summary || 'N/A'}</span>

                                                        <span style={{ color: tokens.textSecondary, fontWeight: 600 }}>Capability:</span>
                                                        <span>{normalized?.capability || 'N/A'}</span>

                                                        <span style={{ color: tokens.textSecondary, fontWeight: 600 }}>Timestamp:</span>
                                                        <span>{new Date(log.timestamp).toLocaleString()}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })
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
                <CalmState
                    message="System Calm"
                    subtitle="No security incidents or anomalies detected in recent activity"
                />
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
                                Actor: {incident.source.actor.displayName || 'system'}
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
    { name: 'Session Debug', path: '/api/platform/session-debug', auth: true },
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

    // Calculate health summary
    const totalEndpoints = MONITORED_ENDPOINTS.length;
    const checkedCount = Object.keys(results).length;
    const healthyCount = Object.values(results).filter(r => r.status >= 200 && r.status < 300).length;
    const allHealthy = checkedCount > 0 && healthyCount === checkedCount;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Health Summary */}
            {checkedCount > 0 && allHealthy && (
                <CalmState
                    message="All Endpoints Healthy"
                    subtitle={`${healthyCount}/${totalEndpoints} endpoints responding correctly`}
                />
            )}

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

            {/* Status Legend */}
            <div style={{ fontSize: 11, color: tokens.textSecondary, textAlign: 'center' }}>
                <span style={{ color: tokens.success }}>●</span> 2xx OK &nbsp;
                <span style={{ color: tokens.warning }}>●</span> 4xx Auth Required &nbsp;
                <span style={{ color: tokens.error }}>●</span> 5xx Error
                {checkedCount > 0 && (
                    <span style={{ marginLeft: 12 }}>
                        • Last checked: {new Date().toLocaleTimeString()}
                    </span>
                )}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB: ALERTS & INTELLIGENCE (Phase 6.5.2)
// ═══════════════════════════════════════════════════════════════════════════

function AlertsTab() {
    const { data, loading, error, errorId, errorTimestamp, refetch } = useAlerts();

    if (loading) return <LoadingState message="Loading alerts..." />;
    if (error) return <ErrorState message={error} errorId={errorId || undefined} timestamp={errorTimestamp || undefined} />;
    if (!data) return <ErrorState message="No alerts data" />;

    const getSeverityColor = (severity: string) => {
        if (severity === 'critical') return tokens.error;
        if (severity === 'warn') return tokens.warning;
        return tokens.textSecondary;
    };

    const getSeverityBg = (severity: string) => {
        if (severity === 'high' || severity === 'critical') return '#fff0f0';
        if (severity === 'medium' || severity === 'warn' || severity === 'warning') return '#fffbf0';
        return tokens.bgSecondary;
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Header with Refresh */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
                    🚨 Alerts & Intelligence
                </h3>
                <button
                    onClick={refetch}
                    style={{
                        padding: '6px 12px',
                        background: tokens.bgSecondary,
                        border: `1px solid ${tokens.border}`,
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontSize: 12,
                    }}
                >
                    🔄 Refresh
                </button>
            </div>

            {/* Summary Cards */}
            <div style={{ display: 'flex', gap: 16 }}>
                <Card title="Critical">
                    <div style={{ fontSize: 32, fontWeight: 700, color: data.summary.critical > 0 ? tokens.error : tokens.success }}>
                        {data.summary.critical}
                    </div>
                </Card>
                <Card title="Warnings">
                    <div style={{ fontSize: 32, fontWeight: 700, color: (data.summary.warning || data.summary.warn || 0) > 0 ? tokens.warning : tokens.success }}>
                        {data.summary.warning || data.summary.warn || 0}
                    </div>
                </Card>
                <Card title="Total Active">
                    <div style={{ fontSize: 32, fontWeight: 700, color: tokens.textPrimary }}>
                        {data.summary.total}
                    </div>
                </Card>
            </div>

            {/* Governance Guarantee Banner */}
            <div style={{
                padding: 12,
                background: '#e8f4fd',
                borderRadius: tokens.radius,
                fontSize: 12,
                color: tokens.accent,
                border: `1px solid ${tokens.accent}`,
            }}>
                🔒 <strong>READ-ONLY Mode:</strong> This dashboard observes only. No auto-remediation or governance bypass.
            </div>

            {/* Active Alerts */}
            <Card title="Active Alerts" accent={data.alerts.length > 0 ? '#fff0f0' : tokens.bgSecondary}>
                {data.alerts.length === 0 ? (
                    <CalmState
                        message="System Operating Normally"
                        subtitle={`No active alerts detected • Last checked: ${new Date(data.timestamp).toLocaleTimeString()}`}
                    />
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {data.alerts.map(alert => (
                            <div
                                key={alert.id}
                                style={{
                                    padding: 12,
                                    borderRadius: tokens.radius,
                                    background: getSeverityBg(alert.severity),
                                    border: `1px solid ${getSeverityColor(alert.severity)}`,
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <strong style={{ fontSize: 13 }}>
                                        {alert.severity === 'high' ? '🔴' : alert.severity === 'medium' ? '🟠' : 'ℹ️'} {alert.title}
                                    </strong>
                                    <span style={{ fontSize: 11, color: tokens.textSecondary }}>
                                        {new Date(alert.timestamp).toLocaleTimeString()}
                                    </span>
                                </div>
                                <div style={{ fontSize: 11, color: tokens.textSecondary }}>
                                    {alert.description}
                                </div>
                                {alert.correlatedRequestIds.length > 0 && (
                                    <div style={{ fontSize: 10, color: tokens.textSecondary, marginTop: 4 }}>
                                        Request IDs: {alert.correlatedRequestIds.slice(0, 3).join(', ')}
                                        {alert.correlatedRequestIds.length > 3 && ` +${alert.correlatedRequestIds.length - 3} more`}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* Alert History */}
            <Card title="Alert History (Last 50)">
                {data.history.length === 0 ? (
                    <CalmState
                        message="Clean History"
                        subtitle="No alerts have been recorded in the system"
                    />
                ) : (
                    <div style={{ maxHeight: 300, overflow: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                            <thead>
                                <tr style={{ background: tokens.bgSecondary }}>
                                    <th style={{ padding: 8, textAlign: 'left' }}>Time</th>
                                    <th style={{ padding: 8, textAlign: 'left' }}>Rule</th>
                                    <th style={{ padding: 8, textAlign: 'center' }}>Severity</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.history.slice(0, 20).map(alert => (
                                    <tr key={alert.id} style={{ borderTop: `1px solid ${tokens.border}` }}>
                                        <td style={{ padding: 8, color: tokens.textSecondary }}>
                                            {new Date(alert.timestamp).toLocaleString()}
                                        </td>
                                        <td style={{ padding: 8 }}>
                                            {alert.title || alert.type}
                                        </td>
                                        <td style={{ padding: 8, textAlign: 'center' }}>
                                            <span style={{
                                                padding: '2px 8px',
                                                borderRadius: 10,
                                                background: getSeverityBg(alert.severity),
                                                color: getSeverityColor(alert.severity),
                                                fontSize: 10,
                                                fontWeight: 600,
                                                textTransform: 'uppercase',
                                            }}>
                                                {alert.severity}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Footer Info */}
            <div style={{ fontSize: 11, color: tokens.textSecondary, textAlign: 'center' }}>
                Last updated: {new Date(data.timestamp).toLocaleTimeString()} • Auto-refresh: 30s
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function OpsCenterMVP() {
    const [activeTab, setActiveTab] = useState<TabId>('health');

    // Phase 14.1: Emit intent event when switching tabs
    const handleTabSwitch = (tabId: TabId, tabLabel: string) => {
        // Phase 14.2: Generate traceId for this interaction
        const traceId = crypto.randomUUID();

        // Emit intent event (fire-and-forget)
        fetch('/api/platform/audit-intents', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-trace-id': traceId, // Phase 14.2: Trace propagation
            },
            body: JSON.stringify({
                action: 'os.view.switch',
                target: { viewName: tabLabel },
                meta: { viewId: tabId, context: 'ops-center' },
                timestamp: new Date().toISOString(),
            }),
        }).catch(err => console.warn('[Intent] Failed to emit os.view.switch:', err));

        // Switch tab (original logic)
        setActiveTab(tabId);
    };

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
                        onClick={() => handleTabSwitch(tab.id, tab.label)}
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
                {activeTab === 'alerts' && <AlertsTab />}
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
                Ops Center • Phase 6.5.2 Operational Intelligence
            </div>
        </div>
    );
}

export default OpsCenterMVP;
