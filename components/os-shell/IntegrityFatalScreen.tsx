/**
 * ═══════════════════════════════════════════════════════════════════════════
 * IntegrityFatalScreen — Phase 33A
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Full-page fatal screen shown when enforcement gate blocks /os access.
 * Always provides a link to /ops (Ops Center) — never bricks the system.
 *
 * @module components/os-shell/IntegrityFatalScreen
 */

import type { EnforcementResult } from '@/lib/ops/integrity/enforcementGate';

interface Props {
    gate: EnforcementResult;
}

export function IntegrityFatalScreen({ gate }: Props) {
    return (
        <html lang="en">
            <head>
                <title>⛔ System Integrity Failed — CORE OS</title>
                <meta name="robots" content="noindex, nofollow" />
            </head>
            <body style={{ margin: 0, padding: 0, background: '#0a0a0f', color: '#e2e2e8', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                <div style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2rem',
                }}>
                    <div style={{
                        maxWidth: '560px',
                        width: '100%',
                        border: '1px solid #dc2626',
                        borderRadius: '12px',
                        padding: '2.5rem',
                        background: 'linear-gradient(135deg, #1a0a0a 0%, #0f0a14 100%)',
                        boxShadow: '0 0 60px rgba(220, 38, 38, 0.15)',
                    }}>
                        {/* Header */}
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>⛔</div>
                            <h1 style={{
                                fontSize: '1.5rem',
                                fontWeight: 700,
                                color: '#fca5a5',
                                margin: 0,
                                letterSpacing: '-0.02em',
                            }}>
                                System Integrity Check Failed
                            </h1>
                            <p style={{
                                fontSize: '0.875rem',
                                color: '#9ca3af',
                                marginTop: '0.5rem',
                            }}>
                                CORE OS access is blocked by the enforcement gate
                            </p>
                        </div>

                        {/* Status Card */}
                        <div style={{
                            background: '#1a1a2e',
                            border: '1px solid #2d2d44',
                            borderRadius: '8px',
                            padding: '1.25rem',
                            marginBottom: '1.5rem',
                            fontFamily: 'ui-monospace, monospace',
                            fontSize: '0.8125rem',
                            lineHeight: '1.8',
                        }}>
                            <div>
                                <span style={{ color: '#6b7280' }}>Status: </span>
                                <span style={{ color: '#ef4444', fontWeight: 600 }}>{gate.integrityStatus}</span>
                            </div>
                            <div>
                                <span style={{ color: '#6b7280' }}>Mode: </span>
                                <span style={{ color: '#f59e0b', fontWeight: 600 }}>{gate.mode}</span>
                            </div>
                            {gate.reason && (
                                <div>
                                    <span style={{ color: '#6b7280' }}>Reason: </span>
                                    <span style={{ color: '#fca5a5' }}>{gate.reason}</span>
                                </div>
                            )}
                            {gate.errorCodes.length > 0 && (
                                <div>
                                    <span style={{ color: '#6b7280' }}>Errors: </span>
                                    <span style={{ color: '#f87171' }}>{gate.errorCodes.join(', ')}</span>
                                </div>
                            )}
                            <div>
                                <span style={{ color: '#6b7280' }}>Time: </span>
                                <span style={{ color: '#9ca3af' }}>{gate.ts}</span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <a
                                href="/ops"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    padding: '0.75rem 1.5rem',
                                    background: 'linear-gradient(135deg, #1d4ed8, #2563eb)',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '0.9375rem',
                                    fontWeight: 600,
                                    textDecoration: 'none',
                                    cursor: 'pointer',
                                    transition: 'opacity 0.2s',
                                }}
                            >
                                🔧 Open Ops Center
                            </a>
                            <a
                                href="/api/platform/integrity"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    padding: '0.625rem 1.5rem',
                                    background: 'transparent',
                                    color: '#9ca3af',
                                    border: '1px solid #2d2d44',
                                    borderRadius: '8px',
                                    fontSize: '0.8125rem',
                                    textDecoration: 'none',
                                    cursor: 'pointer',
                                }}
                            >
                                📋 View Raw Integrity JSON
                            </a>
                        </div>

                        {/* Footer */}
                        <p style={{
                            textAlign: 'center',
                            fontSize: '0.75rem',
                            color: '#4b5563',
                            marginTop: '1.5rem',
                            marginBottom: 0,
                        }}>
                            Phase 33A — Enforcement Gate ({gate.mode} mode)
                        </p>
                    </div>
                </div>
            </body>
        </html>
    );
}
