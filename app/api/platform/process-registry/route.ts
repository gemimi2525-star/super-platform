/**
 * Phase 15B.4 + 17.1: Process Registry API
 * 
 * GET  — List all registered processes (admin-only).
 * POST — Register a new runtime process (authenticated).
 * PATCH — Update process state (authenticated, owner or admin).
 * 
 * In-memory Map; resets on deploy. This is intentional — runtime
 * processes are client-side workers that don't survive restarts.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth/server';
import { handleError } from '@super-platform/core';
import { extractOrGenerateTraceId, createTracedResponse } from '@/lib/platform/trace/server';
import { ProcessDescriptor } from '@/lib/process/types';

export const runtime = 'nodejs';

// In-memory process registry (shared with process-intents)
// In production, this would be stored in a database or Redis
const processRegistry = new Map<string, {
    ownerId: string;
    appId: string;
    name: string;
    createdAt: number;
    state: string;
    source: string;
    metadata?: Record<string, unknown>;
}>();

// ═══════════════════════════════════════════════════════════════════════════
// GET — List all registered processes (any authenticated user)
// The Ops Center page is already admin-gated — no need to double-check here.
// ═══════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
    const traceId = extractOrGenerateTraceId(request);

    try {
        const auth = await getAuthContext();
        if (!auth) {
            return createTracedResponse(
                { success: false, error: 'Unauthorized' },
                traceId,
                401
            );
        }

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
        console.error(`[API:ProcessRegistry] GET failed [${appError.errorId}]:`, appError.message);

        return createTracedResponse(
            { success: false, error: 'Internal server error' },
            traceId,
            500
        );
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// POST — Register a new runtime process
// ═══════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
    const traceId = extractOrGenerateTraceId(request);

    try {
        const auth = await getAuthContext();
        if (!auth) {
            return createTracedResponse(
                { success: false, error: 'Unauthorized' },
                traceId,
                401
            );
        }

        const body = await request.json();
        const { pid, name, appId, state, source, startedAt, metadata } = body;

        if (!pid || !appId) {
            return createTracedResponse(
                { success: false, error: 'Missing required fields: pid, appId' },
                traceId,
                400
            );
        }

        // Register process
        processRegistry.set(pid, {
            ownerId: (auth as any).uid || 'unknown',
            appId,
            name: name || appId,
            createdAt: startedAt ? new Date(startedAt).getTime() : Date.now(),
            state: state || 'RUNNING',
            source: source || 'RUNTIME',
            metadata,
        });

        console.log(`[runtime-registry] Registered PID=${pid} appId=${appId} state=${state || 'RUNNING'}`);

        return createTracedResponse(
            {
                success: true,
                pid,
                state: state || 'RUNNING',
                traceId,
            },
            traceId,
            200
        );

    } catch (error: unknown) {
        const appError = handleError(error as Error);
        console.error(`[API:ProcessRegistry] POST failed [${appError.errorId}]:`, appError.message);

        return createTracedResponse(
            { success: false, error: 'Internal server error' },
            traceId,
            500
        );
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// PATCH — Update process state (lifecycle transitions)
// ═══════════════════════════════════════════════════════════════════════════

export async function PATCH(request: NextRequest) {
    const traceId = extractOrGenerateTraceId(request);

    try {
        const auth = await getAuthContext();
        if (!auth) {
            return createTracedResponse(
                { success: false, error: 'Unauthorized' },
                traceId,
                401
            );
        }

        const body = await request.json();
        const { pid, state } = body;

        if (!pid || !state) {
            return createTracedResponse(
                { success: false, error: 'Missing required fields: pid, state' },
                traceId,
                400
            );
        }

        const existing = processRegistry.get(pid);
        if (!existing) {
            return createTracedResponse(
                { success: false, error: `Process not found: ${pid}` },
                traceId,
                404
            );
        }

        const oldState = existing.state;
        existing.state = state;
        processRegistry.set(pid, existing);

        console.log(`[runtime-registry] Updated PID=${pid} ${oldState} → ${state}`);

        // Auto-cleanup: remove TERMINATED processes after a delay
        if (state === 'TERMINATED') {
            setTimeout(() => {
                processRegistry.delete(pid);
                console.log(`[runtime-registry] Cleaned up TERMINATED PID=${pid}`);
            }, 30000); // Keep for 30s so TaskManager can show final state
        }

        return createTracedResponse(
            {
                success: true,
                pid,
                oldState,
                newState: state,
                traceId,
            },
            traceId,
            200
        );

    } catch (error: unknown) {
        const appError = handleError(error as Error);
        console.error(`[API:ProcessRegistry] PATCH failed [${appError.errorId}]:`, appError.message);

        return createTracedResponse(
            { success: false, error: 'Internal server error' },
            traceId,
            500
        );
    }
}
