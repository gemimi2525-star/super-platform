/**
 * ═══════════════════════════════════════════════════════════════════════════
 * OS SHELL — Intent Browser App
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Internal browser for viewing resources via intent-based navigation.
 * Only allows internal URLs - no external navigation authority.
 * 
 * Phase 9: Core App
 * 
 * @module components/os-shell/apps/browser/IntentBrowserApp
 * @version 1.0.0
 */

'use client';

import React, { useState, useCallback } from 'react';
import '@/styles/nexus-tokens.css';
import type { AppProps } from '../registry';

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const ABOUT_BLANK = 'about:blank';
const ABOUT_NEW_TAB = 'about:newtab';

/**
 * Check if URL is allowed (internal only)
 */
function isAllowedUrl(url: string): boolean {
    if (!url) return false;

    // Allow about: pages
    if (url.startsWith('about:')) return true;

    // Allow internal paths
    if (url.startsWith('/')) return true;

    // Allow same-origin URLs
    if (typeof window !== 'undefined') {
        try {
            const parsed = new URL(url, window.location.origin);
            return parsed.origin === window.location.origin;
        } catch {
            return false;
        }
    }

    return false;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function IntentBrowserApp({ windowId, capabilityId, isFocused }: AppProps) {
    const [url, setUrl] = useState(ABOUT_NEW_TAB);
    const [inputValue, setInputValue] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const navigate = useCallback((targetUrl: string) => {
        if (!isAllowedUrl(targetUrl)) {
            setError('External URLs are not allowed');
            return;
        }

        setError(null);
        setLoading(true);
        setUrl(targetUrl);

        // Simulate navigation delay
        setTimeout(() => setLoading(false), 300);
    }, []);

    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = inputValue.trim();
        if (trimmed) {
            navigate(trimmed);
        }
    }, [inputValue, navigate]);

    const handleGoHome = useCallback(() => {
        setInputValue('/');
        navigate('/');
    }, [navigate]);

    const handleGoBack = useCallback(() => {
        // In a real implementation, we'd have history
        navigate(ABOUT_NEW_TAB);
    }, [navigate]);

    return (
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--nx-surface-window)',
            color: 'var(--nx-text-primary)',
            fontFamily: 'var(--nx-font-system)',
        }}>
            {/* Address Bar */}
            <div style={{
                height: 48,
                borderBottom: '1px solid var(--nx-border-divider)',
                display: 'flex',
                alignItems: 'center',
                padding: '0 var(--nx-space-3)',
                gap: 'var(--nx-space-2)',
                background: 'var(--nx-surface-panel)',
            }}>
                {/* Navigation Buttons */}
                <button
                    onClick={handleGoBack}
                    style={{
                        width: 28,
                        height: 28,
                        border: 'none',
                        borderRadius: 'var(--nx-radius-sm)',
                        background: 'transparent',
                        cursor: 'pointer',
                        fontSize: 'var(--nx-text-section)',
                        color: 'var(--nx-text-secondary)',
                    }}
                    title="Back"
                >
                    ←
                </button>

                <button
                    onClick={handleGoHome}
                    style={{
                        width: 28,
                        height: 28,
                        border: 'none',
                        borderRadius: 'var(--nx-radius-sm)',
                        background: 'transparent',
                        cursor: 'pointer',
                        fontSize: 'var(--nx-text-section)',
                        color: 'var(--nx-text-secondary)',
                    }}
                    title="Home"
                >
                    🏠
                </button>

                {/* URL Input */}
                <form onSubmit={handleSubmit} style={{ flex: 1 }}>
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Enter internal URL..."
                        style={{
                            width: '100%',
                            padding: 'var(--nx-space-2) var(--nx-space-3)',
                            border: '1px solid var(--nx-border-default)',
                            borderRadius: 'var(--nx-radius-md)',
                            background: 'var(--nx-surface-window)',
                            fontSize: 'var(--nx-text-body)',
                            fontFamily: 'var(--nx-font-system)',
                            color: 'var(--nx-text-primary)',
                            outline: 'none',
                        }}
                    />
                </form>

                {/* Refresh Button */}
                <button
                    onClick={() => navigate(url)}
                    style={{
                        width: 28,
                        height: 28,
                        border: 'none',
                        borderRadius: 'var(--nx-radius-sm)',
                        background: 'transparent',
                        cursor: 'pointer',
                        fontSize: 'var(--nx-text-section)',
                        color: 'var(--nx-text-secondary)',
                    }}
                    title="Refresh"
                >
                    ↻
                </button>
            </div>

            {/* Content Area */}
            <div style={{
                flex: 1,
                overflow: 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--nx-surface-window)',
            }}>
                {error && (
                    <div style={{
                        textAlign: 'center',
                        color: 'var(--nx-danger)',
                        padding: 'var(--nx-space-4)',
                    }}>
                        <div style={{ fontSize: 48, marginBottom: 'var(--nx-space-3)' }}>⚠️</div>
                        <div style={{ fontSize: 'var(--nx-text-section)', fontWeight: 'var(--nx-weight-semibold)' }}>
                            Navigation Blocked
                        </div>
                        <div style={{
                            fontSize: 'var(--nx-text-body)',
                            color: 'var(--nx-text-secondary)',
                            marginTop: 'var(--nx-space-2)',
                        }}>
                            {error}
                        </div>
                    </div>
                )}

                {!error && url === ABOUT_NEW_TAB && (
                    <div style={{
                        textAlign: 'center',
                        color: 'var(--nx-text-tertiary)',
                        padding: 'var(--nx-space-4)',
                    }}>
                        <div style={{ fontSize: 64, marginBottom: 'var(--nx-space-4)', opacity: 0.5 }}>🌐</div>
                        <div style={{
                            fontSize: 'var(--nx-text-title)',
                            fontWeight: 'var(--nx-weight-semibold)',
                            color: 'var(--nx-text-primary)',
                        }}>
                            Intent Browser
                        </div>
                        <div style={{
                            fontSize: 'var(--nx-text-body)',
                            marginTop: 'var(--nx-space-2)',
                        }}>
                            Enter an internal URL to browse resources
                        </div>
                        <div style={{
                            fontSize: 'var(--nx-text-caption)',
                            marginTop: 'var(--nx-space-4)',
                            opacity: 0.7,
                        }}>
                            Only internal URLs are allowed
                        </div>
                    </div>
                )}

                {!error && url !== ABOUT_NEW_TAB && url !== ABOUT_BLANK && (
                    <iframe
                        src={url}
                        style={{
                            width: '100%',
                            height: '100%',
                            border: 'none',
                            background: '#fff',
                        }}
                        title="Intent Browser Content"
                        sandbox="allow-same-origin allow-scripts allow-forms"
                    />
                )}

                {loading && (
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 3,
                        background: 'var(--nx-accent)',
                        animation: 'nx-loading-bar 1s ease-in-out infinite',
                    }} />
                )}
            </div>
        </div>
    );
}

// Export metadata for registry
export const INTENT_BROWSER_APP_ID = 'intent.browser';
export const INTENT_BROWSER_APP_META = {
    id: INTENT_BROWSER_APP_ID,
    title: 'Browser',
    icon: '🌐',
    width: 900,
    height: 600,
};
