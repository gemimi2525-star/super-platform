/**
 * API Error Types and Interfaces
 * 
 * Standardized error codes and response structures for all API endpoints.
 * Part of Phase 1 Step 1.3: API Error Responses
 */

/**
 * Standard API error codes
 */
export enum ApiErrorCode {
    // Client Errors (4xx)
    BAD_REQUEST = 'BAD_REQUEST',
    UNAUTHORIZED = 'UNAUTHORIZED',
    FORBIDDEN = 'FORBIDDEN',
    NOT_FOUND = 'NOT_FOUND',
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    CONFLICT = 'CONFLICT',
    RATE_LIMITED = 'RATE_LIMITED',

    // Server Errors (5xx)
    INTERNAL_ERROR = 'INTERNAL_ERROR',
    SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
    DATABASE_ERROR = 'DATABASE_ERROR',
    TIMEOUT = 'TIMEOUT',
}

/**
 * Field-level validation error
 */
export interface ValidationError {
    field: string;
    message: string;
    code: string;
    value?: unknown;
}

/**
 * Standard API error structure
 */
export interface ApiError {
    code: ApiErrorCode;
    message: string;
    errors?: ValidationError[];
    errorId: string;
    timestamp: string;
    path?: string;
    method?: string;
}

/**
 * API error response wrapper
 */
export interface ApiErrorResponse {
    success: false;
    error: ApiError;
}

/**
 * API success response wrapper
 */
export interface ApiSuccessResponse<T = unknown> {
    success: true;
    data: T;
}

/**
 * Generic API response type
 */
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;
