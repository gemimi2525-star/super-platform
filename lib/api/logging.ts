/**
 * API Logging Utilities
 * 
 * Centralized logging for API errors with standardized format.
 * Ensures safe logging without exposing sensitive data or stack traces in production.
 */

/**
 * Parameters for API error logging
 */
export interface ApiErrorLogParams {
    /** HTTP method (GET, POST, etc.) */
    method: string;

    /** API path (e.g., /api/roles) */
    path: string;

    /** Unique error ID for tracking */
    errorId: string;

    /** Sanitized error message (safe for logging) */
    message: string;

    /** Optional extra context (must be safe/sanitized) */
    extra?: Record<string, unknown>;
}

/**
 * Log API error with standardized format
 * 
 * Format: [API] <METHOD> <PATH> [<errorId>]: <message>
 * 
 * @example
 * ```ts
 * logApiError({
 *   method: 'POST',
 *   path: '/api/roles',
 *   errorId: 'err_1234567890_abc12',
 *   message: 'Validation failed',
 *   extra: { fields: ['name'] }
 * });
 * // Output: [API] POST /api/roles [err_1234567890_abc12]: Validation failed
 * ```
 */
export function logApiError(params: ApiErrorLogParams): void {
    const { method, path, errorId, message, extra } = params;

    // Base log message
    const logMessage = `[API] ${method} ${path} [${errorId}]: ${message}`;

    // Log to console.error
    if (extra && Object.keys(extra).length > 0) {
        // Log with extra context if provided
        console.error(logMessage, extra);
    } else {
        // Log without extra context
        console.error(logMessage);
    }

    // In production, you could also send to external logging service here
    // Example: if (process.env.NODE_ENV === 'production') { sendToLogService(...) }
}

/**
 * Log API success (optional - for debugging/monitoring)
 * 
 * Format: [API] <METHOD> <PATH>: Success
 */
export function logApiSuccess(params: {
    method: string;
    path: string;
    duration?: number;
}): void {
    const { method, path, duration } = params;

    const durationText = duration ? ` (${duration}ms)` : '';
    // console.log(`[API] ${method} ${path}: Success${durationText}`);
}

/**
 * Extract safe logging context from request
 * Helper to get method and path from NextRequest
 */
export function getRequestContext(request: Request): {
    method: string;
    path: string;
} {
    const url = new URL(request.url);
    return {
        method: request.method,
        path: url.pathname,
    };
}
