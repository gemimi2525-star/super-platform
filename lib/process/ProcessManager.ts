/**
 * Phase 15B: ProcessManager
 * 
 * Singleton Kernel for process lifecycle management.
 * Uses Web Workers for true thread isolation.
 * 
 * @internal Core OS module - do not import directly in Apps
 */

import {
    ProcessDescriptor,
    ProcessState,
    SpawnOptions,
    ProcessError,
    ProcessException,
    IPCMessage,
    IPCMessageType,
} from './types';

// ═══════════════════════════════════════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════════════════════════════════════

const HEARTBEAT_INTERVAL = 5000;    // Worker should ping every 5s
const HEARTBEAT_TIMEOUT = 15000;    // Mark as crashed after 15s of silence
const MONITOR_INTERVAL = 3000;      // Check heartbeats every 3s

// ═══════════════════════════════════════════════════════════════════════════
// Process Manager Singleton
// ═══════════════════════════════════════════════════════════════════════════

export class ProcessManager {
    private static instance: ProcessManager | null = null;

    private processes: Map<string, ProcessDescriptor> = new Map();
    private workers: Map<string, Worker> = new Map();
    private monitorInterval: NodeJS.Timeout | null = null;
    private listeners: Set<(processes: ProcessDescriptor[]) => void> = new Set();

    private constructor() {
        // Start heartbeat monitor
        this.startHeartbeatMonitor();
    }

    /**
     * Get singleton instance
     */
    static getInstance(): ProcessManager {
        if (!ProcessManager.instance) {
            ProcessManager.instance = new ProcessManager();
        }
        return ProcessManager.instance;
    }

