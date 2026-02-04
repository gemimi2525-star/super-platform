'use client';

/**
 * NEXUS Shell — Service Worker Registration (Phase 7.2)
 * 
 * Registers the service worker for offline shell resilience.
 * Client-side only, runs on mount.
 */

import { useEffect } from 'react';

export function ServiceWorkerRegistration() {
    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            // Register SW on window load for better performance
            window.addEventListener('load', () => {
                navigator.serviceWorker
                    .register('/sw.js')
                    .then((registration) => {
                        console.log('[NEXUS] SW registered:', registration.scope);
                    })
                    .catch((error) => {
                        console.error('[NEXUS] SW registration failed:', error);
                    });
            });
        }
    }, []);

    // This component renders nothing
    return null;
}
