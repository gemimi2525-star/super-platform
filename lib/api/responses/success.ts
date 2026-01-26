/**
 * API Success Response Builder
 * 
 * Provides standardized methods for creating success responses.
 * Part of Phase 1 Step 1.3: API Error Responses
 */

import { NextResponse } from 'next/server';

/**
 * Standardized API success response builder
 */
export class ApiSuccessResponse {
    /**
     * 200 OK
     * Standard success response with data
     */
    static ok<T>(data: T): NextResponse {
        return NextResponse.json({
            success: true,
            data,
        }, { status: 200 });
    }

    /**
     * 201 Created
     * Resource created successfully
     */
    static created<T>(data: T): NextResponse {
        return NextResponse.json({
            success: true,
            data,
        }, { status: 201 });
    }

    /**
     * 204 No Content
     * Success with no response body (e.g., DELETE)
     */
    static noContent(): NextResponse {
        return new NextResponse(null, { status: 204 });
    }
}
