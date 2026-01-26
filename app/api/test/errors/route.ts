/**
 * TEST ROUTE: Error Response Patterns
 * 
 * This route tests all ApiErrorResponse methods.
 * Used to verify infrastructure works correctly.
 * DELETE THIS FILE after migration is complete.
 */

import { NextRequest } from 'next/server';
import { ApiErrorResponse } from '@/lib/api';

export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;
    const errorType = searchParams.get('type') || 'all';

    // Test different error types
    switch (errorType) {
        case 'bad-request':
            return ApiErrorResponse.badRequest('Invalid input provided');

        case 'unauthorized':
            return ApiErrorResponse.unauthorized();

        case 'forbidden':
            return ApiErrorResponse.forbidden('You do not have permission');

        case 'not-found':
            return ApiErrorResponse.notFound('User');

        case 'validation':
            return ApiErrorResponse.validationError([
                {
                    field: 'email',
                    message: 'Invalid email format',
                    code: 'invalid_string',
                    value: 'not-an-email',
                },
                {
                    field: 'password',
                    message: 'Password must be at least 8 characters',
                    code: 'too_small',
                },
            ]);

        case 'conflict':
            return ApiErrorResponse.conflict('Email already exists');

        case 'internal':
            return ApiErrorResponse.internalError();

        case 'rate-limit':
            return ApiErrorResponse.rateLimited('Too many requests', 60);

        default:
            // Return all error types for testing
            return ApiErrorResponse.badRequest(
                'Specify error type: bad-request, unauthorized, forbidden, not-found, validation, conflict, internal, rate-limit'
            );
    }
}
