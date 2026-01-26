/**
 * API Response Types
 * 
 * Frontend-ready type definitions for all API responses.
 * Use these types for type-safe API integration.
 * 
 * @example
 * ```typescript
 * import type { ApiResponse, ApiError } from '@/lib/api';
 * 
 * type UsersResponse = ApiResponse<User[]>;
 * type UserResponse = ApiResponse<User>;
 * ```
 */

// Re-export error types from errors module
export type { ApiErrorCode, ValidationError, ApiError } from './errors/types';

// ============================================================================
// Success Response Types
// ============================================================================

/**
 * Successful API response wrapper
 * @template T The type of data returned in the response
 */
export interface ApiSuccessResponse<T = unknown> {
    success: true;
    data: T;
}

// ============================================================================
// Error Response Types
// ============================================================================

/**
 * Base error response structure
 */
export interface ApiErrorBase {
    code: string;
    message: string;
    errorId: string;
    timestamp: string;
    path?: string;
    method?: string;
}

/**
 * Validation error with field-level details
 */
export interface ApiValidationError extends ApiErrorBase {
    code: 'VALIDATION_ERROR';
    errors: Array<{
        field: string;
        message: string;
        code: string;
        value?: unknown;
    }>;
}

/**
 * Generic API error (non-validation)
 */
export interface ApiGenericError extends ApiErrorBase {
    code: Exclude<string, 'VALIDATION_ERROR'>;
    errors?: never;
}

/**
 * Error response wrapper (union of all error types)
 */
export interface ApiErrorResponse {
    success: false;
    error: ApiValidationError | ApiGenericError;
}

// ============================================================================
// Generic API Response (Success | Error)
// ============================================================================

/**
 * Generic API response type (success or error)
 * @template T The type of data returned on success
 * 
 * @example
 * ```typescript
 * type RolesResponse = ApiResponse<Role[]>;
 * type UserResponse = ApiResponse<User>;
 * ```
 */
export type ApiResponse<T = unknown> =
    | ApiSuccessResponse<T>
    | ApiErrorResponse;

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if response is successful
 */
export function isApiSuccess<T>(
    response: ApiResponse<T>
): response is ApiSuccessResponse<T> {
    return response.success === true;
}

/**
 * Type guard to check if response is an error
 */
export function isApiError<T>(
    response: ApiResponse<T>
): response is ApiErrorResponse {
    return response.success === false;
}

/**
 * Type guard to check if error is a validation error
 */
export function isValidationError(
    error: ApiErrorResponse['error']
): error is ApiValidationError {
    return error.code === 'VALIDATION_ERROR';
}
