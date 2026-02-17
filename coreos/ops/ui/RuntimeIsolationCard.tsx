'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * RuntimeIsolationCard (Phase 35C — Runtime Isolation Level 2)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Owner-only Ops card showing Runtime Policy Engine status, active gates,
 * audit summary, and Evidence Pack (Markdown) export.
 *
 * @module coreos/ops/ui/RuntimeIsolationCard
 */

import React, { useState, useEffect, useCallback } from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface AuditEventSummary {
    eventType: string;
    timestamp: number;
    toolName: string;
    appScope: string;
    decision: string;
    riskLevel: string;
}

interface RuntimePolicyStatus {
    policyVersion: string;
    enforcementLayers: number;
    activeGates: number;
    noncePoolSize: number;
    scopes: string[];
    rateLimits: Record<string, number>;
    audit: {
        totalEvents: number;
        allowed: number;
        blocked: number;
        replayBlocked: number;
        hashMismatches: number;
        rateLimitHits: number;
        recentEvents: AuditEventSummary[];
    };
    ts: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════

const cardStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, rgba(20,25,45,0.95), rgba(15,18,35,0.98))',
    border: '1px solid rgba(100,120,255,0.15)',
    borderRadius: '14px',
    padding: '24px',
    marginTop: '16px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
};

const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px',
};

const titleStyle: React.CSSProperties = {
    fontSize: '15px',
    fontWeight: 600,
    color: '#e0e0e0',
    letterSpacing: '0.3px',
};

const badgeStyle: React.CSSProperties = {
    fontSize: '11px',
    fontWeight: 600,
    padding: '3px 10px',
    borderRadius: '20px',
    background: 'rgba(80,200,120,0.15)',
    color: '#50c878',
    letterSpacing: '0.5px',
};

const statsGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
    gap: '10px',
    marginBottom: '16px',
};

const statBoxStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    borderRadius: '10px',
    padding: '12px',
    textAlign: 'center',
};

const statValueStyle: React.CSSProperties = {
    fontSize: '20px',
    fontWeight: 700,
    color: '#ffffff',
    lineHeight: 1.2,
};

const statLabelStyle: React.CSSProperties = {
    fontSize: '10px',
    color: 'rgba(255,255,255,0.45)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    marginTop: '4px',
};

const eventRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    borderRadius: '8px',
    background: 'rgba(255,255,255,0.03)',
    marginBottom: '4px',
    fontSize: '12px',
};

const btnStyle: React.CSSProperties = {
    padding: '8px 16px',
    borderRadius: '8px',
    border: '1px solid rgba(100,120,255,0.3)',
    background: 'rgba(100,120,255,0.1)',
    color: '#8b9cf7',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
};

const toggleBtnStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    color: 'rgba(255,255,255,0.5)',
    fontSize: '12px',
    cursor: 'pointer',
    padding: '4px 8px',
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function getEventIcon(eventType: string): string {
    switch (eventType) {
        case 'EXECUTION_ALLOWED': return '✅';
        case 'EXECUTION_BLOCKED': return '🛑';
        case 'FIREWALL_BLOCKED': return '🔥';
        case 'GUARD_BLOCKED': return '🛡️';
        case 'NONCE_REPLAY_BLOCKED': return '🔄';
        case 'ARGS_HASH_MISMATCH': return '⚠️';
        case 'RATE_LIMIT_HIT': return '⏱️';
        case 'POLICY_EVAL': return '📋';
        default: return '❓';
    }
}

