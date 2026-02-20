/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PROCESS STATE MACHINE (Phase 15B)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Pure, deterministic functions for process state transitions.
 * Same inputs → same output. No randomness, no side effects.
 *
 * @module coreos/process/state-machine
 * @version 1.0.0 (Phase 15B)
 */

import type {
    ProcessState,
    ProcessTransitionAction,
    ProcessRecord,
    WakeReason,
    SpawnMode,
    ProcessCaps,
} from './types';
import { VALID_TRANSITIONS } from './types';

// ─── Transition Validation ──────────────────────────────────────────────

export interface TransitionResult {
    valid: boolean;
    toState?: ProcessState;
    reason?: string;
}

/**
 * Check if a transition is valid from the current state.
 * Pure function — no side effects.
 */
export function canTransition(
    fromState: ProcessState,
    action: ProcessTransitionAction,
): TransitionResult {
    const transitions = VALID_TRANSITIONS[fromState];
    const toState = transitions[action];

    if (!toState) {
        return {
            valid: false,
            reason: `Cannot '${action}' from state '${fromState}'`,
        };
    }

    return { valid: true, toState };
}

// ─── Apply Transition ───────────────────────────────────────────────────

/**
 * Apply a transition to a process record.
 * Returns a NEW record (immutable). Pure function.
 *
 * @throws Error if transition is invalid (caller should validate first)
 */
export function applyTransition(
    record: ProcessRecord,
    action: ProcessTransitionAction,
    reason: string,
    now: string = new Date().toISOString(),
): ProcessRecord {
    const result = canTransition(record.state, action);

    if (!result.valid || !result.toState) {
        throw new Error(`INVALID_TRANSITION: ${result.reason}`);
    }

    const wakeReason: WakeReason =
        action === 'resume' ? 'resume' :
            record.wakeReason;

    return {
        ...record,
        state: result.toState,
        updatedAt: now,
        wakeReason,
        lastTransition: {
            from: record.state,
            to: result.toState,
            action,
            reason,
            ts: now,
        },
    };
}

// ─── Priority ───────────────────────────────────────────────────────────

/**
 * Clamp priority to valid range [0, 100].
 * Deterministic: always returns integer in range.
 */
export function clampPriority(value: number): number {
    return Math.max(0, Math.min(100, Math.round(value)));
}

/**
 * Apply priority change to a process record.
 * Returns a NEW record (immutable). Pure function.
 */
export function applyPriority(
    record: ProcessRecord,
    priority: number,
    now: string = new Date().toISOString(),
): ProcessRecord {
    if (record.state === 'TERMINATED') {
        throw new Error('INVALID_OPERATION: Cannot change priority of TERMINATED process');
    }

    return {
        ...record,
        priority: clampPriority(priority),
        updatedAt: now,
    };
}

// ─── Process Creation ───────────────────────────────────────────────────

let pidCounter = 0;

/**
 * Generate a deterministic process ID.
 * Format: proc-{timestamp}-{counter}
 *
 * Note: For MVP, this is good enough. ULID can replace later.
 */
export function generatePid(now: number = Date.now()): string {
    pidCounter++;
    const ts = now.toString(36);
    const seq = pidCounter.toString(36).padStart(4, '0');
    return `proc-${ts}-${seq}`;
}

/**
 * Reset pid counter (for testing only).
 */
export function resetPidCounter(): void {
    pidCounter = 0;
}

/**
 * Create a new ProcessRecord.
 * Pure function except for pid generation (uses counter).
 */
export function createProcess(
    appId: string,
    title: string,
    mode: SpawnMode,
    priority: number,
    caps: ProcessCaps,
    argsHash: string,
    now: string = new Date().toISOString(),
): ProcessRecord {
    const initialState: ProcessState = mode === 'foreground' ? 'RUNNING' : 'BACKGROUND';

    return {
        pid: generatePid(Date.parse(now) || Date.now()),
        appId,
        title,
        state: initialState,
        priority: clampPriority(priority),
        createdAt: now,
        updatedAt: now,
        lastTransition: null,
        wakeReason: 'user',
        caps,
        integrity: {
            argsHash,
        },
    };
}
