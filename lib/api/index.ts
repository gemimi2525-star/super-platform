/**
 * API Layer Main Exports
 * 
 * Centralized exports for all API error handling, responses, and validation.
 * Part of Phase 1 Step 1.3: API Error Responses
 * 
 * Usage:
 * ```typescript
 * import { ApiErrorResponse, ApiSuccessResponse, validateRequest } from '@/lib/api';
 * ```
 */

// Error responses
export { ApiErrorResponse } from './errors/response-builder';
export { ApiErrorCode } from './errors/types';
export type {
    ValidationError,
    ApiError,
    ApiErrorResponse as ApiErrorResponseType,
    ApiSuccessResponse as ApiSuccessResponseType,
    ApiResponse,
} from './errors/types';

// New type exports from types.ts (for frontend consumption)
export type {
    ApiResponse as ApiResponseUnion,
    ApiSuccessResponse as ApiSuccessType,
    ApiErrorResponse as ApiErrorType,
    ApiErrorBase,
    ApiValidationError,
    ApiGenericError,
} from './types';

// Type guard exports
export { isApiSuccess, isApiError, isValidationError } from './types';

// Success responses
export { ApiSuccessResponse } from './responses/success';

// Validation
export { validateRequest, validateQueryParams } from './validation/validator';
