/**
 * API Fetch Wrapper
 * 
 * Type-safe wrapper around native fetch for consuming standardized API responses.
 * Automatically parses responses and throws errors for failed requests.
 * 
 * @example
 * ```typescript
 * import { apiFetch } from '@/lib/http/apiFetch';
 * 
 * // GET request
 * const user = await apiFetch<User>('/api/users/123');
 * 
 * // POST request
 * const newUser = await apiFetch<User>('/api/users', {
 *   method: 'POST',
 *   body: JSON.stringify({ name: 'John' })
 * });
 * ```
 */

import type { ApiResponse } from '@/lib/api';
import type { ApiError as ApiErrorType } from '@/lib/api';

/**
 * Custom error class for API errors
 * Preserves the full error response structure
 */
export class ApiError extends Error {
    public readonly response: ApiErrorType;
    public readonly status: number;

    constructor(errorResponse: ApiErrorType, status: number) {
        super(errorResponse.message);
        this.name = 'ApiError';
        this.response = errorResponse;
        this.status = status;
    }
}

/**
 * Type-safe API fetch wrapper
 * 
 * @template T The expected data type on success
 * @param url API endpoint URL
 * @param options Standard fetch options
 * @returns Promise resolving to the data on success
 * @throws {ApiError} When the API returns an error response
 * @throws {Error} When network or parsing fails
 */
export async function apiFetch<T = unknown>(
    url: string,
    options?: RequestInit
): Promise<T> {
    try {
        // Perform the fetch request
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers,
            },
        });

        // Parse the JSON response
        const data: ApiResponse<T> = await response.json();

        // Check if the response indicates success
        if (data.success) {
            return data.data;
        } else {
            // Throw ApiError with the error details
            throw new ApiError(data.error, response.status);
        }
    } catch (error) {
        // Re-throw ApiError as-is
        if (error instanceof ApiError) {
            throw error;
        }

        // Re-throw other errors (network, parsing, etc.)
        throw error;
    }
}

/**
 * Type guard to check if an error is an ApiError
 */
export function isApiError(error: unknown): error is ApiError {
    return error instanceof ApiError;
}
