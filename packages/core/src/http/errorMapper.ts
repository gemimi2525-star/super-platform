/**
 * Error Mapper
 * 
 * Maps API errors to appropriate UI handling strategies.
 * Determines whether errors should be shown as toasts, form errors, or trigger redirects.
 */

import type { ApiError as ApiErrorType } from '@/lib/api';
import { isValidationError } from '@/lib/api';

export type ErrorHandlingStrategy = 'toast' | 'form' | 'redirect';

export interface MappedError {
    /** How to handle this error in the UI */
    type: ErrorHandlingStrategy;

    /** User-friendly error message */
    message: string;

    /** Field-level errors (for form validation) */
    fieldErrors?: Array<{
        field: string;
        message: string;
    }>;

    /** Redirect path (for auth errors) */
    redirectTo?: string;

    /** Original error for debugging */
    originalError: ApiErrorType;
}

/**
 * Maps an API error to a UI handling strategy
 * 
 * @param error The API error to map
 * @returns Mapped error with handling strategy
 * 
 * @example
 * ```typescript
 * try {
 *   const user = await apiFetch<User>('/api/users');
 * } catch (error) {
 *   if (isApiError(error)) {
 *     const mapped = mapError(error.response);
 *     
 *     if (mapped.type === 'toast') {
 *       showToast(mapped.message);
 *     } else if (mapped.type === 'form') {
 *       setFormErrors(mapped.fieldErrors);
 *     } else if (mapped.type === 'redirect') {
 *       router.push(mapped.redirectTo);
 *     }
 *   }
 * }
 * ```
 */
export function mapError(error: ApiErrorType): MappedError {
    const code = error.code;

    // VALIDATION_ERROR → form errors
    if (code === 'VALIDATION_ERROR' && 'errors' in error && error.errors) {
        return {
            type: 'form',
            message: error.message || 'Validation failed',
            fieldErrors: error.errors.map(err => ({
                field: err.field,
                message: err.message,
            })),
            originalError: error,
        };
    }

    // UNAUTHORIZED → redirect to login
    if (code === 'UNAUTHORIZED') {
        return {
            type: 'redirect',
            message: error.message || 'Please log in to continue',
            redirectTo: '/auth/login',
            originalError: error,
        };
    }

    // FORBIDDEN → toast with specific message
    if (code === 'FORBIDDEN') {
        return {
            type: 'toast',
            message: error.message || 'You do not have permission to perform this action',
            originalError: error,
        };
    }

    // BAD_REQUEST → toast with error details
    if (code === 'BAD_REQUEST') {
        return {
            type: 'toast',
            message: error.message || 'Invalid request',
            originalError: error,
        };
    }

    // NOT_FOUND → toast
    if (code === 'NOT_FOUND') {
        return {
            type: 'toast',
            message: error.message || 'Resource not found',
            originalError: error,
        };
    }

    // CONFLICT → toast
    if (code === 'CONFLICT') {
        return {
            type: 'toast',
            message: error.message || 'Resource conflict',
            originalError: error,
        };
    }

    // INTERNAL_ERROR or any other → generic toast
    return {
        type: 'toast',
        message: 'An unexpected error occurred. Please try again later.',
        originalError: error,
    };
}
