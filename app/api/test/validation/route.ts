/**
 * TEST ROUTE: Validation Pattern
 * 
 * This route tests validateRequest with Zod schemas.
 * Used to verify validation infrastructure works correctly.
 * DELETE THIS FILE after migration is complete.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ApiErrorResponse, ApiSuccessResponse, validateRequest } from '@/lib/api';

// Test schema
const createUserSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    age: z.number().int().min(18, 'Must be 18 or older').optional(),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate request body
        const validation = validateRequest(createUserSchema, body);

        if (!validation.success) {
            return ApiErrorResponse.validationError(validation.errors);
        }

        // If validation passes, return success
        return ApiSuccessResponse.created({
            message: 'Validation passed',
            data: validation.data,
        });
    } catch (error) {
        return ApiErrorResponse.internalError('Failed to process request');
    }
}
