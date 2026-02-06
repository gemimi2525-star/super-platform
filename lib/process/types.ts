/**
 * Phase 15B: Process Management Types
 * 
 * @internal Core OS types - do not import directly in Apps
 */

// ═══════════════════════════════════════════════════════════════════════════
// Process State Machine
// ═══════════════════════════════════════════════════════════════════════════

export type ProcessState = 'RUNNING' | 'SUSPENDED' | 'TERMINATED' | 'CRASHED';

// ═══════════════════════════════════════════════════════════════════════════
// Process Descriptor (Kernel View)
// ═══════════════════════════════════════════════════════════════════════════

export interface ProcessDescriptor {
    /** Unique process ID (UUID) */
    pid: string;
    /** Application identifier */
    appId: string;
    /** Current process state */
    state: ProcessState;
    /** Unix timestamp when process started */
    startedAt: number;
    /** Associated window ID (optional) */
    windowId?: string;
    /** CPU time in milliseconds (best-effort) */
    cpuTime?: number;
    /** Memory usage in MB (best-effort) */
    memoryMB?: number;
    /** Last heartbeat timestamp */
    lastHeartbeat?: number;
    /** Owner user ID */
    ownerId?: string;
    /** Exit code (if terminated) */
    exitCode?: number;
    /** Crash reason (if crashed) */
    crashReason?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Spawn Options
// ═══════════════════════════════════════════════════════════════════════════

export interface SpawnOptions {
    /** Application identifier */
    appId: string;
    /** Worker script URL or inline code identifier */
    entryPoint: string;
    /** Arguments passed to the worker */
    args?: Record<string, unknown>;
    /** Associated window ID */
    windowId?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Process Intent Types
// ═══════════════════════════════════════════════════════════════════════════

export type ProcessAction =
    | 'os.process.spawn'
    | 'os.process.terminate'
    | 'os.process.forceQuit'
    | 'os.process.suspend'
    | 'os.process.resume'
    | 'os.process.list';

export interface ProcessIntent {
    action: ProcessAction;
    pid?: string;
    options?: SpawnOptions;
}

export interface ProcessIntentResult {
    success: boolean;
    action: ProcessAction;
    pid?: string;
    process?: ProcessDescriptor;
    processes?: ProcessDescriptor[];
    decision?: {
        outcome: 'ALLOW' | 'DENY';
        reason?: string;
        errorCode?: ProcessError;
    };
    opId?: string;
    traceId?: string;
    error?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Process Errors
// ═══════════════════════════════════════════════════════════════════════════

export enum ProcessError {
    notFound = 'PROCESS_NOT_FOUND',
    alreadyRunning = 'PROCESS_ALREADY_RUNNING',
    alreadyTerminated = 'PROCESS_ALREADY_TERMINATED',
    accessDenied = 'PROCESS_ACCESS_DENIED',
    spawnFailed = 'PROCESS_SPAWN_FAILED',
    authRequired = 'PROCESS_AUTH_REQUIRED',
    invalidState = 'PROCESS_INVALID_STATE',
}

export class ProcessException extends Error {
    code: ProcessError;

    constructor(code: ProcessError, message: string) {
        super(message);
        this.code = code;
        this.name = 'ProcessException';
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// IPC Message Protocol
// ═══════════════════════════════════════════════════════════════════════════

export type IPCMessageType =
    | 'HEARTBEAT'       // Worker → OS: I'm alive
    | 'STATUS'          // Worker → OS: Status update
    | 'READY'           // Worker → OS: App initialized
    | 'ERROR'           // Worker → OS: Error occurred
    | 'EXIT'            // Worker → OS: Normal exit
    | 'COMMAND'         // OS → Worker: Execute command
    | 'SUSPEND'         // OS → Worker: Pause execution
    | 'RESUME'          // OS → Worker: Resume execution
    | 'TERMINATE';      // OS → Worker: Graceful shutdown

export interface IPCMessage {
    type: IPCMessageType;
    pid: string;
    timestamp: number;
    payload?: unknown;
}

// ═══════════════════════════════════════════════════════════════════════════
// Audit Payload
// ═══════════════════════════════════════════════════════════════════════════

export interface ProcessAuditPayload {
    action: ProcessAction;
    pid?: string;
    appId?: string;
    state?: ProcessState;
    previousState?: ProcessState;
    cpuTime?: number;
    memoryMB?: number;
}