function getDecisionColor(decision: string): string {
    switch (decision) {
        case 'ALLOW': return '#50c878';
        case 'DENY': return '#ff4757';
        case 'REQUIRE_APPROVAL': return '#ffa502';
        case 'REQUIRE_OWNER': return '#ff6348';
        default: return '#888';
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function RuntimeIsolationCard() {
    const [data, setData] = useState<RuntimePolicyStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expanded, setExpanded] = useState(false);
    const [copied, setCopied] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const res = await fetch('/api/ops/runtime-policy/status');
            if (res.status === 401) {
                setError('owner-only');
                setLoading(false);
                return;
            }
            const json = await res.json();
            if (json.ok) {
                setData(json.data);
                setError(null);
            } else {
                setError(json.error || 'Failed to load');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, [fetchData]);

    const handleCopyEvidence = useCallback(async () => {
        if (!data) return;
        const now = new Date().toISOString();
        let md = `# Runtime Isolation — Evidence Pack\nGenerated: ${now}\nPolicy Version: ${data.policyVersion}\n\n`;
        md += `## Summary\n| Metric | Value |\n|--------|-------|\n`;
        md += `| Enforcement Layers | ${data.enforcementLayers} |\n`;
        md += `| Active Gates | ${data.activeGates} |\n`;
        md += `| Nonce Pool | ${data.noncePoolSize} |\n`;
        md += `| Total Events | ${data.audit.totalEvents} |\n`;
        md += `| Allowed | ${data.audit.allowed} |\n`;
        md += `| Blocked | ${data.audit.blocked} |\n`;
        md += `| Replay Blocked | ${data.audit.replayBlocked} |\n`;
        md += `| Hash Mismatches | ${data.audit.hashMismatches} |\n`;
        md += `| Rate Limit Hits | ${data.audit.rateLimitHits} |\n\n`;

        md += `## Scopes\n${data.scopes.map(s => `- ${s}`).join('\n')}\n\n`;

        md += `## Recent Events\n| Time | Type | Tool | Decision |\n|------|------|------|----------|\n`;
        for (const e of data.audit.recentEvents) {
            const time = new Date(e.timestamp).toISOString().slice(11, 19);
            md += `| ${time} | ${e.eventType} | ${e.toolName} | ${e.decision} |\n`;
        }
        md += `\n---\nPhase 35C | Defense-in-depth: Gateway + Worker\n`;

        await navigator.clipboard.writeText(md);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [data]);

    // ─────────────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────────────

    if (error === 'owner-only') return null;

    if (loading) {
        return (
            <div style={{ ...cardStyle, opacity: 0.6 }}>
                <div style={titleStyle}>🛡️ Runtime Isolation — Loading…</div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div style={{ ...cardStyle, borderColor: 'rgba(255,70,70,0.3)' }}>
                <div style={titleStyle}>🛡️ Runtime Isolation</div>
                <div style={{ color: '#ff4757', fontSize: '13px', marginTop: '8px' }}>
                    ⚠️ {error || 'No data'}
                </div>
            </div>
        );
    }

    return (
        <div style={cardStyle}>
            {/* Header */}
            <div style={headerStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={titleStyle}>🛡️ Runtime Isolation</span>
                    <span style={badgeStyle}>v{data.policyVersion}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button style={btnStyle} onClick={handleCopyEvidence}>
                        {copied ? '✅ Copied!' : '📋 Evidence Pack'}
                    </button>
                    <button style={toggleBtnStyle} onClick={() => setExpanded(!expanded)}>
                        {expanded ? '▲ Collapse' : '▼ Expand'}
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div style={statsGridStyle}>
                <div style={statBoxStyle}>
                    <div style={statValueStyle}>{data.enforcementLayers}</div>
                    <div style={statLabelStyle}>Layers</div>
                </div>
                <div style={statBoxStyle}>
                    <div style={statValueStyle}>{data.activeGates}</div>
                    <div style={statLabelStyle}>Gates</div>
                </div>
                <div style={statBoxStyle}>
                    <div style={{ ...statValueStyle, color: '#50c878' }}>{data.audit.allowed}</div>
                    <div style={statLabelStyle}>Allowed</div>
                </div>
                <div style={statBoxStyle}>
                    <div style={{ ...statValueStyle, color: data.audit.blocked > 0 ? '#ff4757' : '#888' }}>
                        {data.audit.blocked}
                    </div>
                    <div style={statLabelStyle}>Blocked</div>
                </div>
                <div style={statBoxStyle}>
                    <div style={statValueStyle}>{data.noncePoolSize}</div>
                    <div style={statLabelStyle}>Nonces</div>
                </div>
            </div>

            {/* Expanded Section */}
            {expanded && (
                <div style={{ marginTop: '12px' }}>
                    {/* Scopes */}
                    <div style={{ marginBottom: '12px' }}>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px', textTransform: 'uppercase' as const }}>
                            Protected Scopes
                        </div>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const }}>
                            {data.scopes.map(scope => (
                                <span key={scope} style={{
                                    fontSize: '11px',
                                    padding: '3px 8px',
                                    borderRadius: '6px',
                                    background: 'rgba(100,120,255,0.1)',
                                    color: '#8b9cf7',
                                    border: '1px solid rgba(100,120,255,0.2)',
                                }}>
                                    {scope}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Recent Events */}
                    <div>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px', textTransform: 'uppercase' as const }}>
                            Recent Events
                        </div>
                        {data.audit.recentEvents.length === 0 ? (
                            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', fontStyle: 'italic' }}>
                                No events yet
                            </div>
                        ) : (
                            data.audit.recentEvents.map((event, i) => (
                                <div key={i} style={eventRowStyle}>
                                    <span>{getEventIcon(event.eventType)} {event.toolName}</span>
                                    <span style={{
                                        color: getDecisionColor(event.decision),
                                        fontWeight: 600,
                                        fontSize: '11px',
                                    }}>
                                        {event.decision}
                                    </span>
                                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px' }}>
                                        {new Date(event.timestamp).toISOString().slice(11, 19)}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Extra Stats */}
                    <div style={{ marginTop: '12px', display: 'flex', gap: '16px', fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>
                        <span>🔄 Replay Blocked: {data.audit.replayBlocked}</span>
                        <span>⚠️ Hash Mismatch: {data.audit.hashMismatches}</span>
                        <span>⏱️ Rate Limit: {data.audit.rateLimitHits}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
