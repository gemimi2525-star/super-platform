/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NEXUS Shell — Safe Fetch (Phase 7.2)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Resilient fetch wrapper that never throws.
 * Returns typed result/error objects for graceful handling.
 * 
 * Part of: NEXUS Shell → ORBIT Window System → SYNAPSE Kernel
 * 
 * @module coreos/safe-fetch
 * @version 1.0.0 (Phase 7.2)
 */

import { getConnectivityStatus, type ConnectivityStatus } from './connectivity';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type SafeFetchErrorType =
    | 'OFFLINE'
    | 'TIMEOUT'
    | 'DEGRADED'
    | 'AUTH_REQUIRED'
    | 'SERVER_ERROR'
    | 'NETWORK_ERROR'
    | 'PARSE_ERROR';

export interface SafeFetchError {
    type: SafeFetchErrorType;
    message: string;
    status?: number;
    retryable: boolean;
}

export interface SafeFetchSuccess<T> {
    ok: true;
    data: T;
    status: number;
}

export interface SafeFetchFailure {
    ok: false;
    error: SafeFetchError;
}

export type SafeFetchResult<T> = SafeFetchSuccess<T> | SafeFetchFailure;

export interface SafeFetchOptions extends Omit<RequestInit, 'signal'> {
    timeout?: number;
    retries?: number;
    retryDelay?: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const DEFAULT_TIMEOUT_MS = 8000;
const DEFAULT_RETRIES = 0;
const DEFAULT_RETRY_DELAY_MS = 1000;
const MAX_RETRIES = 3;

// ═══════════════════════════════════════════════════════════════════════════
// SAFE FETCH IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * safeFetch — Resilient fetch that never throws
 * 
 * @param url - Request URL
 * @param options - Fetch options + timeout/retry config
 * @returns Promise<SafeFetchResult<T>> — Always resolves, never throws
 * 
 * @example
 * const result = await safeFetch<User>('/api/user');
 * if (result.ok) {
 *     console.log(result.data);
 * } else {
 *     console.log(result.error.type, result.error.message);
 * }
 */
export async function safeFetch<T = unknown>(
    url: string,
    options: SafeFetchOptions = {}
): Promise<SafeFetchResult<T>> {
    const {
        timeout = DEFAULT_TIMEOUT_MS,
        retries = DEFAULT_RETRIES,
        retryDelay = DEFAULT_RETRY_DELAY_MS,
        ...fetchOptions
    } = options;

    // Check connectivity first
    const connectivityStatus = getConnectivityStatus();
    if (connectivityStatus === 'OFFLINE') {
        return {
            ok: false,
            error: {
                type: 'OFFLINE',
                message: 'Device is offline',
                retryable: true,
            },
        };
    }

    // Attempt fetch with retries
    const maxAttempts = Math.min(retries + 1, MAX_RETRIES + 1);
    let lastError: SafeFetchError | null = null;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        if (attempt > 0) {
            // Wait before retry with exponential backoff
            await sleep(retryDelay * Math.pow(2, attempt - 1));
        }

        const result = await attemptFetch<T>(url, fetchOptions, timeout);

        if (result.ok) {
            return result;
        }

        lastError = result.error;

        // Don't retry non-retryable errors
        if (!result.error.retryable) {
            return result;
        }
    }

    // All retries exhausted
    return {
        ok: false,
        error: lastError || {
            type: 'NETWORK_ERROR',
            message: 'Request failed after retries',
            retryable: false,
        },
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// INTERNAL HELPERS
// ═══════════════════════════════════════════════════════════════════════════

async function attemptFetch<T>(
    url: string,
    options: RequestInit,
    timeout: number
): Promise<SafeFetchResult<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Handle HTTP error statuses
        if (!response.ok) {
            return handleHttpError(response);
        }

        // Parse JSON response
        try {
            const data = await response.json() as T;
            return {
                ok: true,
                data,
                status: response.status,
            };
        } catch {
            // JSON parse error — try to return text
            return {
                ok: false,
                error: {
                    type: 'PARSE_ERROR',
                    message: 'Failed to parse response',
                    status: response.status,
                    retryable: false,
                },
            };
        }
    } catch (err) {
        clearTimeout(timeoutId);
        return handleFetchError(err);
    }
}

function handleHttpError(response: Response): SafeFetchFailure {
    const status = response.status;

    if (status === 401 || status === 403) {
        return {
            ok: false,
            error: {
                type: 'AUTH_REQUIRED',
                message: status === 401 ? 'Authentication required' : 'Access denied',
                status,
                retryable: false,
            },
        };
    }

    if (status >= 500) {
        return {
            ok: false,
            error: {
                type: 'SERVER_ERROR',
                message: `Server error: ${status}`,
                status,
                retryable: true,
            },
        };
    }

    // 4xx errors (except auth)
    return {
        ok: false,
        error: {
            type: 'SERVER_ERROR',
            message: `Request failed: ${status}`,
            status,
            retryable: false,
        },
    };
}

function handleFetchError(err: unknown): SafeFetchFailure {
    // Abort controller timeout
    if (err instanceof DOMException && err.name === 'AbortError') {
        return {
            ok: false,
            error: {
                type: 'TIMEOUT',
                message: 'Request timed out',
                retryable: true,
            },
        };
    }

    // Network error (CORS, DNS, etc.)
    if (err instanceof TypeError) {
        // Check if we're actually offline now
        const status = getConnectivityStatus();
        if (status === 'OFFLINE') {
            return {
                ok: false,
                error: {
                    type: 'OFFLINE',
                    message: 'Device went offline',
                    retryable: true,
                },
            };
        }

        return {
            ok: false,
            error: {
                type: 'NETWORK_ERROR',
                message: 'Network request failed',
                retryable: true,
            },
        };
    }

    // Unknown error
    return {
        ok: false,
        error: {
            type: 'NETWORK_ERROR',
            message: err instanceof Error ? err.message : 'Unknown error',
            retryable: true,
        },
    };
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ═══════════════════════════════════════════════════════════════════════════
// CONVENIENCE WRAPPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET request with safeFetch
 */
export function safeGet<T>(url: string, options?: SafeFetchOptions): Promise<SafeFetchResult<T>> {
    return safeFetch<T>(url, { ...options, method: 'GET' });
}

/**
 * POST request with safeFetch
 */
export function safePost<T>(
    url: string,
    body?: unknown,
    options?: SafeFetchOptions
): Promise<SafeFetchResult<T>> {
    return safeFetch<T>(url, {
        ...options,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
        body: body ? JSON.stringify(body) : undefined,
    });
}
