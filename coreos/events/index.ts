/**
 * ═══════════════════════════════════════════════════════════════════════════
 * OS EVENT BUS — Barrel Export (Phase 18.5)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Central entry point for the OS Event Bus system.
 * Initializes all sources and sinks in the correct order.
 *
 * @module coreos/events
 */

// Re-exports
export { publish, subscribe, listRecent, reset } from './bus';
export { createEventEnvelope } from './envelope';
export type {
    OSEventDomain,
    OSEventType,
    OSEventEnvelope,
    OSEventInput,
    OSEventHandler,
    OSEventFilter,
    OSEventSeverity,
    OSEventActor,
    OSEventSource,
} from './types';

// ─── Sources & Sinks ───────────────────────────────────────────────────

import { initProcessSource } from './sources/processSource';
import { initOfflineSource } from './sources/offlineSource';
import { initNotificationSink } from '@/coreos/notifications/sinks/notificationSink';

// ─── Singleton Guard ───────────────────────────────────────────────────

let _initialized = false;
let _cleanups: Array<() => void> = [];

// ─── Init ──────────────────────────────────────────────────────────────

/**
 * Initialize the OS Event Bus with all sources and sinks.
 * Call once on app mount (client-side only).
 *
 * Order matters:
 * 1. Sinks first (so they're listening when sources start publishing)
 * 2. Sources second (begin emitting events)
 */
export function initEventBus(): () => void {
    if (_initialized) {
        console.warn('[EventBus] Already initialized — skipping');
        return () => { };
    }

    if (typeof window === 'undefined') {
        return () => { }; // SSR guard
    }

    console.log('[EventBus] Initializing Phase 18.5 OS Event Bus...');

    // 1. Initialize sinks first
    _cleanups.push(initNotificationSink());

    // 2. Initialize sources
    _cleanups.push(initProcessSource());
    _cleanups.push(initOfflineSource());

    _initialized = true;
    console.log('[EventBus] ✅ Initialized (sources: 2, sinks: 1)');

    return () => {
        for (const cleanup of _cleanups) {
            cleanup();
        }
        _cleanups = [];
        _initialized = false;
        console.log('[EventBus] Destroyed');
    };
}
