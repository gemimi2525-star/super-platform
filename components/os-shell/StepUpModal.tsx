/**
 * ═══════════════════════════════════════════════════════════════════════════
 * OS SHELL — Step-Up Modal (Enhanced)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * macOS-style authentication dialog with password re-auth.
 * 
 * @module components/os-shell/StepUpModal
 * @version 2.0.0 — Phase X Step-up Authentication
 */

'use client';

import React, { useState } from 'react';
import { tokens } from './tokens';
import { useStepUpAuth } from '@/governance/synapse/stepup';

export function StepUpModal() {
    const { session, isPending, verify, cancel } = useStepUpAuth();
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    if (!isPending) return null;

    const action = session.pendingAction;

    const handleVerify = async () => {
        if (!password.trim()) {
            setError('Please enter your password');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // For MVP: Accept any password with length >= 4
            // In production: Call Firebase re-auth API
            if (password.length >= 4) {
                verify(true);
                setPassword('');
            } else {
                setError('Invalid password');
                verify(false);
            }
        } catch (e) {
            setError('Verification failed');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setPassword('');
        setError(null);
        cancel();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleVerify();
        } else if (e.key === 'Escape') {
            handleCancel();
        }
    };

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.5)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 20000,
            }}
            onClick={handleCancel}
        >
            <div
                style={{
                    background: '#fff',
                    padding: 28,
                    borderRadius: 16,
                    width: 360,
                    boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
                    fontFamily: tokens.fontFamily,
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Icon */}
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                    <div
                        style={{
                            width: 64,
                            height: 64,
                            margin: '0 auto',
                            borderRadius: 16,
                            background: 'linear-gradient(135deg, #007AFF, #00C7FF)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 32,
                        }}
                    >
                        🔐
                    </div>
                </div>

                {/* Title */}
                <h2 style={{
                    margin: '0 0 8px',
                    fontSize: 18,
                    fontWeight: 600,
                    textAlign: 'center',
                }}>
                    Authentication Required
                </h2>

                <p style={{
                    margin: '0 0 20px',
                    color: '#666',
                    fontSize: 14,
                    textAlign: 'center',
                    lineHeight: 1.5,
                }}>
                    Enter your password to {action?.action || 'continue'}
                </p>

                {/* Password Input */}
                <div style={{ marginBottom: 16 }}>
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        style={{
                            width: '100%',
                            padding: '12px 16px',
                            fontSize: 14,
                            border: error ? '1px solid #ff3b30' : '1px solid #ddd',
                            borderRadius: 8,
                            outline: 'none',
                            boxSizing: 'border-box',
                        }}
                    />
                    {error && (
                        <div style={{
                            color: '#ff3b30',
                            fontSize: 12,
                            marginTop: 6,
                        }}>
                            {error}
                        </div>
                    )}
                </div>

                {/* Buttons */}
                <div style={{ display: 'flex', gap: 12 }}>
                    <button
                        onClick={handleCancel}
                        disabled={loading}
                        style={{
                            flex: 1,
                            padding: '12px 16px',
                            background: '#f0f0f0',
                            border: 'none',
                            borderRadius: 8,
                            cursor: 'pointer',
                            fontSize: 14,
                            fontWeight: 500,
                            opacity: loading ? 0.5 : 1,
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleVerify}
                        disabled={loading}
                        style={{
                            flex: 1,
                            padding: '12px 16px',
                            background: '#007AFF',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 8,
                            cursor: 'pointer',
                            fontSize: 14,
                            fontWeight: 500,
                            opacity: loading ? 0.5 : 1,
                        }}
                    >
                        {loading ? 'Verifying...' : 'Verify'}
                    </button>
                </div>

                {/* Session info */}
                {session.correlationId && (
                    <div style={{
                        marginTop: 16,
                        paddingTop: 12,
                        borderTop: '1px solid #eee',
                        fontSize: 10,
                        color: '#999',
                        textAlign: 'center',
                        fontFamily: tokens.fontMono,
                    }}>
                        {session.correlationId}
                    </div>
                )}
            </div>
        </div>
    );
}
