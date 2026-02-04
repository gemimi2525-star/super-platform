/**
 * Error Normalization
 * 
 * Converts various error types to standardized API error format.
 * Part of Phase 11: Production Hardening
 * 
 * SYNAPSE Kernel: FROZEN ❄️ - This module does NOT touch synapse-core
 */

import { generateErrorId } from '@super-platform/core';

// ============================================================================
// Extended Error Codes (Phase 11)
// ============================================================================

export const ErrorCodes = {
    // Auth errors
    AUTH_REQUIRED: 'AUTH_REQUIRED',
    AUTH_INVALID_SESSION: 'AUTH_INVALID_SESSION',
    AUTH_FORBIDDEN: 'AUTH_FORBIDDEN',

    // Policy errors
    POLICY_DENIED: 'POLICY_DENIED',
    POLICY_MISSING_CAP: 'POLICY_MISSING_CAP',

    // Data errors
    DATA_NOT_FOUND: 'DATA_NOT_FOUND',
    DATA_VALIDATION_FAILED: 'DATA_VALIDATION_FAILED',

    // Infrastructure errors
    INFRA_TIMEOUT: 'INFRA_TIMEOUT',
    INFRA_UNAVAILABLE: 'INFRA_UNAVAILABLE',
    INFRA_RATE_LIMIT: 'INFRA_RATE_LIMIT',

    // Bug/system errors
    BUG_UNHANDLED: 'BUG_UNHANDLED',
    BUG_INVARIANT_BROKEN: 'BUG_INVARIANT_BROKEN',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

// ============================================================================
// Error Payload Types
// ============================================================================

export interface ApiErrorPayload {
    ok: false;
    code: string;
    message: string;
    hint?: string;
    retryable: boolean;
    traceId: string;
    ts: string;
}

export interface ErrorContext {
    traceId?: string;
    path?: string;
    method?: string;
    authMode?: string;
}

// ============================================================================
// Retryable Error Detection
// ============================================================================

const RETRYABLE_CODES: Set<string> = new Set([
    ErrorCodes.INFRA_TIMEOUT,
    ErrorCodes.INFRA_UNAVAILABLE,
    ErrorCodes.INFRA_RATE_LIMIT,
]);

export function isRetryable(code: string): boolean {
    return RETRYABLE_CODES.has(code);
}

// ============================================================================
// Error Code Detection
// ============================================================================

/**
 * Detect appropriate error code from error instance.
 */
export function detectErrorCode(error: unknown): ErrorCode {
    if (error instanceof Error) {
        const err = error as Error & { code?: string; name?: string };

        // Check for explicit code
        if (err.code && typeof err.code === 'string') {
            // Map known codes
            if (err.code.startsWith('auth/')) {
                return ErrorCodes.AUTH_INVALID_SESSION;
            }
            if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
                return ErrorCodes.INFRA_TIMEOUT;
            }
            if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
                return ErrorCodes.INFRA_UNAVAILABLE;
            }
        }

        // Check for timeout in message
        if (err.message?.toLowerCase().includes('timeout')) {
            return ErrorCodes.INFRA_TIMEOUT;
        }

        // Check for network errors
        if (err.message?.toLowerCase().includes('network') ||
            err.message?.toLowerCase().includes('fetch')) {
            return ErrorCodes.INFRA_UNAVAILABLE;
        }
    }

    return ErrorCodes.BUG_UNHANDLED;
}

// ============================================================================
// Error Hints
// ============================================================================

const ERROR_HINTS: Record<string, string> = {
    [ErrorCodes.AUTH_REQUIRED]: 'Please sign in to continue',
    [ErrorCodes.AUTH_INVALID_SESSION]: 'Your session has expired. Please sign in again',
    [ErrorCodes.AUTH_FORBIDDEN]: 'You do not have permission to perform this action',
    [ErrorCodes.POLICY_DENIED]: 'This action is not allowed by policy',
    [ErrorCodes.POLICY_MISSING_CAP]: 'Required capability is not assigned',
    [ErrorCodes.DATA_NOT_FOUND]: 'The requested resource was not found',
    [ErrorCodes.DATA_VALIDATION_FAILED]: 'Please check your input and try again',
    [ErrorCodes.INFRA_TIMEOUT]: 'The request took too long. Please try again',
    [ErrorCodes.INFRA_UNAVAILABLE]: 'Service temporarily unavailable. Please try again later',
    [ErrorCodes.INFRA_RATE_LIMIT]: 'Too many requests. Please wait before trying again',
    [ErrorCodes.BUG_UNHANDLED]: 'An unexpected error occurred. Please try again',
    [ErrorCodes.BUG_INVARIANT_BROKEN]: 'System error. Please contact support',
};

export function getErrorHint(code: string): string {
    return ERROR_HINTS[code] || 'An error occurred';
}

// ============================================================================
// Main Normalizer
// ============================================================================

/**
 * Normalize any error to standard ApiErrorPayload.
 * This is the single entry point for all error normalization.
 */
export function normalizeError(
    error: unknown,
    context: ErrorContext = {}
): ApiErrorPayload {
    const traceId = context.traceId || generateErrorId();
    const ts = new Date().toISOString();

    // Handle null/undefined
    if (error === null || error === undefined) {
        return {
            ok: false,
            code: ErrorCodes.BUG_UNHANDLED,
            message: 'Unknown error',
            hint: getErrorHint(ErrorCodes.BUG_UNHANDLED),
            retryable: false,
            traceId,
            ts,
        };
    }

    // Handle Error instances
    if (error instanceof Error) {
        const err = error as Error & { code?: string };
        const code = err.code || detectErrorCode(error);

        // Sanitize message for production
        const message = process.env.NODE_ENV === 'production'
            ? getErrorHint(code)
            : err.message;

        return {
            ok: false,
            code,
            message,
            hint: getErrorHint(code),
            retryable: isRetryable(code),
            traceId,
            ts,
        };
    }

    // Handle string errors
    if (typeof error === 'string') {
        return {
            ok: false,
            code: ErrorCodes.BUG_UNHANDLED,
            message: process.env.NODE_ENV === 'production'
                ? 'An error occurred'
                : error,
            hint: getErrorHint(ErrorCodes.BUG_UNHANDLED),
            retryable: false,
            traceId,
            ts,
        };
    }

    // Handle objects with code/message
    if (typeof error === 'object') {
        const obj = error as Record<string, unknown>;
        const code = (typeof obj.code === 'string' ? obj.code : ErrorCodes.BUG_UNHANDLED);
        const message = typeof obj.message === 'string' ? obj.message : 'Unknown error';

        return {
            ok: false,
            code,
            message: process.env.NODE_ENV === 'production'
                ? getErrorHint(code)
                : message,
            hint: getErrorHint(code),
            retryable: isRetryable(code),
            traceId,
            ts,
        };
    }

    // Fallback
    return {
        ok: false,
        code: ErrorCodes.BUG_UNHANDLED,
        message: 'Unknown error',
        hint: getErrorHint(ErrorCodes.BUG_UNHANDLED),
        retryable: false,
        traceId,
        ts,
    };
}
