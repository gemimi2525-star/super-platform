/**
 * ═══════════════════════════════════════════════════════════════════════════
 * OS EVENT BUS — Process Source (Phase 18.5)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Subscribes to useProcessStore state changes and publishes
 * process lifecycle events to the OS Event Bus.
 *
 * Does NOT modify process-store logic (Phase 15B frozen).
 *
 * @module coreos/events/sources/processSource
 */

import { useProcessStore } from '@/coreos/process/process-store';
import type { ProcessState } from '@/coreos/process/types';
import { publish } from '../bus';
import type { OSEventInput } from '../types';

// ─── Track Previous State ──────────────────────────────────────────────

interface TrackedProcess {
    pid: string;
    appId: string;
    title: string;
    state: ProcessState;
}

let _prevSnapshot: Record<string, TrackedProcess> = {};
let _unsubscribe: (() => void) | null = null;

// ─── Diff & Publish ────────────────────────────────────────────────────

function diffAndPublish(
    next: Record<string, { pid: string; appId: string; title: string; state: ProcessState }>,
): void {
    for (const [pid, proc] of Object.entries(next)) {
        const prev = _prevSnapshot[pid];

        // New process — spawned
        if (!prev) {
            publishProcessEvent('process.spawned', proc, 'info');
            continue;
        }

        // State change
        if (prev.state !== proc.state) {
            if (proc.state === 'TERMINATED') {
                publishProcessEvent('process.terminated', proc, 'info');
            } else if (proc.state === 'SUSPENDED') {
                publishProcessEvent('process.suspended', proc, 'warning');
            }
            // RUNNING (resume) — no event for now
        }
    }

    // Capture new snapshot
    _prevSnapshot = {};
    for (const [pid, proc] of Object.entries(next)) {
        _prevSnapshot[pid] = {
            pid: proc.pid,
            appId: proc.appId,
            title: proc.title,
            state: proc.state,
        };
    }
}

function publishProcessEvent(
    type: 'process.spawned' | 'process.terminated' | 'process.suspended',
    proc: { pid: string; appId: string; title: string; state: ProcessState },
    severity: 'info' | 'warning',
): void {
    const input: OSEventInput = {
        type,
        domain: 'process',
        source: { appId: proc.appId, module: 'process-store' },
        severity,
        dedupeKey: `${type}:${proc.appId}:${proc.pid}`,
        payload: {
            pid: proc.pid,
            appId: proc.appId,
            title: proc.title,
            state: proc.state,
        },
    };
    publish(input);
}

// ─── Init ──────────────────────────────────────────────────────────────

/**
 * Initialize the process event source.
 * Subscribes to Zustand process-store and publishes lifecycle events.
 */
export function initProcessSource(): () => void {
    // Take initial snapshot (don't emit for existing processes)
    const initial = useProcessStore.getState().processes;
    _prevSnapshot = {};
    for (const [pid, proc] of Object.entries(initial)) {
        _prevSnapshot[pid] = {
            pid: proc.pid,
            appId: proc.appId,
            title: proc.title,
            state: proc.state,
        };
    }

    // Subscribe to store changes
    _unsubscribe = useProcessStore.subscribe((state) => {
        diffAndPublish(state.processes);
    });

    console.log('[EventBus:ProcessSource] Initialized');

    return () => {
        _unsubscribe?.();
        _unsubscribe = null;
        _prevSnapshot = {};
        console.log('[EventBus:ProcessSource] Destroyed');
    };
}
