/**
 * Phase 15B.4: Process Registry API
 * 
 * GET endpoint to list all registered processes.
 * Admin-only access.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth/server';
import { handleError } from '@super-platform/core';
import { extractOrGenerateTraceId, createTracedResponse } from '@/lib/platform/trace/server';
import { ProcessDescriptor } from '@/lib/process/types';

export const runtime = 'nodejs';

// In-memory process registry (shared with process-intents)
// In production, this would be stored in a database or Redis
const processRegistry = new Map<string, { ownerId: string; appId: string; createdAt: number; state: string }>();

export async function GET(request: NextRequest) {
    const traceId = extractOrGenerateTraceId(request);

    try {
        // Auth check
        const auth = await getAuthContext();
        if (!auth) {
            return createTracedResponse(
                { success: false, error: 'Unauthorized' },
                traceId,
                401
            );
        }

        const isAdmin = (auth as any).role === 'admin';

        // Admin-only for full list
        if (!isAdmin) {
            return createTracedResponse(
                { success: false, error: 'Admin access required' },
                traceId,
                403
            );
        }

        // Build process list
        const processes: ProcessDescriptor[] = [];
        for (const [pid, proc] of processRegistry.entries()) {
            processes.push({
                pid,
                appId: proc.appId,
                state: (proc.state || 'RUNNING') as any,
                startedAt: proc.createdAt,
                ownerId: proc.ownerId,
            });
        }

        return createTracedResponse(
            {
                success: true,
                processes,
                count: processes.length,
                traceId,
            },
            traceId,
            200
        );

    } catch (error: unknown) {
        const appError = handleError(error as Error);
        console.error(`[API:ProcessRegistry] Failed [${appError.errorId}]:`, appError.message);

        return createTracedResponse(
            { success: false, error: 'Internal server error' },
            traceId,
            500
        );
    }
}
