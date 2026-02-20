/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PROCESS MODEL — Types (Phase 15B)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Deterministic logical process model for Core OS multitasking.
 * Processes are governance-bound: every state change emits audit + ledger.
 *
 * NON-GOALS (MVP):
 * - No real CPU/memory metrics
 * - No WebWorker isolation (Phase 15B+)
 * - No cross-device sync (local-only)
 *
 * @module coreos/process/types
 * @version 1.0.0 (Phase 15B)
 */

// ─── Process States ─────────────────────────────────────────────────────

export type ProcessState = 'RUNNING' | 'BACKGROUND' | 'SUSPENDED' | 'TERMINATED';

// ─── Transition Actions ─────────────────────────────────────────────────

export type ProcessTransitionAction = 'background' | 'resume' | 'suspend' | 'terminate';

// ─── Wake Reasons ───────────────────────────────────────────────────────

export type WakeReason = 'user' | 'system' | 'schedule' | 'resume';

// ─── Spawn Modes ────────────────────────────────────────────────────────

export type SpawnMode = 'foreground' | 'background';

// ─── Process Record ─────────────────────────────────────────────────────

export interface ProcessTransitionLog {
    readonly from: ProcessState;
    readonly to: ProcessState;
    readonly action: ProcessTransitionAction;
    readonly reason: string;
    readonly ts: string; // ISO
}

export interface ProcessCaps {
    readonly vfsSchemesAllowed: readonly string[];
}

export interface ProcessIntegrity {
    readonly argsHash: string;
    readonly decisionId?: string;
    readonly ledgerHash?: string;
}

export interface ProcessRecord {
    readonly pid: string;
    readonly appId: string;
    readonly title: string;
    readonly state: ProcessState;
    readonly priority: number; // 0–100
    readonly createdAt: string; // ISO
    readonly updatedAt: string; // ISO
    readonly lastTransition: ProcessTransitionLog | null;
    readonly wakeReason: WakeReason;
    readonly caps: ProcessCaps;
    readonly integrity: ProcessIntegrity;
}

// ─── Valid Transitions (Deterministic State Machine) ─────────────────────

/**
 * VALID_TRANSITIONS defines which actions are allowed from each state.
 * This is the SINGLE SOURCE OF TRUTH for the state machine.
 *
 * State Machine:
 *   RUNNING    → background, suspend, terminate
 *   BACKGROUND → resume, suspend, terminate
 *   SUSPENDED  → resume, terminate
 *   TERMINATED → (none — terminal state)
 */
export const VALID_TRANSITIONS: Record<ProcessState, Partial<Record<ProcessTransitionAction, ProcessState>>> = {
    RUNNING: {
        background: 'BACKGROUND',
        suspend: 'SUSPENDED',
        terminate: 'TERMINATED',
    },
    BACKGROUND: {
        resume: 'RUNNING',
        suspend: 'SUSPENDED',
        terminate: 'TERMINATED',
    },
    SUSPENDED: {
        resume: 'RUNNING',
        terminate: 'TERMINATED',
    },
    TERMINATED: {
        // Terminal state — no valid transitions
    },
};

// ─── API Request/Response Types ─────────────────────────────────────────

export interface SpawnRequest {
    appId: string;
    title?: string;
    reason: WakeReason;
    mode: SpawnMode;
    priority?: number;
}

export interface TransitionRequest {
    pid: string;
    action: ProcessTransitionAction;
    reason: string;
}

export interface PriorityRequest {
    pid: string;
    priority: number;
    reason: string;
}
