/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NOTIFICATION SINK — Bus → Notification Center (Phase 18.5)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Subscribes to OS Event Bus events and creates notifications
 * through the Notification Store. Replaces direct emitter calls.
 *
 * Anti-loop: This sink NEVER publishes back to the bus.
 *
 * @module coreos/notifications/sinks/notificationSink
 */

import { subscribe } from '@/coreos/events/bus';
import { useNotificationStore } from '@/coreos/notifications/store';
import type { OSEventEnvelope } from '@/coreos/events/types';
import type { CreateNotificationInput, NotificationSeverity } from '@/coreos/notifications/types';

// ─── Event → Notification Mapping ──────────────────────────────────────

const EVENT_MAP: Record<string, {
    titleFn: (e: OSEventEnvelope) => string;
    bodyFn?: (e: OSEventEnvelope) => string | undefined;
    severity: NotificationSeverity;
    domain: 'os' | 'app' | 'system';
}> = {
    'process.spawned': {
        titleFn: (e) => `${e.payload.title || e.source.appId} opened`,
        severity: 'info',
        domain: 'os',
    },
    'process.terminated': {
        titleFn: (e) => `${e.payload.title || e.source.appId} closed`,
        severity: 'info',
        domain: 'os',
    },
    'process.suspended': {
        titleFn: (e) => `${e.payload.title || e.source.appId} suspended`,
        severity: 'warning',
        domain: 'os',
    },
    'offline.entered': {
        titleFn: () => 'You are offline',
        bodyFn: () => 'Some features may be unavailable until connection is restored.',
        severity: 'warning',
        domain: 'system',
    },
    'offline.exited': {
        titleFn: () => 'Back online',
        bodyFn: () => 'Connection restored.',
        severity: 'info',
        domain: 'system',
    },
};

// ─── Handler ───────────────────────────────────────────────────────────

function handleEvent(event: OSEventEnvelope): void {
    const mapping = EVENT_MAP[event.type];
    if (!mapping) return;

    const input: CreateNotificationInput = {
        severity: mapping.severity,
        source: {
            appId: event.source.appId || 'system.os',
            domain: mapping.domain,
        },
        title: mapping.titleFn(event),
        body: mapping.bodyFn?.(event),
        meta: {
            pid: event.payload.pid as string | undefined,
            capabilityId: event.payload.appId as string | undefined,
            traceId: event.id,
        },
    };

    useNotificationStore.getState().create(input);
}

// ─── Init ──────────────────────────────────────────────────────────────

/**
 * Initialize the notification sink.
 * Subscribes to process.* and offline.* events from the bus
 * and creates notifications in the store.
 */
export function initNotificationSink(): () => void {
    const unsub1 = subscribe('process.*', handleEvent);
    const unsub2 = subscribe('offline.*', handleEvent);

    console.log('[EventBus:NotificationSink] Initialized');

    return () => {
        unsub1();
        unsub2();
        console.log('[EventBus:NotificationSink] Destroyed');
    };
}
