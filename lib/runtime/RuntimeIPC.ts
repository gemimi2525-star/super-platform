/**
 * Phase 16: Runtime IPC
 * 
 * Inter-Process Communication protocol for app runtime ↔ host communication.
 * All intent calls from apps go through this bridge.
 */

import type {
    IPCMessage,
    IPCIntentRequest,
    IPCIntentResponse,
    Capability,
    RuntimeIntentResult,
} from './types';
import { RuntimeError } from './types';
import { RuntimeRegistry } from './RuntimeRegistry';

// ═══════════════════════════════════════════════════════════════════════════
// Request Tracking
// ═══════════════════════════════════════════════════════════════════════════

interface PendingRequest {
    resolve: (response: IPCIntentResponse) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
    startTime: number;
}

const pendingRequests: Map<string, PendingRequest> = new Map();
const REQUEST_TIMEOUT_MS = 30000;

// ═══════════════════════════════════════════════════════════════════════════
// Message Generator
// ═══════════════════════════════════════════════════════════════════════════

export function generateRequestId(): string {
    return `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function generateTraceId(): string {
    return `trace-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function generateOpId(action: string): string {
    return `op-${action}-${Date.now()}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// Message Creation
// ═══════════════════════════════════════════════════════════════════════════

export function createInitMessage(appId: string, grantedCapabilities: Capability[]): IPCMessage {
    return {
        type: 'INIT',
        requestId: generateRequestId(),
        appId,
        traceId: generateTraceId(),
        payload: { grantedCapabilities },
    };
}

export function createIntentRequest(
    appId: string,
    action: string,
    capability: Capability,
    params?: Record<string, unknown>,
    traceId?: string
): IPCIntentRequest {
    const requestId = generateRequestId();
    return {
        type: 'INTENT_REQUEST',
        requestId,
        appId,
        traceId: traceId || generateTraceId(),
        opId: generateOpId(action),
        intent: {
            action,
            capability,
            params,
        },
    };
}

export function createIntentResponse(
    request: IPCIntentRequest,
    success: boolean,
    data?: unknown,
    error?: string,
    decision?: { outcome: 'ALLOW' | 'DENY'; reason?: string }
): IPCIntentResponse {
    return {
        type: 'INTENT_RESPONSE',
        requestId: request.requestId,
        appId: request.appId,
        traceId: request.traceId,
        opId: request.opId,
        success,
        data,
        error,
        decision,
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// Message Handler (Host Side)
// ═══════════════════════════════════════════════════════════════════════════

export async function handleIPCMessage(
    message: IPCMessage,
    dispatchIntent: (request: IPCIntentRequest) => Promise<RuntimeIntentResult>
): Promise<IPCMessage | null> {
    console.log(`[RuntimeIPC] Received: ${message.type} from ${message.appId}`);

    switch (message.type) {
        case 'READY': {
            // App is ready, update registry state
            RuntimeRegistry.updateState(message.appId, 'RUNNING');
            return null;
        }

        case 'HEARTBEAT': {
            RuntimeRegistry.updateHeartbeat(message.appId);
            return null;
        }

        case 'INTENT_REQUEST': {
            const request = message as IPCIntentRequest;

            // Validate app is registered
            const instance = RuntimeRegistry.get(request.appId);
            if (!instance) {
                return createIntentResponse(request, false, undefined, RuntimeError.RUNTIME_NOT_FOUND);
            }

            // Check capability (UX guard, server does real enforcement)
            if (!instance.grantedCapabilities.includes(request.intent.capability)) {
                return createIntentResponse(
                    request,
                    false,
                    undefined,
                    RuntimeError.CAPABILITY_DENIED,
                    { outcome: 'DENY', reason: `Capability not granted: ${request.intent.capability}` }
                );
            }

            // Dispatch to server
            try {
                const result = await dispatchIntent(request);
                return createIntentResponse(
                    request,
                    result.success,
                    result.data,
                    result.error,
                    result.decision
                );
            } catch (e) {
                return createIntentResponse(
                    request,
                    false,
                    undefined,
                    (e as Error).message
                );
            }
        }

        case 'ERROR': {
            console.error(`[RuntimeIPC] App error from ${message.appId}:`, message.error);
            RuntimeRegistry.updateState(message.appId, 'CRASHED', message.error);
            return null;
        }

        default:
            console.warn(`[RuntimeIPC] Unknown message type: ${message.type}`);
            return null;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// Send with Tracking (App Side - for SDK)
// ═══════════════════════════════════════════════════════════════════════════

export function sendIPCRequest(
    worker: Worker,
    request: IPCIntentRequest
): Promise<IPCIntentResponse> {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            pendingRequests.delete(request.requestId);
            reject(new Error('IPC request timeout'));
        }, REQUEST_TIMEOUT_MS);

        pendingRequests.set(request.requestId, {
            resolve,
            reject,
            timeout,
            startTime: Date.now(),
        });

        worker.postMessage(request);
    });
}

export function handleIPCResponse(response: IPCIntentResponse): boolean {
    const pending = pendingRequests.get(response.requestId);
    if (!pending) return false;

    clearTimeout(pending.timeout);
    pendingRequests.delete(response.requestId);

    const latencyMs = Date.now() - pending.startTime;
    console.log(`[RuntimeIPC] Response for ${response.requestId} in ${latencyMs}ms`);

    pending.resolve(response);
    return true;
}

// ═══════════════════════════════════════════════════════════════════════════
// Validation
// ═══════════════════════════════════════════════════════════════════════════

export function validateIPCMessage(data: unknown): data is IPCMessage {
    if (typeof data !== 'object' || data === null) return false;
    const msg = data as Record<string, unknown>;
    return (
        typeof msg.type === 'string' &&
        typeof msg.requestId === 'string' &&
        typeof msg.appId === 'string' &&
        typeof msg.traceId === 'string'
    );
}

export function isDirectAPIAttempt(url: string): boolean {
    // Block direct calls to /api/platform/* from runtime
    return url.includes('/api/platform/');
}
