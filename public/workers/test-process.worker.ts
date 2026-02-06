/**
 * Test Process Worker
 * 
 * Used by Verifier to test process management.
 * Supports crash simulation, heavy computation, etc.
 */

import { IPCMessage } from '@/lib/process/types';

// ═══════════════════════════════════════════════════════════════════════════
// Worker State
// ═══════════════════════════════════════════════════════════════════════════

let pid = '';
let suspended = false;
let heartbeatInterval: ReturnType<typeof setInterval> | null = null;
const startTime = Date.now();

// ═══════════════════════════════════════════════════════════════════════════
// Message Handler
// ═══════════════════════════════════════════════════════════════════════════

self.onmessage = async (event: MessageEvent) => {
    const message = event.data as IPCMessage;
    pid = message.pid;

    try {
        switch (message.type) {
            case 'COMMAND':
                await handleCommand(message.payload as { command: string; args?: unknown });
                break;

            case 'SUSPEND':
                suspended = true;
                break;

            case 'RESUME':
                suspended = false;
                break;

            case 'TERMINATE':
                cleanup();
                send('EXIT', { exitCode: 0 });
                break;
        }
    } catch (error) {
        send('ERROR', error instanceof Error ? error.message : String(error));
    }
};

// Error handlers
self.onerror = (error) => {
    send('ERROR', error instanceof ErrorEvent ? error.message : String(error));
};

// ═══════════════════════════════════════════════════════════════════════════
// Command Handler
// ═══════════════════════════════════════════════════════════════════════════

async function handleCommand(cmd: { command: string; args?: unknown }): Promise<void> {
    switch (cmd.command) {
        case 'INIT':
            startHeartbeat();
            send('READY');
            break;

        case 'CRASH':
            // Intentional crash for testing B4
            throw new Error('Intentional crash for verification');

        case 'HEAVY_LOOP':
            // CPU-intensive work for testing B2
            let sum = 0;
            for (let i = 0; i < 10000000; i++) {
                sum += Math.sqrt(i);
            }
            send('STATUS', { result: sum });
            break;

        case 'PING':
            send('STATUS', { pong: true, time: Date.now() });
            break;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// IPC Helpers
// ═══════════════════════════════════════════════════════════════════════════

function send(type: string, payload?: unknown): void {
    const message: IPCMessage = {
        type: type as any,
        pid,
        timestamp: Date.now(),
        payload,
    };
    self.postMessage(message);
}

function startHeartbeat(): void {
    heartbeatInterval = setInterval(() => {
        if (!suspended) {
            send('HEARTBEAT', {
                cpuTime: Date.now() - startTime,
                memoryMB: 0,
            });
        }
    }, 5000);
}

function cleanup(): void {
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
    }
}
