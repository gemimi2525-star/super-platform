/**
 * Trace ID Management
 * 
 * Generates and propagates trace IDs for request correlation.
 * Part of Phase 11: Production Hardening
 * 
 * SYNAPSE Kernel: FROZEN ❄️ - This module does NOT touch synapse-core
 */

import { headers } from 'next/headers';
import { generateErrorId } from '@super-platform/core';

// ============================================================================
// Constants
// ============================================================================

export const TRACE_ID_HEADER = 'x-trace-id';

// ============================================================================
// Trace ID Generation
// ============================================================================

/**
 * Generate a new trace ID.
 */
export function generateTraceId(): string {
    return generateErrorId();
}

/**
 * Get trace ID from incoming request headers.
 * If not present, generates a new one.
 */
export async function getTraceId(): Promise<string> {
    try {
        const headersList = await headers();
        const existingTraceId = headersList.get(TRACE_ID_HEADER);
        if (existingTraceId) {
            return existingTraceId;
        }
    } catch {
        // headers() may throw outside of request context
    }
    return generateTraceId();
}

/**
 * Get trace ID from a Request object.
 */
export function getTraceIdFromRequest(request: Request): string {
    return request.headers.get(TRACE_ID_HEADER) || generateTraceId();
}

// ============================================================================
// Trace Context
// ============================================================================

export interface TraceContext {
    traceId: string;
    path: string;
    method: string;
    startTime: number;
    authMode?: string;
}

/**
 * Create trace context from a request.
 */
export function createTraceContext(request: Request): TraceContext {
    const url = new URL(request.url);
    return {
        traceId: getTraceIdFromRequest(request),
        path: url.pathname,
        method: request.method,
        startTime: Date.now(),
    };
}

/**
 * Add auth mode to trace context.
 */
export function withAuthMode(ctx: TraceContext, authMode: string): TraceContext {
    return { ...ctx, authMode };
}

// ============================================================================
// Response Header Injection
// ============================================================================

/**
 * Add trace ID to response headers.
 */
export function injectTraceIdHeader(
    response: Response,
    traceId: string
): Response {
    const newHeaders = new Headers(response.headers);
    newHeaders.set(TRACE_ID_HEADER, traceId);

    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
    });
}
