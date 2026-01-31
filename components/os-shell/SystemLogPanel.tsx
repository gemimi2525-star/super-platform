/**
 * ═══════════════════════════════════════════════════════════════════════════
 * OS SHELL — System Log Panel (V3)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Dev-only panel to view governance decisions.
 * 
 * @module components/os-shell/SystemLogPanel
 * @version 1.0.0
 */

'use client';

import React, { useSyncExternalStore } from 'react';
import { tokens } from './tokens';
import {
    getDecisionLog,
    subscribeToLog,
    clearDecisionLog,
    type DecisionLogEntry,
} from './system-log';

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
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface SystemLogPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SystemLogPanel({ isOpen, onClose }: SystemLogPanelProps) {
    const log = useDecisionLog();

    if (!isOpen) return null;

    const formatTime = (ts: number) => {
        const date = new Date(ts);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        });
    };

    const getDecisionColor = (decision: string) => {
        switch (decision) {
            case 'ALLOW': return '#28C840';
            case 'DENY': return '#FF5F57';
            case 'SKIP': return '#FFBD2E';
            default: return '#888';
        }
    };

    return (
        <div
            style={{
                position: 'fixed',
                top: tokens.menubarHeight + 8,
                right: 8,
                width: 420,
                maxHeight: 'calc(100vh - 120px)',
                background: 'rgba(20,20,25,0.95)',
                backdropFilter: 'blur(20px)',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
                zIndex: 15000,
                overflow: 'hidden',
                fontFamily: tokens.fontFamily,
            }}
        >
            {/* Header */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                }}
            >
                <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>
                    🔍 System Log ({log.length})
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button
                        onClick={() => clearDecisionLog()}
                        style={{
                            background: 'rgba(255,255,255,0.1)',
                            border: 'none',
                            borderRadius: 4,
                            padding: '4px 8px',
                            color: '#888',
                            fontSize: 11,
                            cursor: 'pointer',
                        }}
                    >
                        Clear
                    </button>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'rgba(255,255,255,0.1)',
                            border: 'none',
                            borderRadius: 4,
                            padding: '4px 8px',
                            color: '#888',
                            fontSize: 11,
                            cursor: 'pointer',
                        }}
                    >
                        ✕
                    </button>
                </div>
            </div>

            {/* Log Entries */}
            <div
                style={{
                    maxHeight: 400,
                    overflowY: 'auto',
                }}
            >
                {log.length === 0 ? (
                    <div style={{
                        padding: 24,
                        textAlign: 'center',
                        color: '#666',
                        fontSize: 12,
                    }}>
                        No decisions logged yet
                    </div>
                ) : (
                    log.map((entry, i) => (
                        <div
                            key={`${entry.timestamp}-${i}`}
                            style={{
                                padding: '10px 16px',
                                borderBottom: '1px solid rgba(255,255,255,0.05)',
                            }}
                        >
                            {/* Header Row */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                marginBottom: 4,
                            }}>
                                <span
                                    style={{
                                        fontSize: 10,
                                        fontWeight: 600,
                                        padding: '2px 6px',
                                        borderRadius: 3,
                                        background: getDecisionColor(entry.decision),
                                        color: '#fff',
                                    }}
                                >
                                    {entry.decision}
                                </span>
                                <span style={{ color: '#fff', fontSize: 12, fontWeight: 500 }}>
                                    {entry.action}
                                </span>
                                <span style={{ color: '#666', fontSize: 10, marginLeft: 'auto' }}>
                                    {formatTime(entry.timestamp)}
                                </span>
                            </div>

                            {/* Capability */}
                            <div style={{ color: '#888', fontSize: 11, marginBottom: 4 }}>
                                <span style={{ color: '#666' }}>capability:</span>{' '}
                                <span style={{ fontFamily: tokens.fontMono }}>{entry.capabilityId}</span>
                            </div>

                            {/* Reason Chain */}
                            {entry.reasonChain && entry.reasonChain.length > 0 && (
                                <div style={{ marginTop: 6 }}>
                                    {entry.reasonChain.map((reason, j) => (
                                        <div
                                            key={j}
                                            style={{
                                                color: '#999',
                                                fontSize: 10,
                                                fontFamily: tokens.fontMono,
                                                paddingLeft: 8,
                                                borderLeft: '2px solid #444',
                                                marginBottom: 2,
                                            }}
                                        >
                                            {reason}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Failed Rule */}
                            {entry.failedRule && (
                                <div style={{
                                    marginTop: 4,
                                    color: '#FF5F57',
                                    fontSize: 10,
                                    fontFamily: tokens.fontMono,
                                }}>
                                    failed: {entry.failedRule}
                                </div>
                            )}

                            {/* Correlation ID */}
                            {entry.correlationId && (
                                <div style={{
                                    marginTop: 4,
                                    color: '#555',
                                    fontSize: 9,
                                    fontFamily: tokens.fontMono,
                                }}>
                                    correlation: {entry.correlationId}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
