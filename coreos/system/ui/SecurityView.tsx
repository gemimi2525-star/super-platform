'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SecurityView — System Hub Tab (Phase 27A)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Step-up auth status, session management.
 * Shared between OS Shell window and /system/security route.
 *
 * @module coreos/system/ui/SecurityView
 * @version 1.0.0
 */

import React, { useCallback } from 'react';
import { useStepUpAuth } from '@/governance/synapse/stepup';

interface SecurityViewProps {
    compact?: boolean;
}

export function SecurityView({ compact }: SecurityViewProps) {
    const { session, isVerified, remainingTime, clear } = useStepUpAuth();

    const handleClearStepUp = useCallback(() => {
        clear();
    }, [clear]);

    const formatTime = (ms: number) => {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes}m ${seconds}s`;
    };

    return (
        <div>
            {/* Step-Up Authentication */}
            <div style={s.section}>
                <div style={s.sectionHeader}>
                    <span style={{ fontSize: 18 }}>🔐</span>
                    <h3 style={s.sectionTitle}>Step-Up Authentication</h3>
                </div>
                <div style={s.card}>
                    <div style={s.row}>
                        <div>
                            <div style={s.label}>Status</div>
                            <div style={s.desc}>Current step-up verification status</div>
                        </div>
                        {isVerified ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 12, color: '#22c55e', fontWeight: 500 }}>✓ Verified</span>
                                <span style={{ fontSize: 11, color: '#94a3b8' }}>
                                    ({formatTime(remainingTime)})
                                </span>
                            </div>
                        ) : (
                            <span style={{ fontSize: 12, color: '#94a3b8' }}>Not verified</span>
                        )}
                    </div>

                    {isVerified && (
                        <div style={s.row}>
                            <div>
                                <div style={s.label}>Clear Session</div>
                                <div style={s.desc}>Manually clear current step-up session</div>
                            </div>
                            <button onClick={handleClearStepUp} style={s.dangerBtn}>
                                Clear Session
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Access Policies */}
            <div style={s.section}>
                <div style={s.sectionHeader}>
                    <span style={{ fontSize: 18 }}>🛡️</span>
                    <h3 style={s.sectionTitle}>Access Policies</h3>
                </div>
                <div style={s.card}>
                    <div style={s.row}>
                        <div>
                            <div style={s.label}>Role-Based Access</div>
                            <div style={s.desc}>Enforced on all routes and APIs</div>
                        </div>
                        <span style={{ fontSize: 12, color: '#22c55e', fontWeight: 500 }}>✓ Active</span>
                    </div>
                    <div style={s.row}>
                        <div>
                            <div style={s.label}>Audit Logging</div>
                            <div style={s.desc}>All access decisions are logged</div>
                        </div>
                        <span style={{ fontSize: 12, color: '#22c55e', fontWeight: 500 }}>✓ Enabled</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

const s: Record<string, React.CSSProperties> = {
    section: { marginBottom: 28 },
    sectionHeader: {
        display: 'flex', alignItems: 'center', gap: 8,
        marginBottom: 12, paddingBottom: 8,
        borderBottom: '1px solid rgba(148, 163, 184, 0.12)',
    },
    sectionTitle: {
        margin: 0, fontSize: 15, fontWeight: 600, color: '#e2e8f0',
    },
    card: {
        background: 'rgba(30, 41, 59, 0.5)',
        borderRadius: 10,
        border: '1px solid rgba(148, 163, 184, 0.08)',
        overflow: 'hidden',
    },
    row: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 16px',
        borderBottom: '1px solid rgba(148, 163, 184, 0.06)',
    },
    label: { fontSize: 13, fontWeight: 500, color: '#e2e8f0', marginBottom: 2 },
    desc: { fontSize: 11, color: '#94a3b8' },
    dangerBtn: {
        padding: '6px 12px', border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: 6, fontSize: 12, cursor: 'pointer',
        background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontWeight: 500,
    },
};
