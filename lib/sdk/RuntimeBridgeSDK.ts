/**
 * Phase 16: Runtime Bridge SDK
 * 
 * Typed SDK for apps to call OS capabilities through the bridge.
 * Apps MUST NOT call /api/platform/* directly; use SDK only.
 */

import type { Capability } from '../runtime/types';
import type {
    BridgeConfig,
    SDKResult,
    FSReadOptions,
    FSWriteOptions,
    FSReadResult,
    FSWriteResult,
    UINotifyOptions,
    UIWindowOptions,
    NetFetchOptions,
    NetFetchResult,
} from './types';

// ═══════════════════════════════════════════════════════════════════════════
// SDK Error
// ═══════════════════════════════════════════════════════════════════════════

export class SDKError extends Error {
    constructor(
        message: string,
        public capability?: Capability,
        public code?: string
    ) {
        super(message);
        this.name = 'SDKError';
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// Bridge Helper
// ═══════════════════════════════════════════════════════════════════════════

let bridgeConfig: BridgeConfig | null = null;

function generateRequestId(): string {
    return `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function generateTraceId(): string {
    return `trace-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function generateOpId(action: string): string {
    return `op-${action}-${Date.now()}`;
}

async function sendIntent<T>(
    action: string,
    capability: Capability,
    params?: Record<string, unknown>
): Promise<SDKResult<T>> {
    if (!bridgeConfig) {
        throw new SDKError('SDK not initialized');
    }

    // Check capability (UX guard only, server does real enforcement)
    if (!bridgeConfig.grantedCapabilities.includes(capability)) {
        const traceId = generateTraceId();
        const opId = generateOpId(action);
        return {
            success: false,
            error: `Capability not granted: ${capability}`,
            traceId,
            opId,
        };
    }

    const requestId = generateRequestId();
    const traceId = generateTraceId();
    const opId = generateOpId(action);

    return new Promise((resolve) => {
        const timeout = setTimeout(() => {
            resolve({
                success: false,
                error: 'Request timeout',
                traceId,
                opId,
            });
        }, 30000);

        const messageHandler = (event: MessageEvent) => {
            const response = event.data;
            if (response.requestId !== requestId) return;

            clearTimeout(timeout);
            self.removeEventListener('message', messageHandler);

            resolve({
                success: response.success,
                data: response.data,
                error: response.error,
                traceId: response.traceId,
                opId: response.opId,
            });
        };

        self.addEventListener('message', messageHandler);

        // Send intent to host
        self.postMessage({
            type: 'INTENT_REQUEST',
            requestId,
            appId: bridgeConfig!.appId,
            traceId,
            opId,
            intent: {
                action,
                capability,
                params,
            },
        });
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// SDK Class
// ═══════════════════════════════════════════════════════════════════════════

export class RuntimeBridgeSDK {
    // ─────────────────────────────────────────────────────────────────────────
    // Initialization
    // ─────────────────────────────────────────────────────────────────────────

    static init(config: BridgeConfig): void {
        bridgeConfig = config;
        console.log(`[SDK] Initialized for ${config.appId}`);
        console.log(`[SDK] Granted capabilities:`, config.grantedCapabilities);

        // Send READY message
        self.postMessage({
            type: 'READY',
            requestId: generateRequestId(),
            appId: config.appId,
            traceId: generateTraceId(),
        });

        // Setup heartbeat
        setInterval(() => {
            self.postMessage({
                type: 'HEARTBEAT',
                requestId: generateRequestId(),
                appId: config.appId,
                traceId: generateTraceId(),
            });
        }, 10000);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // File System
    // ─────────────────────────────────────────────────────────────────────────

    static async readFile(options: FSReadOptions): Promise<SDKResult<FSReadResult>> {
        return sendIntent<FSReadResult>('fs.read', 'fs.read', options as Record<string, unknown>);
    }

    static async writeFile(options: FSWriteOptions): Promise<SDKResult<FSWriteResult>> {
        return sendIntent<FSWriteResult>('fs.write', 'fs.write', options as Record<string, unknown>);
    }

    static async readTemp(path: string): Promise<SDKResult<FSReadResult>> {
        return sendIntent<FSReadResult>('fs.readTemp', 'fs.temp', { path });
    }

    static async writeTemp(path: string, data: string | ArrayBuffer): Promise<SDKResult<FSWriteResult>> {
        return sendIntent<FSWriteResult>('fs.writeTemp', 'fs.temp', { path, data });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UI
    // ─────────────────────────────────────────────────────────────────────────

    static async notify(options: UINotifyOptions): Promise<SDKResult<void>> {
        return sendIntent<void>('ui.notify', 'ui.notify', options as Record<string, unknown>);
    }

    static async openWindow(options: UIWindowOptions): Promise<SDKResult<{ windowId: string }>> {
        return sendIntent<{ windowId: string }>('ui.openWindow', 'ui.window', options as Record<string, unknown>);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Network
    // ─────────────────────────────────────────────────────────────────────────

    static async fetch(options: NetFetchOptions): Promise<SDKResult<NetFetchResult>> {
        return sendIntent<NetFetchResult>('net.fetch', 'net.fetch', options as Record<string, unknown>);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Process
    // ─────────────────────────────────────────────────────────────────────────

    static async spawnProcess(appId: string, args?: Record<string, unknown>): Promise<SDKResult<{ pid: string }>> {
        return sendIntent<{ pid: string }>('process.spawn', 'process.spawn', { appId, args });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Audit
    // ─────────────────────────────────────────────────────────────────────────

    static async readAuditLogs(limit: number = 25): Promise<SDKResult<any[]>> {
        return sendIntent<any[]>('audit.readLogs', 'audit.read', { limit });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Utilities
    // ─────────────────────────────────────────────────────────────────────────

    static hasCapability(capability: Capability): boolean {
        return bridgeConfig?.grantedCapabilities.includes(capability) || false;
    }

    static getGrantedCapabilities(): Capability[] {
        return bridgeConfig?.grantedCapabilities || [];
    }

    static getAppId(): string | null {
        return bridgeConfig?.appId || null;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// Auto-init from INIT message
// ═══════════════════════════════════════════════════════════════════════════

self.addEventListener('message', (event) => {
    const message = event.data;
    if (message.type === 'INIT' && message.payload?.grantedCapabilities) {
        RuntimeBridgeSDK.init({
            appId: message.appId,
            grantedCapabilities: message.payload.grantedCapabilities,
        });
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// Error Handler
// ═══════════════════════════════════════════════════════════════════════════

self.addEventListener('error', (event) => {
    console.error('[SDK] Uncaught error:', event.error);
    self.postMessage({
        type: 'ERROR',
        requestId: generateRequestId(),
        appId: bridgeConfig?.appId || 'unknown',
        traceId: generateTraceId(),
        error: event.error?.message || 'Unknown error',
    });
});
