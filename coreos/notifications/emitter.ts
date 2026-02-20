/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NOTIFICATION CENTER — Event Emitter (Phase 18)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Thin emitter that hooks into existing OS subsystems and creates
 * notifications through the store. No timer-based or random notifications.
 *
 * Sources:
 * - Process lifecycle (Phase 15B): spawn, terminate, suspend
 * - Offline kernel: online/offline transitions
 *
 * @module coreos/notifications/emitter
 */

import { useNotificationStore } from './store';
import type { CreateNotificationInput } from './types';

// ─── Emit Helper ───────────────────────────────────────────────────────

function emit(input: CreateNotificationInput): void {
    useNotificationStore.getState().create(input);
}

// ─── Process Lifecycle Events ──────────────────────────────────────────

export function emitProcessSpawned(appId: string, title: string, pid: string): void {
    emit({
        severity: 'info',
        source: { appId, domain: 'os' },
        title: `${title} opened`,
        meta: { pid, capabilityId: appId },
    });
}

export function emitProcessTerminated(appId: string, title: string, pid: string): void {
    emit({
        severity: 'info',
        source: { appId, domain: 'os' },
        title: `${title} closed`,
        meta: { pid, capabilityId: appId },
    });
}

export function emitProcessSuspended(appId: string, title: string, pid: string): void {
    emit({
        severity: 'warning',
        source: { appId, domain: 'os' },
        title: `${title} suspended`,
        meta: { pid, capabilityId: appId },
    });
}

// ─── Offline Kernel Events ─────────────────────────────────────────────

export function emitOffline(): void {
    emit({
        severity: 'warning',
        source: { appId: 'system.kernel', domain: 'system' },
        title: 'You are offline',
        body: 'Some features may be unavailable until connection is restored.',
    });
}

export function emitOnline(): void {
    emit({
        severity: 'info',
        source: { appId: 'system.kernel', domain: 'system' },
        title: 'Back online',
        body: 'Connection restored.',
    });
}

// ─── System Events ─────────────────────────────────────────────────────

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
