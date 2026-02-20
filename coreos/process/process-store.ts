/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PROCESS STORE (Phase 15B)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Client-side process registry using Zustand.
 * All state transitions are deterministic and emit audit-compatible logs.
 *
 * Persistence: localStorage (replayable from audit trail).
 *
 * @module coreos/process/process-store
 * @version 1.0.0 (Phase 15B)
 */

'use client';

import { create } from 'zustand';
import type {
    ProcessRecord,
    ProcessState,
    ProcessTransitionAction,
    SpawnMode,
    WakeReason,
    ProcessCaps,
} from './types';
import {
    createProcess,
    applyTransition,
    applyPriority,
    canTransition,
} from './state-machine';
import { getAppPermissionRule } from '@/coreos/vfs/permission-matrix';
import { argsHash as computeArgsHash, createHash } from '@/coreos/process/hash-utils';

// ─── Store Types ────────────────────────────────────────────────────────

export interface ProcessStoreState {
    /** All processes keyed by pid */
    processes: Record<string, ProcessRecord>;

    /** Spawn a new process */
    spawn: (
        appId: string,
        title: string,
        mode: SpawnMode,
        reason: WakeReason,
        priority?: number,
    ) => ProcessRecord;

    /** Transition a process state */
    transition: (
        pid: string,
        action: ProcessTransitionAction,
        reason: string,
    ) => ProcessRecord | null;

    /** Change process priority */
    setPriority: (pid: string, priority: number, reason: string) => ProcessRecord | null;

    /** Get process by pid */
    getByPid: (pid: string) => ProcessRecord | undefined;

    /** Get all processes for an app */
    getByAppId: (appId: string) => ProcessRecord[];

    /** Get active (non-terminated) process for an app */
    getActiveByAppId: (appId: string) => ProcessRecord | undefined;

    /** Get all processes as array */
    listAll: () => ProcessRecord[];

    /** Handle focus change — backgrounds old app, foregrounds new app */
    handleFocusChange: (newFocusAppId: string | null) => void;

    /** Auto-spawn process when window opens (if not already running) */
    ensureProcess: (appId: string, title: string) => ProcessRecord;

    /** Terminate process when window closes */
    terminateByAppId: (appId: string, reason: string) => void;
}

// ─── Persistence Helpers ────────────────────────────────────────────────

const STORAGE_KEY = 'coreos_process_registry';

function saveToStorage(processes: Record<string, ProcessRecord>): void {
    try {
        const active = Object.fromEntries(
            Object.entries(processes).filter(([, p]) => p.state !== 'TERMINATED'),
        );
        localStorage.setItem(STORAGE_KEY, JSON.stringify(active));
    } catch {
        // Non-blocking
    }
}

function loadFromStorage(): Record<string, ProcessRecord> {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return {};
        return JSON.parse(raw);
    } catch {
        return {};
    }
}

// ─── Audit Logger ───────────────────────────────────────────────────────

function emitProcessAudit(
    event: string,
    data: Record<string, unknown>,
): void {
    console.info(`[Process:Audit] ${event}`, JSON.stringify({
        ...data,
        timestamp: Date.now(),
    }));
}

// ─── Store ──────────────────────────────────────────────────────────────

export const useProcessStore = create<ProcessStoreState>((set, get) => ({
    processes: loadFromStorage(),

    spawn: (appId, title, mode, reason, priority = 50) => {
        const rule = getAppPermissionRule(appId);
        const caps: ProcessCaps = {
            vfsSchemesAllowed: [...rule.allowedSchemes],
        };
        // Sync placeholder — immediately replaced by async SHA-256
        const syncHash = createHash(`spawn:${appId}:${title}:${mode}:${priority}`);
        const now = new Date().toISOString();

        const proc = createProcess(appId, title, mode, priority, caps, syncHash, now);

        emitProcessAudit('process.lifecycle.spawned', {
            pid: proc.pid,
            appId,
            mode,
            reason,
            state: proc.state,
            argsHash: syncHash,
        });

        set(state => {
            const next = { ...state.processes, [proc.pid]: proc };
            saveToStorage(next);
            return { processes: next };
        });

        // Async SHA-256 upgrade (fire-and-forget)
        computeArgsHash({ appId, title, mode, priority }).then(sha256 => {
            set(state => {
                const existing = state.processes[proc.pid];
                if (!existing || existing.state === 'TERMINATED') return state;
                const upgraded = {
                    ...existing,
                    integrity: { ...existing.integrity, argsHash: sha256 },
                };
                const next = { ...state.processes, [proc.pid]: upgraded };
                saveToStorage(next);
                return { processes: next };
            });
        }).catch(() => {
            // Non-blocking — sync hash remains as fallback
        });

        return proc;
    },

    transition: (pid, action, reason) => {
        const proc = get().processes[pid];
        if (!proc) return null;

        const check = canTransition(proc.state, action);
        if (!check.valid) {
            emitProcessAudit('process.lifecycle.transition_denied', {
                pid,
                action,
                fromState: proc.state,
                reason: check.reason,
            });
            return null;
        }

        const now = new Date().toISOString();
        const updated = applyTransition(proc, action, reason, now);

        emitProcessAudit('process.lifecycle.transition', {
            pid,
            action,
            from: proc.state,
            to: updated.state,
            reason,
        });

        set(state => {
            const next = { ...state.processes, [pid]: updated };
            saveToStorage(next);
            return { processes: next };
        });

        return updated;
    },

    setPriority: (pid, priority, reason) => {
        const proc = get().processes[pid];
        if (!proc) return null;

        try {
            const now = new Date().toISOString();
            const updated = applyPriority(proc, priority, now);

            emitProcessAudit('process.lifecycle.priority', {
                pid,
                from: proc.priority,
                to: updated.priority,
                reason,
            });

            set(state => {
                const next = { ...state.processes, [pid]: updated };
                saveToStorage(next);
                return { processes: next };
            });

            return updated;
        } catch {
            return null;
        }
    },

    getByPid: (pid) => get().processes[pid],

    getByAppId: (appId) =>
        Object.values(get().processes).filter(p => p.appId === appId),

    getActiveByAppId: (appId) =>
        Object.values(get().processes).find(
            p => p.appId === appId && p.state !== 'TERMINATED',
        ),

    listAll: () => Object.values(get().processes),

    handleFocusChange: (newFocusAppId) => {
        const allActive = Object.values(get().processes).filter(
            p => p.state === 'RUNNING' || p.state === 'BACKGROUND',
        );

        for (const proc of allActive) {
            if (proc.appId === newFocusAppId) {
                // Focus gained → ensure RUNNING
                if (proc.state !== 'RUNNING') {
                    get().transition(proc.pid, 'resume', 'focus_gained');
                }
            } else {
                // Focus lost → BACKGROUND
                if (proc.state === 'RUNNING') {
                    get().transition(proc.pid, 'background', 'focus_lost');
                }
            }
        }
    },

    ensureProcess: (appId, title) => {
        const existing = get().getActiveByAppId(appId);
        if (existing) return existing;
        return get().spawn(appId, title, 'foreground', 'user');
    },

    terminateByAppId: (appId, reason) => {
        const active = get().getActiveByAppId(appId);
        if (active) {
            get().transition(active.pid, 'terminate', reason);
        }
    },
}));
