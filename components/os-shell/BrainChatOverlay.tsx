/**
 * ═══════════════════════════════════════════════════════════════════════════
 * BRAIN CHAT OVERLAY — ⌘+K Spotlight-style AI Chat (Phase 18)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * A macOS Spotlight-inspired overlay for quick AI interactions.
 * Opens with ⌘+K from anywhere in the OS.
 * 
 * Features:
 * - Spotlight-style centered input
 * - Context-aware (knows which app/window is active)
 * - Auto-focus on open
 * - ESC to close
 * - Observer Mode badge (Phase 18)
 * 
 * @module components/os-shell/BrainChatOverlay
 * @version 1.0.0 (Phase 18)
 */

'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import '@/styles/nexus-tokens.css';
import { useSystemState } from '@/governance/synapse';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface BrainChatOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

interface QuickResponse {
    id: string;
    content: string;
    timestamp: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function BrainChatOverlay({ isOpen, onClose }: BrainChatOverlayProps) {
    const [input, setInput] = useState('');
    const [response, setResponse] = useState<QuickResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const state = useSystemState();

    // Auto-focus when opening
    useEffect(() => {
        if (isOpen) {
            // Small delay to ensure DOM is ready
            const timer = setTimeout(() => {
                inputRef.current?.focus();
            }, 50);
            return () => clearTimeout(timer);
        } else {
            setInput('');
            setResponse(null);
            setError(null);
        }
    }, [isOpen]);

    // Handle ESC to close
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown, true);
        return () => window.removeEventListener('keydown', handleKeyDown, true);
    }, [isOpen, onClose]);

    const sendQuery = useCallback(async () => {
        const trimmed = input.trim();
        if (!trimmed || isLoading) return;

        setIsLoading(true);
        setError(null);
        setResponse(null);

        try {
            // Build context from current OS state
            const context = {
                focusedWindow: state.focusedWindowId || null,
                windowCount: state.windows?.length || 0,
                mode: 'overlay', // ⌘+K mode
            };

            const res = await fetch('/api/brain', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    appId: 'brain.assist',
                    correlationId: crypto.randomUUID(),
                    messages: [
                        {
                            role: 'system',
                            content: `คุณคือ AI Observer ของ Core OS (Phase 18: Observer Only) — อ่านได้ แต่ทำอะไรไม่ได้\n` +
                                `Context: user อยู่ที่ window "${context.focusedWindow || 'Desktop'}", มี ${context.windowCount} windows เปิดอยู่\n` +
                                `ตอบสั้น กระชับ เข้าใจง่าย เป็นภาษาไทยหรือภาษาที่ user ใช้`
                        },
                        { role: 'user', content: trimmed }
                    ],
                    shadow: true, // Phase 18: FORCED
                    context,
                }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || `HTTP ${res.status}`);
            }

            const data = await res.json();
            setResponse({
                id: data.id || `resp-${Date.now()}`,
                content: data.content || 'ไม่มีคำตอบ',
                timestamp: Date.now(),
            });
        } catch (err: any) {
            setError(err.message || 'เกิดข้อผิดพลาด');
        } finally {
            setIsLoading(false);
        }
    }, [input, isLoading, state]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendQuery();
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={onClose}
                style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.45)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    zIndex: 99999,
                    animation: 'brainOverlayFadeIn 0.15s ease-out',
                }}
            />

            {/* Spotlight Container */}
            <div
                style={{
                    position: 'fixed',
                    top: '20%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '560px',
                    maxWidth: 'calc(100vw - 48px)',
                    zIndex: 100000,
                    animation: 'brainOverlaySlideIn 0.2s ease-out',
                }}
            >
                {/* Search Box */}
                <div style={{
                    background: 'rgba(30, 30, 30, 0.95)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 24px 80px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
                    overflow: 'hidden',
                }}>
                    {/* Header Badge */}
                    <div style={{
                        padding: '10px 16px 0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                        }}>
                            <span style={{
                                fontSize: '11px',
                                color: 'rgba(34, 197, 94, 0.9)',
                                background: 'rgba(34, 197, 94, 0.12)',
                                padding: '2px 8px',
                                borderRadius: '10px',
                                fontWeight: 500,
                                letterSpacing: '0.02em',
                            }}>
                                🔍 Observer Mode
                            </span>
                            <span style={{
                                fontSize: '11px',
                                color: 'rgba(255, 255, 255, 0.35)',
                            }}>
                                Phase 18
                            </span>
                        </div>
                        <span style={{
                            fontSize: '10px',
                            color: 'rgba(255, 255, 255, 0.25)',
                            fontFamily: 'var(--nx-font-mono, monospace)',
                        }}>
                            ⌘K
                        </span>
                    </div>

                    {/* Input */}
                    <div style={{
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                    }}>
                        <span style={{ fontSize: '20px', opacity: 0.6 }}>🧠</span>
                        <input
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="ถาม AI เกี่ยวกับระบบ..."
                            style={{
                                flex: 1,
                                background: 'transparent',
                                border: 'none',
                                outline: 'none',
                                fontSize: '17px',
                                fontWeight: 300,
                                color: '#ffffff',
                                fontFamily: 'var(--nx-font-system)',
                                letterSpacing: '0.01em',
                            }}
                            disabled={isLoading}
                        />
                        {isLoading && (
                            <div style={{
                                width: '18px',
                                height: '18px',
                                border: '2px solid rgba(255, 255, 255, 0.15)',
                                borderTop: '2px solid rgba(59, 130, 246, 0.8)',
                                borderRadius: '50%',
                                animation: 'brainSpinner 0.8s linear infinite',
                            }} />
                        )}
                    </div>

                    {/* Response Area */}
                    {(response || error) && (
                        <div style={{
                            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                            padding: '14px 16px',
                            maxHeight: '300px',
                            overflowY: 'auto',
                        }}>
                            {error ? (
                                <div style={{
                                    color: '#f87171',
                                    fontSize: '13px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                }}>
                                    ⚠️ {error}
                                </div>
                            ) : response ? (
                                <div style={{
                                    color: 'rgba(255, 255, 255, 0.85)',
                                    fontSize: '13px',
                                    lineHeight: 1.6,
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word',
                                }}>
                                    {response.content}
                                </div>
                            ) : null}
                        </div>
                    )}

                    {/* Quick Actions */}
                    {!response && !error && !isLoading && (
                        <div style={{
                            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                            padding: '8px 12px',
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '6px',
                        }}>
                            {[
                                { label: '📊 สถานะระบบ', query: 'สรุปสถานะระบบ' },
                                { label: '📝 Audit Log', query: 'สรุป audit log ล่าสุด' },
                                { label: '🔒 Data Access', query: 'อธิบายระดับการเข้าถึงข้อมูล' },
                            ].map(action => (
                                <button
                                    key={action.label}
                                    onClick={() => {
                                        setInput(action.query);
                                        // Auto-send after setting
                                        setTimeout(() => {
                                            inputRef.current?.form?.requestSubmit?.();
                                        }, 50);
                                    }}
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.06)',
                                        border: '1px solid rgba(255, 255, 255, 0.08)',
                                        borderRadius: '8px',
                                        padding: '4px 10px',
                                        color: 'rgba(255, 255, 255, 0.5)',
                                        fontSize: '11px',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease',
                                        fontFamily: 'var(--nx-font-system)',
                                    }}
                                    onMouseEnter={(e) => {
                                        (e.target as HTMLElement).style.background = 'rgba(255, 255, 255, 0.1)';
                                        (e.target as HTMLElement).style.color = 'rgba(255, 255, 255, 0.75)';
                                    }}
                                    onMouseLeave={(e) => {
                                        (e.target as HTMLElement).style.background = 'rgba(255, 255, 255, 0.06)';
                                        (e.target as HTMLElement).style.color = 'rgba(255, 255, 255, 0.5)';
                                    }}
                                >
                                    {action.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Hint */}
                <div style={{
                    textAlign: 'center',
                    marginTop: '10px',
                    fontSize: '11px',
                    color: 'rgba(255, 255, 255, 0.3)',
                }}>
                    <kbd style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '10px',
                    }}>ESC</kbd> ปิด &nbsp;·&nbsp; <kbd style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '10px',
                    }}>Enter</kbd> ส่ง
                </div>
            </div>

            {/* Animations */}
            <style>{`
                @keyframes brainOverlayFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes brainOverlaySlideIn {
                    from { opacity: 0; transform: translateX(-50%) translateY(-10px) scale(0.98); }
                    to { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
                }
                @keyframes brainSpinner {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </>
    );
}
