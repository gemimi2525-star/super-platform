/**
 * Phase 16: App Runtime Types
 * 
 * Type definitions for manifest, capabilities, runtime state, and IPC.
 */

// ═══════════════════════════════════════════════════════════════════════════
// Capabilities
// ═══════════════════════════════════════════════════════════════════════════

export type Capability =
    | 'fs.read'
    | 'fs.write'
    | 'fs.temp'
    | 'process.spawn'
    | 'net.fetch'
    | 'ui.window'
    | 'ui.notify'
    | 'audit.read';

export const ALL_CAPABILITIES: Capability[] = [
    'fs.read',
    'fs.write',
    'fs.temp',
    'process.spawn',
    'net.fetch',
    'ui.window',
    'ui.notify',
    'audit.read',
];

// ═══════════════════════════════════════════════════════════════════════════
// App Manifest
// ═══════════════════════════════════════════════════════════════════════════

export interface AppManifest {
    // Required
    appId: string;
    name: string;
    version: string;
    entry: string;

    // Runtime
    runtime: 'worker' | 'iframe';

    // Capabilities
    requestedCapabilities: Capability[];

    // Window (optional)
    defaultWindow?: {
        title?: string;
        icon?: string;
        width?: number;
        height?: number;
        resizable?: boolean;
    };

    // Integrity (optional)
    integrity?: {
        algorithm?: 'sha256' | 'sha384' | 'sha512';
        hash?: string;
        signature?: string;
    };

    // Metadata
    author?: string;
    description?: string;
    homepage?: string;
    license?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Runtime State
// ═══════════════════════════════════════════════════════════════════════════

export type RuntimeState = 'LOADING' | 'RUNNING' | 'SUSPENDED' | 'CRASHED' | 'TERMINATED';

export interface RuntimeInstance {
    appId: string;
    pid: string;
    state: RuntimeState;
    manifest: AppManifest;
    grantedCapabilities: Capability[];
    worker?: Worker;
    startedAt: number;
    lastHeartbeat?: number;
    crashCount: number;
    suspendedAt?: number;
    terminatedAt?: number;
    error?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// IPC Messages
// ═══════════════════════════════════════════════════════════════════════════

export type IPCMessageType =
    | 'INIT'
    | 'READY'
    | 'INTENT_REQUEST'
    | 'INTENT_RESPONSE'
    | 'HEARTBEAT'
    | 'ERROR'
    | 'TERMINATE';

export interface IPCMessage {
    type: IPCMessageType;
    requestId: string;
    appId: string;
    traceId: string;
    opId?: string;
    payload?: unknown;
    error?: string;
}

export interface IPCIntentRequest extends IPCMessage {
    type: 'INTENT_REQUEST';
    intent: {
        action: string;
        capability: Capability;
        params?: Record<string, unknown>;
    };
}

export interface IPCIntentResponse extends IPCMessage {
    type: 'INTENT_RESPONSE';
    success: boolean;
    data?: unknown;
    error?: string;
    decision?: {
        outcome: 'ALLOW' | 'DENY';
        reason?: string;
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// Runtime Errors
// ═══════════════════════════════════════════════════════════════════════════

export const RuntimeError = {
    INVALID_MANIFEST: 'INVALID_MANIFEST',
    CAPABILITY_DENIED: 'CAPABILITY_DENIED',
    RUNTIME_NOT_FOUND: 'RUNTIME_NOT_FOUND',
    RUNTIME_CRASHED: 'RUNTIME_CRASHED',
    DIRECT_API_BLOCKED: 'DIRECT_API_BLOCKED',
    INVALID_IPC_MESSAGE: 'INVALID_IPC_MESSAGE',
    SPAWN_FAILED: 'SPAWN_FAILED',
    ALREADY_RUNNING: 'ALREADY_RUNNING',
} as const;

export type RuntimeErrorCode = typeof RuntimeError[keyof typeof RuntimeError];

// ═══════════════════════════════════════════════════════════════════════════
// Capability Policy
// ═══════════════════════════════════════════════════════════════════════════

export type TrustLevel = 'first-party' | 'third-party-verified' | 'third-party-unverified';

export interface CapabilityPolicy {
    capability: Capability;
    allowedTrustLevels: TrustLevel[];
    requiresAdmin: boolean;
    rateLimit?: {
        requests: number;
        windowMs: number;
    };
    pathRestrictions?: string[];  // For fs capabilities
    domainAllowlist?: string[];   // For net.fetch
}

export const DEFAULT_CAPABILITY_POLICIES: CapabilityPolicy[] = [
    { capability: 'fs.read', allowedTrustLevels: ['first-party', 'third-party-verified'], requiresAdmin: false },
    { capability: 'fs.write', allowedTrustLevels: ['first-party'], requiresAdmin: false, pathRestrictions: ['temp://', 'user://'] },
    { capability: 'fs.temp', allowedTrustLevels: ['first-party', 'third-party-verified', 'third-party-unverified'], requiresAdmin: false },
    { capability: 'process.spawn', allowedTrustLevels: ['first-party'], requiresAdmin: false },
    { capability: 'net.fetch', allowedTrustLevels: ['first-party'], requiresAdmin: false },
    { capability: 'ui.window', allowedTrustLevels: ['first-party', 'third-party-verified'], requiresAdmin: false },
    { capability: 'ui.notify', allowedTrustLevels: ['first-party', 'third-party-verified'], requiresAdmin: false, rateLimit: { requests: 10, windowMs: 60000 } },
    { capability: 'audit.read', allowedTrustLevels: ['first-party'], requiresAdmin: true },
];

// ═══════════════════════════════════════════════════════════════════════════
// Result Types
// ═══════════════════════════════════════════════════════════════════════════

export interface RuntimeSpawnResult {
    success: boolean;
    appId?: string;
    pid?: string;
    grantedCapabilities?: Capability[];
    error?: RuntimeErrorCode;
    reason?: string;
}

export interface RuntimeIntentResult {
    success: boolean;
    action: string;
    appId: string;
    traceId: string;
    opId: string;
    data?: unknown;
    error?: RuntimeErrorCode;
    decision?: {
        outcome: 'ALLOW' | 'DENY';
        reason?: string;
    };
}
