/**
 * ═══════════════════════════════════════════════════════════════════════════
 * BRAIN APP — AI Assistant for OS (Phase 39)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Chat-like interface for interacting with the Brain Gateway.
 * - Sends requests to /api/brain (server-side)
 * - Supports Safe Mode (shadow/assist)
 * - Never exposes API keys client-side
 * 
 * @module components/os-shell/apps/brain/BrainApp
 * @version 1.0.0 (Phase 39)
 */

'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import '@/styles/nexus-tokens.css';
import type { AppProps } from '../registry';
import { useTranslations } from '@/lib/i18n/context';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function BrainApp({ windowId, capabilityId, isFocused }: AppProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [safeMode, setSafeMode] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const t = useTranslations('os');

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Focus input when window gains focus
    useEffect(() => {
        if (isFocused) {
            inputRef.current?.focus();
        }
    }, [isFocused]);

    const sendMessage = useCallback(async () => {
        const trimmed = input.trim();
        if (!trimmed || isLoading) return;

        const userMessage: ChatMessage = {
            id: `msg-${Date.now()}`,
            role: 'user',
            content: trimmed,
            timestamp: Date.now(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/brain', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    appId: 'brain.assist',
                    correlationId: crypto.randomUUID(),
                    messages: [...messages, userMessage].map(m => ({
                        role: m.role,
                        content: m.content,
                    })),
                    shadow: safeMode,
                }),
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || `HTTP ${response.status}`);
            }

            const data = await response.json();

            const assistantMessage: ChatMessage = {
                id: data.id || `resp-${Date.now()}`,
                role: 'assistant',
                content: data.content || 'No response.',
                timestamp: Date.now(),
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (err: any) {
            setError(err.message || t('brain.error'));
        } finally {
            setIsLoading(false);
        }
    }, [input, isLoading, messages, safeMode, t]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: 'var(--nx-font-system)',
            background: 'var(--nx-surface-window)',
        }}>
            {/* Header */}
            <div style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--nx-border-divider)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--nx-surface-panel)',
            }}>
                <div style={{
                    fontSize: 'var(--nx-text-title)',
                    fontWeight: 'var(--nx-weight-semibold)',
                    color: 'var(--nx-text-primary)',
                }}>
                    🧠 {t('brain.title')}
                </div>

                {/* Safe Mode Toggle */}
                <button
                    onClick={() => setSafeMode(!safeMode)}
                    style={{
                        padding: '4px 10px',
                        fontSize: 'var(--nx-text-micro)',
                        fontWeight: 'var(--nx-weight-medium)',
                        background: safeMode
                            ? 'rgba(34, 197, 94, 0.15)'
                            : 'rgba(156, 163, 175, 0.15)',
                        color: safeMode ? '#22c55e' : '#9ca3af',
                        border: `1px solid ${safeMode ? 'rgba(34, 197, 94, 0.3)' : 'rgba(156, 163, 175, 0.3)'}`,
                        borderRadius: 'var(--nx-radius-sm)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                    }}
                    title={t('brain.safeMode')}
                >
                    {safeMode ? '🛡️' : '⚡'} {t('brain.safeMode')}
                </button>
            </div>

            {/* Messages Area */}
            <div style={{
                flex: 1,
                overflow: 'auto',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
            }}>
                {messages.length === 0 && (
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column',
                        gap: '8px',
                        color: 'var(--nx-text-tertiary)',
                    }}>
                        <span style={{ fontSize: 48 }}>🧠</span>
                        <span style={{ fontSize: 'var(--nx-text-body)' }}>
                            {t('brain.placeholder')}
                        </span>
                    </div>
                )}

                {messages.map(msg => (
                    <div
                        key={msg.id}
                        style={{
                            display: 'flex',
                            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        }}
                    >
                        <div style={{
                            maxWidth: '80%',
                            padding: '10px 14px',
                            borderRadius: msg.role === 'user'
                                ? '16px 16px 4px 16px'
                                : '16px 16px 16px 4px',
                            background: msg.role === 'user'
                                ? 'var(--nx-accent-blue, #3b82f6)'
                                : 'var(--nx-surface-panel)',
                            color: msg.role === 'user'
                                ? '#ffffff'
                                : 'var(--nx-text-primary)',
                            fontSize: 'var(--nx-text-body)',
                            lineHeight: 1.5,
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                        }}>
                            {msg.content}
                        </div>
                    </div>
                ))}

                {/* Loading Indicator */}
                {isLoading && (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'flex-start',
                    }}>
                        <div style={{
                            padding: '10px 14px',
                            borderRadius: '16px 16px 16px 4px',
                            background: 'var(--nx-surface-panel)',
                            color: 'var(--nx-text-tertiary)',
                            fontSize: 'var(--nx-text-body)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                        }}>
                            <span className="brain-loading-dots">●●●</span>
                            {t('brain.thinking')}
                        </div>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div style={{
                        padding: '8px 12px',
                        borderRadius: 'var(--nx-radius-sm)',
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#ef4444',
                        fontSize: 'var(--nx-text-micro)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                    }}>
                        ⚠️ {error}
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div style={{
                padding: '12px 16px',
                borderTop: '1px solid var(--nx-border-divider)',
                display: 'flex',
                gap: '8px',
                alignItems: 'flex-end',
                background: 'var(--nx-surface-panel)',
            }}>
                <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t('brain.placeholder')}
                    rows={1}
                    style={{
                        flex: 1,
                        padding: '10px 14px',
                        border: '1px solid var(--nx-border-divider)',
                        borderRadius: 'var(--nx-radius-md)',
                        background: 'var(--nx-surface-window)',
                        color: 'var(--nx-text-primary)',
                        fontSize: 'var(--nx-text-body)',
                        fontFamily: 'var(--nx-font-system)',
                        resize: 'none',
                        outline: 'none',
                        maxHeight: 120,
                        lineHeight: 1.4,
                    }}
                    disabled={isLoading}
                />
                <button
                    onClick={sendMessage}
                    disabled={!input.trim() || isLoading}
                    style={{
                        padding: '10px 18px',
                        background: input.trim() && !isLoading
                            ? 'var(--nx-accent-blue, #3b82f6)'
                            : 'rgba(156, 163, 175, 0.3)',
                        color: input.trim() && !isLoading ? '#ffffff' : '#9ca3af',
                        border: 'none',
                        borderRadius: 'var(--nx-radius-md)',
                        fontSize: 'var(--nx-text-body)',
                        fontWeight: 'var(--nx-weight-medium)',
                        cursor: input.trim() && !isLoading ? 'pointer' : 'default',
                        transition: 'all 0.15s ease',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {t('brain.send')}
                </button>
            </div>
        </div>
    );
}
