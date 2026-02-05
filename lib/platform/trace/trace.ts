/**
 * TraceId Utilities
 * 
 * Phase 14.2: Trace Correlation
 * 
 * Provides traceId generation and management for client-side requests.
 * Each user interaction gets a unique traceId that propagates through:
 * - Client fetch requests (x-trace-id header)
 * - API processing
 * - Audit log persistence
 * 
 * Strategy: Per-interaction tracing (recommended for audit correlation)
 */

/**
 * Generate a new traceId
 * Format: UUID v4
 */
export function generateTraceId(): string {
    return crypto.randomUUID();
}

/**
 * Create a new trace for a user interaction
 * 
 * Use this for each discrete user action (click, navigation, etc.)
 * This ensures proper correlation in audit logs.
 * 
 * @returns New traceId for this interaction
 */
export function newInteractionTrace(): string {
    return generateTraceId();
}

/**
 * Storage key for current interaction trace
 */
const TRACE_STORAGE_KEY = '_current_trace_id';

/**
 * Get or create a trace for the current interaction
 * 
 * Note: This uses sessionStorage for temporary trace persistence
 * during a single interaction. For most cases, prefer newInteractionTrace()
 * for explicit per-action tracing.
 */
export function getOrCreateSessionTrace(): string {
    if (typeof window === 'undefined') {
        return generateTraceId();
    }

    try {
        const existing = sessionStorage.getItem(TRACE_STORAGE_KEY);
        if (existing) {
            return existing;
        }

        const newTrace = generateTraceId();
        sessionStorage.setItem(TRACE_STORAGE_KEY, newTrace);
        return newTrace;
    } catch {
        // Fallback if sessionStorage unavailable
        return generateTraceId();
    }
}

/**
 * Clear the current session trace
 * Useful when starting a completely new user flow
 */
export function clearSessionTrace(): void {
    if (typeof window === 'undefined') return;

    try {
        sessionStorage.removeItem(TRACE_STORAGE_KEY);
    } catch {
        // Ignore errors
    }
}
