/**
 * Phase 15B.2: Process v2 Types
 * 
 * Extended types for suspend/resume/priority intents.
 * DOES NOT modify frozen lib/process/types.ts
 */

// ═══════════════════════════════════════════════════════════════════════════
// Priority System
// ═══════════════════════════════════════════════════════════════════════════

export type ProcessPriority = 'low' | 'normal' | 'high' | 'realtime';

export const PRIORITY_LEVELS: Record<ProcessPriority, number> = {
    low: 1,
    normal: 5,
    high: 10,
    realtime: 100,
};

// ═══════════════════════════════════════════════════════════════════════════
// Extended Process State
// ═══════════════════════════════════════════════════════════════════════════

export type ProcessStateV2 = 'RUNNING' | 'SUSPENDED' | 'TERMINATED' | 'CRASHED';

export interface ProcessDescriptorV2 {
    pid: string;
    appId: string;
    state: ProcessStateV2;
    startedAt: number;
    windowId?: string;
    ownerId?: string;
    cpuTime?: number;
    memoryMB?: number;
    lastHeartbeat?: number;
    exitCode?: number;
    crashReason?: string;
    // V2 Extensions
    priority: ProcessPriority;
    suspendedAt?: number;
    suspendReason?: string;
    resumeCount: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// Intent Types
// ═══════════════════════════════════════════════════════════════════════════

export type ProcessActionV2 =
    | 'os.process.spawn'
    | 'os.process.terminate'
    | 'os.process.forceQuit'
    | 'os.process.suspend'
    | 'os.process.resume'
    | 'os.process.setPriority'
    | 'os.process.list';

export interface ProcessIntentV2 {
    action: ProcessActionV2;
    pid?: string;
    options?: SuspendOptions | ResumeOptions | PriorityOptions | SpawnOptionsV2;
}

export interface SuspendOptions {
    reason?: string;
}

export interface ResumeOptions {
    // Reserved for future use
}

export interface PriorityOptions {
    priority: ProcessPriority;
}

export interface SpawnOptionsV2 {
    appId: string;
    entryPoint: string;
    windowId?: string;
    args?: unknown;
    priority?: ProcessPriority;
}

// ═══════════════════════════════════════════════════════════════════════════
// Intent Results
// ═══════════════════════════════════════════════════════════════════════════

export interface ProcessIntentResultV2 {
    success: boolean;
    action: ProcessActionV2;
    pid?: string;
    decision?: {
        outcome: 'ALLOW' | 'DENY';
        reason?: string;
    };
    opId?: string;
    traceId?: string;
    previousState?: ProcessStateV2;
    newState?: ProcessStateV2;
    previousPriority?: ProcessPriority;
    newPriority?: ProcessPriority;
    error?: string;
    processes?: ProcessDescriptorV2[];
}

// ═══════════════════════════════════════════════════════════════════════════
// Audit Types
// ═══════════════════════════════════════════════════════════════════════════

export interface ProcessAuditPayloadV2 {
    action: ProcessActionV2;
    pid?: string;
    actorId: string;
    actorRole: string;
    decision: 'ALLOW' | 'DENY';
    reason?: string;
    previousState?: ProcessStateV2;
    newState?: ProcessStateV2;
    previousPriority?: ProcessPriority;
    newPriority?: ProcessPriority;
    suspendReason?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Error Codes
// ═══════════════════════════════════════════════════════════════════════════

export enum ProcessErrorV2 {
    PROCESS_NOT_FOUND = 'PROCESS_NOT_FOUND',
    INVALID_STATE = 'INVALID_STATE',
    CANNOT_RESUME_CRASHED = 'CANNOT_RESUME_CRASHED',
    FORBIDDEN = 'FORBIDDEN',
    SUSPEND_TIMEOUT = 'SUSPEND_TIMEOUT',
    ALREADY_SUSPENDED = 'ALREADY_SUSPENDED',
    NOT_SUSPENDED = 'NOT_SUSPENDED',
    PRIORITY_UNCHANGED = 'PRIORITY_UNCHANGED',
}

// ═══════════════════════════════════════════════════════════════════════════
// State Transition Validator
// ═══════════════════════════════════════════════════════════════════════════

export const VALID_TRANSITIONS: Record<ProcessStateV2, ProcessStateV2[]> = {
    RUNNING: ['SUSPENDED', 'TERMINATED', 'CRASHED'],
    SUSPENDED: ['RUNNING', 'TERMINATED', 'CRASHED'],
    TERMINATED: [],
    CRASHED: [],
};

export function canTransition(from: ProcessStateV2, to: ProcessStateV2): boolean {
    return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}
