/**
 * API Error Response Builder
 * 
 * Provides standardized methods for creating error responses.
 * All methods include errorId for tracking and proper HTTP status codes.
 * Part of Phase 1 Step 1.3: API Error Responses
 */

import { NextResponse } from 'next/server';
import { handleError } from '@super-platform/core';
import { ApiErrorCode, type ValidationError } from './types';

/**
 * Standardized API error response builder
 */
export class ApiErrorResponse {
    /**
     * 400 Bad Request
     * General client error
     */
    static badRequest(
        message: string = 'Bad request',
        errors?: ValidationError[]
    ): NextResponse {
        const appError = handleError(new Error(message));

        return NextResponse.json({
            success: false,
            error: {
                code: ApiErrorCode.BAD_REQUEST,
                message,
                errors,
                errorId: appError.errorId,
                timestamp: new Date().toISOString(),
            }
        }, { status: 400 });
    }

    /**
     * 401 Unauthorized
     * Missing or invalid authentication
     */
    static unauthorized(message: string = 'Unauthorized'): NextResponse {
        const appError = handleError(new Error(message));

        return NextResponse.json({
            success: false,
            error: {
                code: ApiErrorCode.UNAUTHORIZED,
                message,
                errorId: appError.errorId,
                timestamp: new Date().toISOString(),
            }
        }, { status: 401 });
    }

    /**
     * 403 Forbidden
     * Authenticated but not authorized
     */
    static forbidden(message: string = 'Forbidden'): NextResponse {
        const appError = handleError(new Error(message));

        return NextResponse.json({
            success: false,
            error: {
                code: ApiErrorCode.FORBIDDEN,
                message,
                errorId: appError.errorId,
                timestamp: new Date().toISOString(),
            }
        }, { status: 403 });
    }

    /**
     * 404 Not Found
     * Resource does not exist
     */
    static notFound(resource: string = 'Resource'): NextResponse {
        const message = `${resource} not found`;
        const appError = handleError(new Error(message));

        return NextResponse.json({
            success: false,
            error: {
                code: ApiErrorCode.NOT_FOUND,
                message,
                errorId: appError.errorId,
                timestamp: new Date().toISOString(),
            }
        }, { status: 404 });
    }

    /**
     * 400 Validation Error
     * Field-level validation failures
     */
    static validationError(
        errors: ValidationError[],
        message: string = 'Validation failed'
    ): NextResponse {
        const appError = handleError(new Error(message));

        return NextResponse.json({
            success: false,
            error: {
                code: ApiErrorCode.VALIDATION_ERROR,
                message,
                errors,
                errorId: appError.errorId,
                timestamp: new Date().toISOString(),
            }
        }, { status: 400 });
    }

    /**
     * 409 Conflict
     * Resource conflict (e.g., duplicate email)
     */
    static conflict(message: string = 'Resource conflict'): NextResponse {
        const appError = handleError(new Error(message));

        return NextResponse.json({
            success: false,
            error: {
                code: ApiErrorCode.CONFLICT,
                message,
                errorId: appError.errorId,
                timestamp: new Date().toISOString(),
            }
        }, { status: 409 });
    }

    /**
     * 500 Internal Server Error
     * Generic server error (sanitized message)
     */
    static internalError(
        message: string = 'An unexpected error occurred'
    ): NextResponse {
        const appError = handleError(new Error(message));

        // In production, always use generic message for security
        const publicMessage = process.env.NODE_ENV === 'production'
            ? 'An unexpected error occurred'
            : message;

        return NextResponse.json({
            success: false,
            error: {
                code: ApiErrorCode.INTERNAL_ERROR,
                message: publicMessage,
                errorId: appError.errorId,
                timestamp: new Date().toISOString(),
            }
        }, { status: 500 });
    }

    /**
     * 429 Rate Limited
     * Too many requests
     */
    static rateLimited(
        message: string = 'Too many requests',
        retryAfter?: number
    ): NextResponse {
        const appError = handleError(new Error(message));

        const response = NextResponse.json({
            success: false,
            error: {
                code: ApiErrorCode.RATE_LIMITED,
                message,
                errorId: appError.errorId,
                timestamp: new Date().toISOString(),
            }
        }, { status: 429 });

        if (retryAfter) {
            response.headers.set('Retry-After', retryAfter.toString());
        }

        return response;
    }
    /**
     * 503 Service Unavailable
     * Temporary server overload or maintenance
     */
    static serviceUnavailable(
        message: string = 'Service temporarily unavailable',
        retryAfter?: number
    ): NextResponse {
        const appError = handleError(new Error(message));

        const response = NextResponse.json({
            success: false,
            error: {
                code: ApiErrorCode.SERVICE_UNAVAILABLE,
                message,
                errorId: appError.errorId,
                timestamp: new Date().toISOString(),
            }
        }, { status: 503 });

        if (retryAfter) {
            response.headers.set('Retry-After', retryAfter.toString());
        }

        return response;
    }
}
