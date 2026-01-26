/**
 * API Errors Module
 * Part of Phase 1 Step 1.3: API Error Responses
 */

// Export types
export {
    ApiErrorCode,
    type ValidationError,
    type ApiError,
    type ApiErrorResponse as ApiErrorResponseType,
    type ApiSuccessResponse as ApiSuccessResponseType,
    type ApiResponse,
} from './types';

// Export response builder class
export { ApiErrorResponse } from './response-builder';
