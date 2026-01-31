/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AUDIT LOGS APP — Main Component
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * MVP Audit Logs viewer showing governance decisions (ALLOW/DENY/SKIP).
 * Read-only — no state mutations or intent triggers.
 * 
 * @module components/os-shell/apps/audit/AuditLogsApp
 * @version 1.0.0
 */

'use client';

import React, { useState, useSyncExternalStore } from 'react';
import type { AppProps } from '../registry';
import { tokens } from '../../tokens';
import {
    getDecisionLog,
    subscribeToLog,
    type DecisionLogEntry,
} from '../../system-log';

// ═══════════════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════════════

function useDecisionLog(): readonly DecisionLogEntry[] {
    return useSyncExternalStore(
        subscribeToLog,
        () => getDecisionLog(),
        () => getDecisionLog()
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// DECISION BADGE
// ═══════════════════════════════════════════════════════════════════════════

function DecisionBadge({ decision }: { decision: string }) {
    const colors = {
        ALLOW: { bg: '#e6f7e6', text: '#1a7f1a' },
        DENY: { bg: '#fce4ec', text: '#c2185b' },
        SKIP: { bg: '#fff3e0', text: '#e65100' },
    };
    const c = colors[decision as keyof typeof colors] || { bg: '#f0f0f0', text: '#666' };

    return (
        <span
            style={{
                padding: '2px 8px',
                background: c.bg,
                color: c.text,
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 600,
            }}
        >
            {decision}
        </span>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// DETAIL PANEL
// ═══════════════════════════════════════════════════════════════════════════

interface DetailPanelProps {
    entry: DecisionLogEntry | null;
    onClose: () => void;
}

function DetailPanel({ entry, onClose }: DetailPanelProps) {
    if (!entry) return null;

    const formatTime = (ts: number) => {
        const date = new Date(ts);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        });
    };

    return (
        <div
            style={{
                position: 'absolute',
                top: 0,
                right: 0,
                bottom: 0,
                width: 320,
                background: '#fafafa',
                borderLeft: '1px solid #eee',
                padding: 20,
                overflow: 'auto',
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Decision Details</h3>
                <button
                    onClick={onClose}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 14,
                        color: '#888',
                    }}
                >
                    ✕
                </button>
            </div>

            <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Decision</div>
                <DecisionBadge decision={entry.decision} />
            </div>

            <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Timestamp</div>
                <div style={{ fontSize: 13 }}>{formatTime(entry.timestamp)}</div>
            </div>

            <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Action</div>
                <div style={{ fontSize: 13, fontFamily: tokens.fontMono }}>{entry.action}</div>
            </div>

            <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Capability</div>
                <div style={{ fontSize: 13, fontFamily: tokens.fontMono }}>{entry.capabilityId}</div>
            </div>

            {entry.reasonChain && entry.reasonChain.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, color: '#888', marginBottom: 8 }}>Reason Chain</div>
                    {entry.reasonChain.map((reason, i) => (
                        <div
                            key={i}
                            style={{
                                padding: '8px 12px',
                                background: '#fff',
                                border: '1px solid #eee',
                                borderRadius: 6,
                                marginBottom: 8,
                                fontSize: 12,
                                color: '#555',
                            }}
                        >
                            <span style={{ color: '#888', marginRight: 8 }}>{i + 1}.</span>
                            {reason}
                        </div>
                    ))}
                </div>
            )}

            {entry.failedRule && (
                <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Failed Rule</div>
                    <div
                        style={{
                            fontSize: 12,
                            fontFamily: tokens.fontMono,
                            padding: '6px 10px',
                            background: '#fce4ec',
                            borderRadius: 4,
                            color: '#c2185b',
                        }}
                    >
                        {entry.failedRule}
                    </div>
                </div>
            )}

            {entry.correlationId && (
                <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Correlation ID</div>
                    <div style={{ fontSize: 11, fontFamily: tokens.fontMono, color: '#888' }}>
                        {entry.correlationId}
                    </div>
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function AuditLogsApp({ windowId, capabilityId, isFocused }: AppProps) {
    const log = useDecisionLog();
    const [selectedEntry, setSelectedEntry] = useState<DecisionLogEntry | null>(null);

    const formatTime = (ts: number) => {
        const date = new Date(ts);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        });
    };

    return (
        <div
            style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                fontFamily: tokens.fontFamily,
                position: 'relative',
            }}
        >
            {/* Header */}
            <div
                style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid #eee',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                }}
            >
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
                    📋 Audit Logs
                </h2>
                <span style={{ fontSize: 12, color: '#888' }}>
                    {log.length} decision{log.length !== 1 ? 's' : ''}
                </span>
            </div>

            {/* Content */}
            <div
                style={{
                    flex: 1,
                    overflow: 'auto',
                    paddingRight: selectedEntry ? 320 : 0,
                }}
            >
                {log.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#888', padding: 40 }}>
                        No decisions logged yet.
                        <br />
                        <span style={{ fontSize: 12 }}>Try opening or closing some windows.</span>
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #eee' }}>
                                <th style={{ textAlign: 'left', padding: '8px 16px', fontSize: 11, color: '#888', fontWeight: 600 }}>
                                    TIME
                                </th>
                                <th style={{ textAlign: 'left', padding: '8px 12px', fontSize: 11, color: '#888', fontWeight: 600 }}>
                                    ACTION
                                </th>
                                <th style={{ textAlign: 'left', padding: '8px 12px', fontSize: 11, color: '#888', fontWeight: 600 }}>
                                    CAPABILITY
                                </th>
                                <th style={{ textAlign: 'left', padding: '8px 12px', fontSize: 11, color: '#888', fontWeight: 600 }}>
                                    DECISION
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {log.map((entry, i) => (
                                <tr
                                    key={`${entry.timestamp}-${i}`}
                                    onClick={() => setSelectedEntry(entry)}
                                    style={{
                                        borderBottom: '1px solid #f5f5f5',
                                        cursor: 'pointer',
                                        background: selectedEntry === entry ? '#f0f7ff' : 'transparent',
                                    }}
                                >
                                    <td style={{ padding: '10px 16px', fontSize: 12, color: '#888', fontFamily: tokens.fontMono }}>
                                        {formatTime(entry.timestamp)}
                                    </td>
                                    <td style={{ padding: '10px 12px', fontSize: 13 }}>
                                        {entry.action}
                                    </td>
                                    <td style={{ padding: '10px 12px', fontSize: 12, color: '#666', fontFamily: tokens.fontMono }}>
                                        {entry.capabilityId}
                                    </td>
                                    <td style={{ padding: '10px 12px' }}>
                                        <DecisionBadge decision={entry.decision} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Detail Panel */}
            <DetailPanel entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
        </div>
    );
}
