/**
 * Server-side Trace Utilities
 * 
 * Phase 14.2: Trace Correlation
 * 
 * Provides traceId extraction and response header setting for API routes.
 * Ensures every API response includes x-trace-id for correlation.
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Extract traceId from request headers
 * If not present, generate a new one
 * 
 * @param request NextRequest object
 * @returns traceId string
 */
export function extractOrGenerateTraceId(request: NextRequest): string {
    const headerTraceId = request.headers.get('x-trace-id');

    if (headerTraceId) {
        return headerTraceId;
    }

    // Generate new traceId if client didn't provide one
    return crypto.randomUUID();
}

/**
 * Add traceId to response headers
 * 
 * @param response NextResponse object
 * @param traceId TraceId to add
 * @returns Modified response
 */
export function addTraceIdToResponse(response: NextResponse, traceId: string): NextResponse {
    response.headers.set('x-trace-id', traceId);
    return response;
}

/**
 * Create response with traceId header
 * Convenience wrapper for common pattern
 * 
 * @param data Response data
 * @param traceId TraceId to include
 * @param status HTTP status code
 * @returns NextResponse with traceId header
 */
export function createTracedResponse(
    data: any,
    traceId: string,
    status: number = 200
): NextResponse {
    const response = NextResponse.json(data, { status });
    response.headers.set('x-trace-id', traceId);
    return response;
}
