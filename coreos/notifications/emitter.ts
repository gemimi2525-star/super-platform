/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NOTIFICATION CENTER — Event Emitter (Phase 18)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * @deprecated Phase 18.5 — Replaced by OS Event Bus.
 * Use `coreos/events/bus.ts` for publishing events.
 * Notification creation is now handled by `coreos/notifications/sinks/notificationSink.ts`.
 *
 * This file is kept for backward compatibility only.
 * No files import from this module (verified Phase 18.5).
 *
 * @module coreos/notifications/emitter
 */

import { useNotificationStore } from './store';
import type { CreateNotificationInput } from './types';

// ─── Emit Helper ───────────────────────────────────────────────────────

/** @deprecated Use OS Event Bus publish() instead */
function emit(input: CreateNotificationInput): void {
    useNotificationStore.getState().create(input);
}

// ─── Process Lifecycle Events ──────────────────────────────────────────

/** @deprecated Use OS Event Bus processSource instead */
export function emitProcessSpawned(appId: string, title: string, pid: string): void {
    emit({
        severity: 'info',
        source: { appId, domain: 'os' },
        title: `${title} opened`,
        meta: { pid, capabilityId: appId },
    });
}

/** @deprecated Use OS Event Bus processSource instead */
export function emitProcessTerminated(appId: string, title: string, pid: string): void {
    emit({
        severity: 'info',
        source: { appId, domain: 'os' },
        title: `${title} closed`,
        meta: { pid, capabilityId: appId },
    });
}

/** @deprecated Use OS Event Bus processSource instead */
export function emitProcessSuspended(appId: string, title: string, pid: string): void {
    emit({
        severity: 'warning',
        source: { appId, domain: 'os' },
        title: `${title} suspended`,
        meta: { pid, capabilityId: appId },
    });
}

// ─── Offline Kernel Events ─────────────────────────────────────────────

/** @deprecated Use OS Event Bus offlineSource instead */
export function emitOffline(): void {
    emit({
        severity: 'warning',
        source: { appId: 'system.kernel', domain: 'system' },
        title: 'You are offline',
        body: 'Some features may be unavailable until connection is restored.',
    });
}

/** @deprecated Use OS Event Bus offlineSource instead */
export function emitOnline(): void {
    emit({
        severity: 'info',
        source: { appId: 'system.kernel', domain: 'system' },
        title: 'Back online',
        body: 'Connection restored.',
    });
}

// ─── System Events ─────────────────────────────────────────────────────

/** @deprecated Use OS Event Bus publish() instead */
export function emitSystemNotification(
    title: string,
    body?: string,
    severity: 'info' | 'warning' | 'error' = 'info',
): void {
    emit({
        severity,
        source: { appId: 'system.os', domain: 'system' },
        title,
        body,
    });
}
