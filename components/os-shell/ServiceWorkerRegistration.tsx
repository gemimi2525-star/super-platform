'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NEXUS Shell — Service Worker Registration (Phase 36)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Registers the service worker and handles update lifecycle.
 * - Detects SW updates and notifies user
 * - Sends SKIP_WAITING to force-activate new SW
 * - Auto-reloads when SW takes control
 */

import { useEffect, useState, useCallback } from 'react';

interface SWStatus {
    registered: boolean;
    updateAvailable: boolean;
    offline: boolean;
}

export function ServiceWorkerRegistration() {
    const [status, setStatus] = useState<SWStatus>({
        registered: false,
        updateAvailable: false,
        offline: false,
    });

    const applyUpdate = useCallback(() => {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            // Tell waiting SW to skip waiting
            navigator.serviceWorker.ready.then((registration) => {
                if (registration.waiting) {
                    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                }
            });
        }
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
            return;
        }

        // Register on window load for better performance
        const registerSW = async () => {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('[NEXUS] SW registered:', registration.scope);
                setStatus(prev => ({ ...prev, registered: true }));

                // Check for updates periodically (every 30 minutes)
                setInterval(() => {
                    registration.update().catch(() => {
                        // Update check failed — likely offline
                    });
                }, 30 * 60 * 1000);

                // Detect update available
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    if (!newWorker) return;

                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New SW installed but old one still controlling
                            console.log('[NEXUS] SW update available');
                            setStatus(prev => ({ ...prev, updateAvailable: true }));
                        }
                    });
                });
            } catch (error) {
                console.error('[NEXUS] SW registration failed:', error);
            }
        };

        if (document.readyState === 'complete') {
            registerSW();
        } else {
            window.addEventListener('load', registerSW);
        }

        // Auto-reload when new SW takes control (with loop guard)
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            const guard = sessionStorage.getItem('sw-reload-guard');
            if (guard) {
                console.log('[NEXUS] SW controller changed but reload guard active — skipping');
                sessionStorage.removeItem('sw-reload-guard');
                return;
            }
            console.log('[NEXUS] SW controller changed, reloading...');
            sessionStorage.setItem('sw-reload-guard', '1');
            window.location.reload();
        });

        return () => {
            window.removeEventListener('load', registerSW);
        };
    }, []);

    // Show update notification when available
    if (status.updateAvailable) {
        return (
            <div
                style={{
                    position: 'fixed',
                    bottom: 80,
                    right: 16,
                    zIndex: 99998,
                    padding: '12px 20px',
                    background: 'rgba(30, 30, 50, 0.95)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.15)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
                    color: '#fff',
                    fontSize: 13,
                }}
            >
                <span>🔄 CORE OS update available</span>
                <button
                    onClick={applyUpdate}
                    style={{
                        padding: '6px 16px',
                        background: '#007AFF',
                        border: 'none',
                        borderRadius: 6,
                        color: '#fff',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                    }}
                >
                    Update Now
                </button>
            </div>
        );
    }

    return null;
}
