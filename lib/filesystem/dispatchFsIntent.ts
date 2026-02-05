/**
 * Filesystem Intent Dispatcher (Client-side)
 * 
 * Phase 15A.2: Intent-only Enforcement
 * 
 * This is the ONLY way for UI/App layer to access filesystem operations.
 * All operations are dispatched to the server-side API which:
 * - Evaluates Policy v0 (source of truth)
 * - Executes via Kernel (FileSystemService)
 * - Writes canonical audit entries
 * 
 * ❌ NO policy logic here
 * ❌ NO direct FileSystemService access
 * ✅ Only dispatches to /api/platform/fs-intents
 */

import type { FsIntentMeta } from '../platform/types/intent-events';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export type FsIntentAction =
    | 'os.fs.read'
    | 'os.fs.write'
    | 'os.fs.delete'
    | 'os.fs.list'
    | 'os.fs.mkdir'
    | 'os.fs.stat'
    | 'os.fs.rename'
    | 'os.fs.move'
    | 'os.fs.copy'
    | 'os.fs.openHandle'
    | 'os.fs.closeHandle'
    | 'os.fs.shareHandle';

export interface FsIntent {
    action: FsIntentAction;
    meta: FsIntentMeta;
    content?: string;       // Base64 encoded for binary, plain text for strings
    options?: {
        create?: boolean;
        overwrite?: boolean;
        mimeType?: string;
    };
}

export interface FsDecision {
    outcome: 'ALLOW' | 'DENY';
    errorCode?: string;
    reason?: string;
    policyKey?: string;
}

export interface FsResult {
    success: boolean;
    data?: any;
    decision?: FsDecision;
    opId?: string;
    traceId?: string;
    errorCode?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// TraceId Helper (Client-side)
// ═══════════════════════════════════════════════════════════════════════════

const TRACE_STORAGE_KEY = 'synapse_trace_id';

function getOrCreateClientTraceId(): string {
    // Check if we have an active trace in session
    if (typeof window !== 'undefined') {
        const existing = sessionStorage.getItem(TRACE_STORAGE_KEY);
        if (existing) return existing;

        // Generate new trace
        const newTraceId = `CL-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
        sessionStorage.setItem(TRACE_STORAGE_KEY, newTraceId);
        return newTraceId;
    }
    // Fallback for SSR
    return `SSR-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// Dispatcher
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Dispatch a filesystem intent to the server-side API.
 * 
 * This is the ONLY entry point for filesystem operations from UI/App layer.
 * 
 * @example
 * ```tsx
 * const result = await dispatchFsIntent({
 *     action: 'os.fs.write',
 *     meta: { path: 'user://docs/file.txt', scheme: 'user' },
 *     content: 'Hello World',
 *     options: { create: true }
 * });
 * if (!result.success) {
 *     console.error(result.errorCode);
 * }
 * ```
 */
export async function dispatchFsIntent(intent: FsIntent): Promise<FsResult> {
    const traceId = getOrCreateClientTraceId();

    try {
        const response = await fetch('/api/platform/fs-intents', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-trace-id': traceId,
            },
            body: JSON.stringify(intent),
        });

        const data = await response.json();

        // Attach traceId from response header if available
        const responseTraceId = response.headers.get('x-trace-id') || data.traceId || traceId;

        return {
            ...data,
            traceId: responseTraceId,
        };
    } catch (error: any) {
        console.error('[dispatchFsIntent] Network error:', error);
        return {
            success: false,
            errorCode: 'NETWORK_ERROR',
            traceId,
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// Helper to extract scheme from path
// ═══════════════════════════════════════════════════════════════════════════

export function extractScheme(path: string): 'user' | 'temp' | 'system' | null {
    const match = path.match(/^(user|temp|system):\/\//);
    return match ? (match[1] as 'user' | 'temp' | 'system') : null;
}

/**
 * Build FsIntentMeta from a path (convenience helper)
 */
export function buildFsMeta(path: string, opts?: { fileSize?: number; destPath?: string }): FsIntentMeta {
    const scheme = extractScheme(path);
    if (!scheme) throw new Error(`Invalid path scheme: ${path}`);

    return {
        path,
        scheme,
        fileSize: opts?.fileSize,
        destPath: opts?.destPath,
    };
}
