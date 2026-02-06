/**
 * Phase 15B.2: ProcessManagerV2
 * 
 * Extended Process Manager with suspend/resume/priority support.
 * Wraps v1 ProcessManager without modifying frozen files.
 */

'use client';

import type {
    ProcessDescriptorV2,
    ProcessStateV2,
    ProcessPriority,
    ProcessIntentResultV2,
    SpawnOptionsV2,
    SuspendOptions,
    PriorityOptions,
} from './types';
import { ProcessErrorV2, canTransition, PRIORITY_LEVELS } from './types';

type IPCMessageV2 = {
    type: 'COMMAND' | 'HEARTBEAT' | 'SUSPEND' | 'RESUME' | 'TERMINATE' | 'PRIORITY';
    pid: string;
    timestamp: number;
    payload?: unknown;
};

type ProcessListener = () => void;

/**
 * ProcessManagerV2 - Extended singleton for Phase 15B.2
 */
export class ProcessManagerV2 {
    private static instance: ProcessManagerV2 | null = null;

    private processes: Map<string, ProcessDescriptorV2> = new Map();
    private workers: Map<string, Worker> = new Map();
    private listeners: Set<ProcessListener> = new Set();
    private pidCounter: number = 0;

    private constructor() { }

    static getInstance(): ProcessManagerV2 {
        if (!ProcessManagerV2.instance) {
            ProcessManagerV2.instance = new ProcessManagerV2();
        }
        return ProcessManagerV2.instance;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Lifecycle Methods
    // ═══════════════════════════════════════════════════════════════════════

    private generatePid(): string {
        const timestamp = Date.now();
        const random = Math.random().toString(36).slice(2, 7);
        return `proc-${timestamp}-${random}`;
    }

    /**
     * Spawn a new process with v2 features
     */
    spawn(options: SpawnOptionsV2, ownerId?: string): ProcessDescriptorV2 {
        const pid = this.generatePid();
        const now = Date.now();

        const descriptor: ProcessDescriptorV2 = {
            pid,
            appId: options.appId,
            state: 'RUNNING',
            startedAt: now,
            windowId: options.windowId,
            lastHeartbeat: now,
            ownerId,
            cpuTime: 0,
            memoryMB: 0,
            priority: options.priority || 'normal',
            resumeCount: 0,
        };

        try {
            const worker = new Worker(options.entryPoint, { type: 'module' });
            worker.onmessage = (event) => this.handleWorkerMessage(pid, event);
            worker.onerror = (error) => this.handleWorkerError(pid, error);

            const initMessage: IPCMessageV2 = {
                type: 'COMMAND',
                pid,
                timestamp: now,
                payload: { command: 'INIT', args: options.args },
            };
            worker.postMessage(initMessage);

            this.processes.set(pid, descriptor);
            this.workers.set(pid, worker);
            this.notifyListeners();

            return descriptor;
        } catch (error) {
            throw new Error(`Failed to spawn process: ${error}`);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // V2 Intent Methods: Suspend / Resume / Priority
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Suspend a running process
     */
    suspend(pid: string, options?: SuspendOptions): ProcessIntentResultV2 {
        const process = this.processes.get(pid);

        if (!process) {
            return {
                success: false,
                action: 'os.process.suspend',
                pid,
                error: ProcessErrorV2.PROCESS_NOT_FOUND,
            };
        }

        if (process.state !== 'RUNNING') {
            // Idempotency: already suspended → no-op
            if (process.state === 'SUSPENDED') {
                return {
                    success: true,
                    action: 'os.process.suspend',
                    pid,
                    previousState: 'SUSPENDED',
                    newState: 'SUSPENDED',
                };
            }
            return {
                success: false,
                action: 'os.process.suspend',
                pid,
                error: ProcessErrorV2.INVALID_STATE,
            };
        }

        const worker = this.workers.get(pid);
        if (worker) {
            const msg: IPCMessageV2 = {
                type: 'SUSPEND',
                pid,
                timestamp: Date.now(),
                payload: { reason: options?.reason },
            };
            worker.postMessage(msg);
        }

        const previousState = process.state;
        process.state = 'SUSPENDED';
        process.suspendedAt = Date.now();
        process.suspendReason = options?.reason;

        this.notifyListeners();

        return {
            success: true,
            action: 'os.process.suspend',
            pid,
            previousState,
            newState: 'SUSPENDED',
        };
    }

    /**
     * Resume a suspended process
     */
    resume(pid: string): ProcessIntentResultV2 {
        const process = this.processes.get(pid);

        if (!process) {
            return {
                success: false,
                action: 'os.process.resume',
                pid,
                error: ProcessErrorV2.PROCESS_NOT_FOUND,
            };
        }

        if (process.state === 'CRASHED') {
            return {
                success: false,
                action: 'os.process.resume',
                pid,
                error: ProcessErrorV2.CANNOT_RESUME_CRASHED,
            };
        }

        if (process.state !== 'SUSPENDED') {
            // Idempotency: already running → no-op
            if (process.state === 'RUNNING') {
                return {
                    success: true,
                    action: 'os.process.resume',
                    pid,
                    previousState: 'RUNNING',
                    newState: 'RUNNING',
                };
            }
            return {
                success: false,
                action: 'os.process.resume',
                pid,
                error: ProcessErrorV2.NOT_SUSPENDED,
            };
        }

        const worker = this.workers.get(pid);
        if (worker) {
            const msg: IPCMessageV2 = {
                type: 'RESUME',
                pid,
                timestamp: Date.now(),
            };
            worker.postMessage(msg);
        }

        const previousState = process.state;
        process.state = 'RUNNING';
        process.lastHeartbeat = Date.now();
        process.resumeCount += 1;
        delete process.suspendedAt;
        delete process.suspendReason;

        this.notifyListeners();

        return {
            success: true,
            action: 'os.process.resume',
            pid,
            previousState,
            newState: 'RUNNING',
        };
    }

    /**
     * Set process priority
     */
    setPriority(pid: string, options: PriorityOptions): ProcessIntentResultV2 {
        const process = this.processes.get(pid);

        if (!process) {
            return {
                success: false,
                action: 'os.process.setPriority',
                pid,
                error: ProcessErrorV2.PROCESS_NOT_FOUND,
            };
        }

        const previousPriority = process.priority;

        // Idempotency: same priority → no-op (no audit)
        if (previousPriority === options.priority) {
            return {
                success: true,
                action: 'os.process.setPriority',
                pid,
                previousPriority,
                newPriority: options.priority,
            };
        }

        process.priority = options.priority;

        // Notify worker of priority change (for future scheduler integration)
        const worker = this.workers.get(pid);
        if (worker) {
            const msg: IPCMessageV2 = {
                type: 'PRIORITY',
                pid,
                timestamp: Date.now(),
                payload: { priority: options.priority, level: PRIORITY_LEVELS[options.priority] },
            };
            worker.postMessage(msg);
        }

        this.notifyListeners();

        return {
            success: true,
            action: 'os.process.setPriority',
            pid,
            previousPriority,
            newPriority: options.priority,
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // V1 Compat: Terminate / ForceQuit
    // ═══════════════════════════════════════════════════════════════════════

    terminate(pid: string): ProcessIntentResultV2 {
        const process = this.processes.get(pid);
        if (!process) {
            return { success: false, action: 'os.process.terminate', pid, error: ProcessErrorV2.PROCESS_NOT_FOUND };
        }

        if (process.state === 'TERMINATED' || process.state === 'CRASHED') {
            return { success: false, action: 'os.process.terminate', pid, error: ProcessErrorV2.INVALID_STATE };
        }

        // If SUSPENDED, must forceQuit per spec
        if (process.state === 'SUSPENDED') {
            return { success: false, action: 'os.process.terminate', pid, error: ProcessErrorV2.INVALID_STATE };
        }

        const worker = this.workers.get(pid);
        if (worker) {
            const msg: IPCMessageV2 = { type: 'TERMINATE', pid, timestamp: Date.now() };
            worker.postMessage(msg);
            setTimeout(() => this.forceQuit(pid), 3000);
        }

        const previousState = process.state;
        process.state = 'TERMINATED';
        process.exitCode = 0;
        this.cleanupResources(pid, 'terminate');
        this.notifyListeners();

        return { success: true, action: 'os.process.terminate', pid, previousState, newState: 'TERMINATED' };
    }

    forceQuit(pid: string): ProcessIntentResultV2 {
        const process = this.processes.get(pid);
        const worker = this.workers.get(pid);

        if (worker) {
            worker.terminate();
            this.workers.delete(pid);
        }

        if (process) {
            const previousState = process.state;
            process.state = 'TERMINATED';
            process.exitCode = -1;
            this.cleanupResources(pid, 'forceQuit');
            this.notifyListeners();
            return { success: true, action: 'os.process.forceQuit', pid, previousState, newState: 'TERMINATED' };
        }

        return { success: false, action: 'os.process.forceQuit', pid, error: ProcessErrorV2.PROCESS_NOT_FOUND };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Query Methods
    // ═══════════════════════════════════════════════════════════════════════

    list(ownerId?: string): ProcessDescriptorV2[] {
        const all = Array.from(this.processes.values());
        if (ownerId) {
            return all.filter(p => p.ownerId === ownerId);
        }
        return all;
    }

    listByPriority(priority: ProcessPriority): ProcessDescriptorV2[] {
        return Array.from(this.processes.values()).filter(p => p.priority === priority);
    }

    get(pid: string): ProcessDescriptorV2 | undefined {
        return this.processes.get(pid);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Subscription
    // ═══════════════════════════════════════════════════════════════════════

    subscribe(listener: ProcessListener): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private notifyListeners(): void {
        this.listeners.forEach(listener => listener());
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Internal Handlers
    // ═══════════════════════════════════════════════════════════════════════

    private handleWorkerMessage(pid: string, event: MessageEvent): void {
        const message = event.data as IPCMessageV2;
        const process = this.processes.get(pid);
        if (!process) return;

        if (message.type === 'HEARTBEAT') {
            process.lastHeartbeat = Date.now();
            this.notifyListeners();
        }
    }

    private handleWorkerError(pid: string, error: ErrorEvent): void {
        const process = this.processes.get(pid);
        if (process) {
            process.state = 'CRASHED';
            process.crashReason = error.message || 'Unknown error';
            this.cleanupResources(pid, 'crash');
            this.cleanupProcess(pid);
            this.notifyListeners();
        }
    }

    private cleanupProcess(pid: string): void {
        const worker = this.workers.get(pid);
        if (worker) {
            worker.terminate();
            this.workers.delete(pid);
        }
    }

    private cleanupResources(pid: string, exitPath: 'terminate' | 'forceQuit' | 'crash'): void {
        const cleanupLog = { pid, exitPath, timestamp: Date.now() };
        if (typeof console !== 'undefined') {
            console.log('[ProcessManagerV2] Cleanup:', JSON.stringify(cleanupLog));
        }
        (this as any)._lastCleanup = cleanupLog;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// Singleton Export
// ═══════════════════════════════════════════════════════════════════════════

let managerInstance: ProcessManagerV2 | null = null;

export function getProcessManagerV2(): ProcessManagerV2 {
    if (typeof window === 'undefined') {
        throw new Error('ProcessManagerV2 only available on client');
    }
    if (!managerInstance) {
        managerInstance = ProcessManagerV2.getInstance();
    }
    return managerInstance;
}
