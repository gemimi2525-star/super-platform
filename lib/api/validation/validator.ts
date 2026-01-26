/**
 * API Request Validation Utilities
 * 
 * Provides validation helpers using Zod schemas.
 * Converts Zod errors to field-level ValidationError format.
 * Part of Phase 1 Step 1.3: API Error Responses
 */

import { z } from 'zod';
import type { ValidationError } from '../errors/types';

/**
 * Validation result types
 */
type ValidationSuccess<T> = {
    success: true;
    data: T;
};

type ValidationFailure = {
    success: false;
    errors: ValidationError[];
};

type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

/**
 * Validate request data against a Zod schema
 * 
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns ValidationResult with typed data or field-level errors
 * 
 * @example
 * const schema = z.object({
 *   email: z.string().email(),
 *   name: z.string().min(2)
 * });
 * 
 * const result = validateRequest(schema, body);
 * if (!result.success) {
 *   return ApiErrorResponse.validationError(result.errors);
 * }
 * 
 * // result.data is typed correctly
 * const { email, name } = result.data;
 */
export function validateRequest<T extends z.ZodSchema>(
    schema: T,
    data: unknown
): ValidationResult<z.infer<T>> {
    const result = schema.safeParse(data);

    if (result.success) {
        return {
            success: true,
            data: result.data,
        };
    }

    // Map Zod errors to our ValidationError format
    const errors: ValidationError[] = result.error.issues.map((err: z.ZodIssue) => {
        const field = err.path.join('.');

        return {
            field: field || 'unknown',
            message: err.message,
            code: err.code,
            // Include the value that failed validation (if available)
            value: err.path.length > 0 && data && typeof data === 'object'
                ? (data as Record<string, unknown>)[String(err.path[0])]
                : undefined,
        };
    });

    return {
        success: false,
        errors,
    };
}

/**
 * Validate query parameters
 * Convenience wrapper for validateRequest with better typing for URL params
 * 
 * @param schema - Zod schema to validate against
 * @param searchParams - URLSearchParams or query object
 * @returns ValidationResult
 * 
 * @example
 * const schema = z.object({
 *   page: z.coerce.number().int().positive(),
 *   limit: z.coerce.number().int().min(1).max(100)
 * });
 * 
 * const result = validateQueryParams(schema, request.nextUrl.searchParams);
 */
export function validateQueryParams<T extends z.ZodSchema>(
    schema: T,
    searchParams: URLSearchParams | Record<string, string>
): ValidationResult<z.infer<T>> {
    const params = searchParams instanceof URLSearchParams
        ? Object.fromEntries(searchParams.entries())
        : searchParams;

    return validateRequest(schema, params);
}
