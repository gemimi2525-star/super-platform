/**
 * Filesystem Security Dispatcher (Client-side)
 * 
 * Phase 15A.3: Security v0 (Logout & Handle Control)
 * 
 * This is the ONLY way for UI/App layer to trigger security events.
 * All security operations are dispatched to the server-side API which:
 * - Writes canonical audit entries
 * - Returns policy instruction for client to execute
 * 
 * ❌ NO policy logic here
 * ❌ NO direct wipe execution (server instructs, client executes)
 * ✅ Only dispatches to /api/platform/fs-security
 */

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export type FsSecurityPolicy = 'soft_lock' | 'clear';

export interface FsSecurityResult {
    success: boolean;
    policy?: 'SOFT_LOCK' | 'CLEAR';
    instruction?: 'CLOSE_HANDLES_LOCK_STATE' | 'WIPE_USER_TEMP_LOCK_STATE';
    opId?: string;
    traceId?: string;
    error?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// TraceId Helper
// ═══════════════════════════════════════════════════════════════════════════

function generateSecurityTraceId(): string {
    return `SEC-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// Dispatcher
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Dispatch a filesystem security intent to the server-side API.
 * 
 * This triggers logout security events:
 * - soft_lock: Close handles, lock filesystem state
 * - clear: Wipe user/temp data, close handles, lock state
 * 
 * @param policy - 'soft_lock' or 'clear'
 * @param openHandlesBefore - Current open handle count (for audit)
 * @param traceId - Optional trace ID (will generate if not provided)
 */
export async function dispatchFsSecurity(
    policy: FsSecurityPolicy,
    openHandlesBefore: number = 0,
    traceId?: string
): Promise<FsSecurityResult> {
    const useTraceId = traceId || generateSecurityTraceId();
    const action = `os.fs.logout.${policy}`;

    try {
        const response = await fetch('/api/platform/fs-security', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-trace-id': useTraceId,
            },
            body: JSON.stringify({
                action,
                openHandlesBefore,
            }),
        });

        const data = await response.json();

        // Attach traceId from response header if available
        const responseTraceId = response.headers.get('x-trace-id') || data.traceId || useTraceId;

        return {
            ...data,
            traceId: responseTraceId,
        };
    } catch (error: any) {
        console.error('[dispatchFsSecurity] Network error:', error);
        return {
            success: false,
            error: 'NETWORK_ERROR',
            traceId: useTraceId,
        };
    }
}
