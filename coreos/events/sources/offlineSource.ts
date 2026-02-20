/**
 * ═══════════════════════════════════════════════════════════════════════════
 * OS EVENT BUS — Offline Source (Phase 18.5)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Listens to browser online/offline events and publishes
 * offline.entered / offline.exited to the OS Event Bus.
 *
 * @module coreos/events/sources/offlineSource
 */

import { publish } from '../bus';

// ─── Handlers ──────────────────────────────────────────────────────────

let _handleOffline: (() => void) | null = null;
let _handleOnline: (() => void) | null = null;

// ─── Init ──────────────────────────────────────────────────────────────

/**
 * Initialize the offline event source.
 * Listens to window online/offline events.
 */
export function initOfflineSource(): () => void {
    if (typeof window === 'undefined') {
        return () => { }; // SSR guard
    }

    _handleOffline = () => {
        publish({
            type: 'offline.entered',
            domain: 'offline',
            source: { module: 'offline-kernel' },
            severity: 'warning',
            dedupeKey: 'offline.entered',
            payload: { timestamp: new Date().toISOString() },
        });
    };

    _handleOnline = () => {
        publish({
            type: 'offline.exited',
            domain: 'offline',
            source: { module: 'offline-kernel' },
            severity: 'info',
            dedupeKey: 'offline.exited',
            payload: { timestamp: new Date().toISOString() },
        });
    };

    window.addEventListener('offline', _handleOffline);
    window.addEventListener('online', _handleOnline);

    console.log('[EventBus:OfflineSource] Initialized');

    return () => {
        if (_handleOffline) window.removeEventListener('offline', _handleOffline);
        if (_handleOnline) window.removeEventListener('online', _handleOnline);
        _handleOffline = null;
        _handleOnline = null;
        console.log('[EventBus:OfflineSource] Destroyed');
    };
}
