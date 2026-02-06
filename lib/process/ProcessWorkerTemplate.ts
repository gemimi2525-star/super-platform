/**
 * Phase 15B: Process Worker Template
 * 
 * Base class for App Workers. Apps extend this to get:
 * - Automatic heartbeat
 * - IPC protocol handling
 * - Error boundary
 * 
 * Usage:
 * ```typescript
 * // my-app-worker.ts
 * import { ProcessWorkerBase } from '@/lib/process/ProcessWorkerTemplate';
 * 
 * class MyAppWorker extends ProcessWorkerBase {
 *   async onInit(args: Record<string, unknown>) {
 *     // App initialization
 *   }
 *   
 *   async onCommand(command: string, payload: unknown) {
 *     // Handle commands from OS
 *   }
 * }
 * 
 * new MyAppWorker();
 * ```
 */

import { IPCMessage, IPCMessageType } from './types';

// ═══════════════════════════════════════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════════════════════════════════════

const HEARTBEAT_INTERVAL = 5000; // Send heartbeat every 5s

// ═══════════════════════════════════════════════════════════════════════════
// Process Worker Base Class
// ═══════════════════════════════════════════════════════════════════════════

export abstract class ProcessWorkerBase {
    protected pid: string = '';
    protected suspended: boolean = false;
    private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
    private startTime: number = Date.now();

    constructor() {
        this.setupMessageHandler();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Abstract methods (App must implement)
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Called when process is initialized
     */
    protected abstract onInit(args: Record<string, unknown>): Promise<void>;

    /**
     * Called when OS sends a command
     */
    protected abstract onCommand(command: string, payload: unknown): Promise<void>;

    /**
     * Optional: Called when process is suspending
     */
    protected onSuspend?(): Promise<void>;

    /**
     * Optional: Called when process is resuming
     */
    protected onResume?(): Promise<void>;

    /**
     * Optional: Called before termination (cleanup)
     */
    protected onTerminate?(): Promise<void>;

    // ═══════════════════════════════════════════════════════════════════════════
    // IPC Methods
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Send message to OS
     */
    protected send(type: IPCMessageType, payload?: unknown): void {
        const message: IPCMessage = {
            type,
            pid: this.pid,
            timestamp: Date.now(),
            payload,
        };
        self.postMessage(message);
    }

    /**
     * Exit process normally
     */
    protected exit(exitCode: number = 0): void {
        this.stopHeartbeat();
        this.send('EXIT', { exitCode });
    }

    /**
     * Report error to OS
     */
    protected reportError(error: Error | string): void {
        const message = error instanceof Error ? error.message : error;
        this.send('ERROR', message);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Internal Methods
    // ═══════════════════════════════════════════════════════════════════════════

    private setupMessageHandler(): void {
        self.onmessage = async (event: MessageEvent) => {
            const message = event.data as IPCMessage;
            this.pid = message.pid;

            try {
                switch (message.type) {
                    case 'COMMAND':
                        await this.handleCommand(message.payload as { command: string; args?: unknown });
                        break;

                    case 'SUSPEND':
                        this.suspended = true;
                        if (this.onSuspend) await this.onSuspend();
                        break;

                    case 'RESUME':
                        this.suspended = false;
                        if (this.onResume) await this.onResume();
                        break;

                    case 'TERMINATE':
                        await this.handleTerminate();
                        break;
                }
            } catch (error) {
                this.reportError(error instanceof Error ? error : String(error));
            }
        };

        // Handle uncaught errors
        self.onerror = (error) => {
            this.reportError(error instanceof ErrorEvent ? error.message : String(error));
        };

        // Handle unhandled promise rejections
        self.onunhandledrejection = (event) => {
            this.reportError(`Unhandled rejection: ${event.reason}`);
        };
    }

    private async handleCommand(cmd: { command: string; args?: unknown }): Promise<void> {
        if (cmd.command === 'INIT') {
            await this.onInit((cmd.args as Record<string, unknown>) || {});
            this.startHeartbeat();
            this.send('READY');
        } else {
            await this.onCommand(cmd.command, cmd.args);
        }
    }

    private async handleTerminate(): Promise<void> {
        this.stopHeartbeat();
        if (this.onTerminate) {
            await this.onTerminate();
        }
        this.exit(0);
    }

    private startHeartbeat(): void {
        this.heartbeatInterval = setInterval(() => {
            if (!this.suspended) {
                this.send('HEARTBEAT', {
                    cpuTime: Date.now() - this.startTime,
                    memoryMB: this.estimateMemory(),
                });
            }
        }, HEARTBEAT_INTERVAL);
    }

    private stopHeartbeat(): void {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    private estimateMemory(): number {
        // Best-effort memory estimation
        // In real implementation, could use performance.measureUserAgentSpecificMemory()
        if (typeof (performance as any).memory !== 'undefined') {
            return Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024);
        }
        return 0;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// Simple Test Worker (for verification)
// ═══════════════════════════════════════════════════════════════════════════

export class TestProcessWorker extends ProcessWorkerBase {
    protected async onInit(args: Record<string, unknown>): Promise<void> {
        console.log('[TestWorker] Initialized with args:', args);
    }

    protected async onCommand(command: string, payload: unknown): Promise<void> {
        console.log('[TestWorker] Command:', command, payload);

        if (command === 'CRASH') {
            throw new Error('Intentional crash for testing');
        }

        if (command === 'HEAVY_LOOP') {
            // Simulate CPU-intensive work
            let sum = 0;
            for (let i = 0; i < 100000000; i++) {
                sum += i;
            }
            console.log('[TestWorker] Heavy loop done:', sum);
        }
    }
}
