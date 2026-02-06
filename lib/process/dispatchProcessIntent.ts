/**
 * Phase 15B: Process Intent Dispatcher
 * 
 * Client-side dispatcher for process intents.
 * NO policy logic - all decisions made server-side.
 * 
 * @public Use this to dispatch process operations from UI/Apps
 */

import { ProcessIntent, ProcessIntentResult, ProcessAction } from './types';

// ═══════════════════════════════════════════════════════════════════════════
// Dispatcher
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Dispatch a process intent to the server-side API
 * 
 * @param intent - The process intent to dispatch
 * @param traceId - Optional trace ID for correlation
 * @returns ProcessIntentResult with decision and process info
 * 
 * @example
 * ```typescript
 * // Spawn a new process
 * const result = await dispatchProcessIntent({
 *   action: 'os.process.spawn',
 *   options: { appId: 'calculator', entryPoint: '/workers/calculator.js' }
 * });
 * 
 * // Terminate a process
 * await dispatchProcessIntent({
 *   action: 'os.process.terminate',
 *   pid: 'proc-12345'
 * });
 * 
 * // List all processes
 * const list = await dispatchProcessIntent({ action: 'os.process.list' });
 * console.log(list.processes);
 * ```
 */
export async function dispatchProcessIntent(
    intent: ProcessIntent,
    traceId?: string
): Promise<ProcessIntentResult> {
    const useTraceId = traceId || getTraceId();

    try {
        const response = await fetch('/api/platform/process-intents', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-trace-id': useTraceId,
            },
            body: JSON.stringify(intent),
        });

        const result = await response.json();
        return result as ProcessIntentResult;
    } catch (error) {
        return {
            success: false,
            action: intent.action,
            error: `Network error: ${error}`,
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// Convenience Methods
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Spawn a new process
 */
export async function spawnProcess(
    appId: string,
    entryPoint: string,
    args?: Record<string, unknown>,
    windowId?: string
): Promise<ProcessIntentResult> {
    return dispatchProcessIntent({
        action: 'os.process.spawn',
        options: { appId, entryPoint, args, windowId },
    });
}

/**
 * Terminate a process (graceful)
 */
export async function terminateProcess(pid: string): Promise<ProcessIntentResult> {
    return dispatchProcessIntent({
        action: 'os.process.terminate',
        pid,
    });
}

/**
 * Force quit a process (immediate)
 */
export async function forceQuitProcess(pid: string): Promise<ProcessIntentResult> {
    return dispatchProcessIntent({
        action: 'os.process.forceQuit',
        pid,
    });
}

/**
 * Suspend a process
 */
export async function suspendProcess(pid: string): Promise<ProcessIntentResult> {
    return dispatchProcessIntent({
        action: 'os.process.suspend',
        pid,
    });
}

/**
 * Resume a process
 */
export async function resumeProcess(pid: string): Promise<ProcessIntentResult> {
    return dispatchProcessIntent({
        action: 'os.process.resume',
        pid,
    });
}

/**
 * List all processes
 */
export async function listProcesses(): Promise<ProcessIntentResult> {
    return dispatchProcessIntent({
        action: 'os.process.list',
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// Helper
// ═══════════════════════════════════════════════════════════════════════════

function getTraceId(): string {
    if (typeof sessionStorage !== 'undefined') {
        const stored = sessionStorage.getItem('traceId');
        if (stored) return stored;
    }
    return `trace-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}
