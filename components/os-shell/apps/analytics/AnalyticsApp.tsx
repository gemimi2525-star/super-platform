/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ANALYTICS APP — Experimental Skeleton
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * EXPERIMENTAL: Placeholder for future analytics capabilities.
 * Currently provides read-only placeholders for:
 * - Events Overview
 * - Audit-derived Metrics
 * - Governance Decisions Summary
 * 
 * Hidden from Dock by default (showInDock: false in manifest)
 * Accessible via direct route for development/testing only.
 * 
 * @module components/os-shell/apps/analytics/AnalyticsApp
 * @version 0.1.0-experimental — Phase XIV
 */

'use client';

import React from 'react';
import type { AppProps } from '../registry';
import { tokens } from '../../tokens';
import { addDecisionLog } from '../../system-log';

// ═══════════════════════════════════════════════════════════════════════════
// PLACEHOLDER CARD
// ═══════════════════════════════════════════════════════════════════════════

interface PlaceholderCardProps {
    title: string;
    icon: string;
    items: string[];
}

function PlaceholderCard({ title, icon, items }: PlaceholderCardProps) {
    return (
        <div style={{
            background: '#fff',
            border: '1px solid #eee',
            borderRadius: 12,
            padding: 24,
            marginBottom: 16,
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 16,
                paddingBottom: 12,
                borderBottom: '1px solid #f5f5f5',
            }}>
                <span style={{ fontSize: 20 }}>{icon}</span>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{title}</h3>
                <span style={{
                    marginLeft: 'auto',
                    padding: '2px 8px',
                    background: '#f0f0f0',
                    borderRadius: 4,
                    fontSize: 11,
                    color: '#666',
                    fontWeight: 500,
                }}>
                    PLACEHOLDER
                </span>
            </div>
            <div style={{ color: '#888', fontSize: 13 }}>
                {items.map((item, idx) => (
                    <div key={idx} style={{
                        padding: '8px 0',
                        borderBottom: idx < items.length - 1 ? '1px solid #f5f5f5' : 'none',
                    }}>
                        • {item}
                    </div>
                ))}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function AnalyticsApp({ windowId, capabilityId, isFocused }: AppProps) {
    // Log view (read-only access)
    React.useEffect(() => {
        addDecisionLog({
            timestamp: Date.now(),
            action: 'analytics.view',
            capabilityId: 'plugin.analytics',
            decision: 'ALLOW',
            reasonChain: ['User viewed experimental analytics placeholder'],
        });
    }, []);

    return (
        <div style={{
            height: '100%',
            fontFamily: tokens.fontFamily,
            overflow: 'auto',
            background: '#f8f8f8',
        }}>
            {/* Header */}
            <div style={{
                background: '#fff',
                borderBottom: '1px solid #eee',
                padding: '24px 32px',
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    marginBottom: 8,
                }}>
                    <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>
                        📊 Analytics
                    </h2>
                    <span style={{
                        padding: '4px 12px',
                        background: 'rgba(255, 193, 7, 0.1)',
                        border: '1px solid rgba(255, 193, 7, 0.3)',
                        borderRadius: 6,
                        fontSize: 12,
                        color: '#f57c00',
                        fontWeight: 600,
                    }}>
                        EXPERIMENTAL
                    </span>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: '#888' }}>
                    Future analytics capabilities • Currently in development
                </p>
            </div>

            {/* Warning Banner */}
            <div style={{ padding: 32 }}>
                <div style={{
                    padding: 16,
                    background: 'rgba(33, 150, 243, 0.1)',
                    border: '1px solid rgba(33, 150, 243, 0.3)',
                    borderRadius: 8,
                    marginBottom: 24,
                    fontSize: 13,
                    color: '#1565c0',
                }}>
                    ℹ️ <strong>Development Preview</strong> — This app is hidden from the Dock and accessible only via direct route for testing purposes.
                </div>

                {/* Placeholder Sections */}
                <PlaceholderCard
                    title="Events Overview"
                    icon="📈"
                    items={[
                        'Total Events (last 7 days)',
                        'Event Types Distribution',
                        'Hourly Activity Chart',
                        'Peak Usage Times',
                    ]}
                />

                <PlaceholderCard
                    title="Audit-derived Metrics"
                    icon="🔍"
                    items={[
                        'Governance Decisions (ALLOW/DENY ratio)',
                        'Step-up Authentication Success Rate',
                        'Most Active Capabilities',
                        'User Activity Heatmap',
                    ]}
                />

                <PlaceholderCard
                    title="Governance Decisions Summary"
                    icon="⚖️"
                    items={[
                        'Total Decisions by Type',
                        'Reason Chain Analysis',
                        'Correlation ID Traces',
                        'Policy Enforcement Stats',
                    ]}
                />

                <PlaceholderCard
                    title="System Health"
                    icon="💚"
                    items={[
                        'Kernel Status (FROZEN v1.0)',
                        'App Registry Consistency',
                        'Scenario Test Results (123/123)',
                        'Audit Log Integrity',
                    ]}
                />

                {/* Coming Soon Footer */}
                <div style={{
                    marginTop: 32,
                    padding: 24,
                    background: '#fff',
                    border: '1px solid #eee',
                    borderRadius: 12,
                    textAlign: 'center',
                }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>🚧</div>
                    <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
                        Under Construction
                    </div>
                    <div style={{ fontSize: 13, color: '#888' }}>
                        Full analytics capabilities coming in future phases
                    </div>
                </div>
            </div>
        </div>
    );
}
