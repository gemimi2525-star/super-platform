'use client';

import React from 'react';
import { tokens } from './tokens';

interface LoginScreenProps {
    onLoginSuccess: () => void;
}

export function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
    const [email, setEmail] = React.useState('admin@apicoredata.com');
    const [password, setPassword] = React.useState('Password@123'); // Pre-fill for demo convenience
    const [error, setError] = React.useState('');
    const [loading, setLoading] = React.useState(false);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Simulate network delay for realism
        setTimeout(() => {
            if (password === 'Password@123' || password === 'admin') {
                setLoading(false);
                onLoginSuccess();
            } else {
                setLoading(false);
                setError('Invalid password');
            }
        }, 800);
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: tokens.fontFamily,
            // Visually rich "Lavender" gradient background
            background: 'radial-gradient(circle at 50% 30%, #e0e0f5 0%, #a0a0d0 100%)',
            backgroundSize: 'cover',
        }}>
            {/* Glassmorphism Card */}
            <div style={{
                width: 380,
                padding: '40px 32px',
                background: 'rgba(255, 255, 255, 0.25)',
                backdropFilter: 'blur(20px)',
                borderRadius: 24,
                boxShadow: '0 24px 48px rgba(0,0,0,0.1), 0 8px 16px rgba(0,0,0,0.05)',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                textAlign: 'center',
            }}>
                {/* Avatar / Icon */}
                <div style={{
                    width: 96,
                    height: 96,
                    margin: '0 auto 24px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 36,
                    color: 'white',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
                }}>
                    User
                </div>

                <h2 style={{
                    margin: '0 0 8px',
                    fontSize: 22,
                    fontWeight: 600,
                    color: '#1a1a1a',
                }}>
                    Admin User
                </h2>
                <p style={{
                    margin: '0 0 32px',
                    fontSize: 14,
                    color: '#4a4a4a',
                    opacity: 0.8,
                }}>
                    Core OS Demo
                </p>

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <input
                        type="text"
                        value={email}
                        readOnly
                        style={{
                            padding: '12px 16px',
                            borderRadius: 12,
                            border: '1px solid rgba(255,255,255,0.4)',
                            background: 'rgba(255,255,255,0.5)',
                            fontSize: 14,
                            outline: 'none',
                            color: '#333',
                            textAlign: 'center',
                        }}
                    />

                    <div style={{ position: 'relative' }}>
                        <input
                            type="password"
                            placeholder="Enter Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                borderRadius: 12,
                                border: '1px solid rgba(255,255,255,0.4)',
                                background: 'rgba(255,255,255,0.8)',
                                fontSize: 14,
                                outline: 'none',
                                textAlign: 'center',
                                transition: 'all 0.2s',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    {error && (
                        <div style={{ color: '#d32f2f', fontSize: 13, marginTop: -8 }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            marginTop: 8,
                            padding: '12px',
                            borderRadius: 12,
                            border: 'none',
                            background: 'rgba(255,255,255,0.5)',
                            color: '#333',
                            fontSize: 14,
                            fontWeight: 600,
                            cursor: loading ? 'wait' : 'pointer',
                            transition: 'all 0.2s',
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.7)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.5)'}
                    >
                        {loading ? 'Unlocking...' : 'Unlock'}
                    </button>

                    <div style={{ fontSize: 12, color: '#666', marginTop: 16 }}>
                        Use <strong>Password@123</strong> to unlock
                    </div>
                </form>
            </div>
        </div>
    );
}