    /**
     * Reset instance (for testing)
     */
    static resetInstance(): void {
        if (ProcessManager.instance) {
            ProcessManager.instance.shutdown();
            ProcessManager.instance = null;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Lifecycle Methods
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Spawn a new process
     */
    spawn(options: SpawnOptions, ownerId?: string): ProcessDescriptor {
        const pid = this.generatePid();
        const now = Date.now();

        const descriptor: ProcessDescriptor = {
            pid,
            appId: options.appId,
            state: 'RUNNING',
            startedAt: now,
            windowId: options.windowId,
            lastHeartbeat: now,
            ownerId,
            cpuTime: 0,
            memoryMB: 0,
        };

        try {
            // Create Web Worker
            const worker = new Worker(options.entryPoint, { type: 'module' });

            // Setup message handler
            worker.onmessage = (event) => this.handleWorkerMessage(pid, event);
            worker.onerror = (error) => this.handleWorkerError(pid, error);

            // Send init message
            const initMessage: IPCMessage = {
                type: 'COMMAND',
                pid,
                timestamp: now,
                payload: { command: 'INIT', args: options.args },
            };
            worker.postMessage(initMessage);

            // Store references
            this.processes.set(pid, descriptor);
            this.workers.set(pid, worker);

            this.notifyListeners();
            return descriptor;
        } catch (error) {
            throw new ProcessException(
                ProcessError.spawnFailed,
                `Failed to spawn process: ${error}`
            );
        }
    }

    /**
     * Graceful termination (allows cleanup)
     */
    terminate(pid: string): void {
        const process = this.processes.get(pid);
        if (!process) {
            throw new ProcessException(ProcessError.notFound, `Process not found: ${pid}`);
        }

        if (process.state === 'TERMINATED' || process.state === 'CRASHED') {
            throw new ProcessException(ProcessError.alreadyTerminated, `Process already terminated: ${pid}`);
        }

        const worker = this.workers.get(pid);
        if (worker) {
            // Send terminate signal
            const msg: IPCMessage = {
                type: 'TERMINATE',
                pid,
                timestamp: Date.now(),
            };
            worker.postMessage(msg);

            // Give worker 3s to cleanup
            setTimeout(() => {
                this.forceQuit(pid);
            }, 3000);
        }

        process.state = 'TERMINATED';
        process.exitCode = 0;
        this.notifyListeners();
    }

    /**
     * Force quit (immediate termination)
     */
    forceQuit(pid: string): void {
        const process = this.processes.get(pid);
        const worker = this.workers.get(pid);

        if (worker) {
            worker.terminate();
            this.workers.delete(pid);
        }

        if (process) {
            process.state = 'TERMINATED';
            process.exitCode = -1;
        }

        this.notifyListeners();
    }

    /**
     * Suspend process (pause execution)
     */
    suspend(pid: string): void {
        const process = this.processes.get(pid);
        if (!process) {
            throw new ProcessException(ProcessError.notFound, `Process not found: ${pid}`);
        }

        if (process.state !== 'RUNNING') {
            throw new ProcessException(ProcessError.invalidState, `Cannot suspend process in state: ${process.state}`);
        }

        const worker = this.workers.get(pid);
        if (worker) {
            const msg: IPCMessage = {
                type: 'SUSPEND',
                pid,
                timestamp: Date.now(),
            };
            worker.postMessage(msg);
        }

        process.state = 'SUSPENDED';
        this.notifyListeners();
    }

    /**
     * Resume suspended process
     */
    resume(pid: string): void {
        const process = this.processes.get(pid);
        if (!process) {
            throw new ProcessException(ProcessError.notFound, `Process not found: ${pid}`);
        }

        if (process.state !== 'SUSPENDED') {
            throw new ProcessException(ProcessError.invalidState, `Cannot resume process in state: ${process.state}`);
        }

        const worker = this.workers.get(pid);
        if (worker) {
            const msg: IPCMessage = {
                type: 'RESUME',
                pid,
                timestamp: Date.now(),
            };
            worker.postMessage(msg);
        }

        process.state = 'RUNNING';
        process.lastHeartbeat = Date.now();
        this.notifyListeners();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Query Methods
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * List all processes
     */
    list(ownerId?: string): ProcessDescriptor[] {
        const all = Array.from(this.processes.values());
        if (ownerId) {
            return all.filter(p => p.ownerId === ownerId);
        }
        return all;
    }

    /**
     * Get single process
     */
    get(pid: string): ProcessDescriptor | undefined {
        return this.processes.get(pid);
    }

    /**
     * Get process count
     */
    getCount(): number {
        return this.processes.size;
    }

    /**
     * Get running process count
     */
    getRunningCount(): number {
        return Array.from(this.processes.values()).filter(p => p.state === 'RUNNING').length;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Event Subscription
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Subscribe to process list changes
     */
    subscribe(listener: (processes: ProcessDescriptor[]) => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private notifyListeners(): void {
        const processes = this.list();
        this.listeners.forEach(listener => listener(processes));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Internal Methods
    // ═══════════════════════════════════════════════════════════════════════════

    private generatePid(): string {
        return `proc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    }

    private handleWorkerMessage(pid: string, event: MessageEvent): void {
        const message = event.data as IPCMessage;
        const process = this.processes.get(pid);
        if (!process) return;

        switch (message.type) {
            case 'HEARTBEAT':
                process.lastHeartbeat = Date.now();
                if (message.payload) {
                    const stats = message.payload as { cpuTime?: number; memoryMB?: number };
                    if (stats.cpuTime !== undefined) process.cpuTime = stats.cpuTime;
                    if (stats.memoryMB !== undefined) process.memoryMB = stats.memoryMB;
                }
                break;

            case 'READY':
                process.state = 'RUNNING';
                process.lastHeartbeat = Date.now();
                this.notifyListeners();
                break;

            case 'EXIT':
                process.state = 'TERMINATED';
                process.exitCode = (message.payload as { exitCode?: number })?.exitCode || 0;
                this.cleanupProcess(pid);
                this.notifyListeners();
                break;

            case 'ERROR':
                process.crashReason = String(message.payload);
                // Don't mark as crashed yet - wait for heartbeat timeout
                break;

            case 'STATUS':
                if (message.payload) {
                    const status = message.payload as Partial<ProcessDescriptor>;
                    if (status.cpuTime !== undefined) process.cpuTime = status.cpuTime;
                    if (status.memoryMB !== undefined) process.memoryMB = status.memoryMB;
                }
                break;
        }
    }

    private handleWorkerError(pid: string, error: ErrorEvent): void {
        const process = this.processes.get(pid);
        if (process) {
            process.state = 'CRASHED';
            process.crashReason = error.message || 'Unknown error';
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

    private startHeartbeatMonitor(): void {
        if (typeof window === 'undefined') return; // Server-side check

        this.monitorInterval = setInterval(() => {
            const now = Date.now();
            for (const [pid, process] of this.processes.entries()) {
                if (process.state === 'RUNNING') {
                    const lastHB = process.lastHeartbeat || process.startedAt;
                    if (now - lastHB > HEARTBEAT_TIMEOUT) {
                        // Mark as crashed
                        process.state = 'CRASHED';
                        process.crashReason = 'Heartbeat timeout';
                        this.cleanupProcess(pid);
                        this.notifyListeners();
                    }
                }
            }
        }, MONITOR_INTERVAL);
    }

    /**
     * Shutdown all processes
     */
    shutdown(): void {
        if (this.monitorInterval) {
            clearInterval(this.monitorInterval);
            this.monitorInterval = null;
        }

        for (const [pid] of this.workers) {
            this.forceQuit(pid);
        }

        this.processes.clear();
        this.workers.clear();
        this.listeners.clear();
    }
}

// Export singleton getter
export const getProcessManager = () => ProcessManager.getInstance();
