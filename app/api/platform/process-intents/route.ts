/**
 * Phase 15B: Process Intents API
 * 
 * Server-side handler for process operations.
 * Enforces policy, registers processes, writes audit.
 * 
 * ⚠️ This is the ONLY entry point for process operations (via Intent).
 */

import { NextRequest } from 'next/server';
import { getAuthContext } from '@/lib/auth/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { handleError } from '@super-platform/core';
import { extractOrGenerateTraceId, createTracedResponse } from '@/lib/platform/trace/server';
import { ProcessAction, ProcessError, ProcessDescriptor } from '@/lib/process/types';

export const runtime = 'nodejs';

const COLLECTION_AUDIT_LOGS = 'platform_audit_logs';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

interface ProcessIntent {
    action: ProcessAction;
    pid?: string;
    options?: {
        appId: string;
        entryPoint: string;
        args?: Record<string, unknown>;
        windowId?: string;
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// Policy Configuration
// ═══════════════════════════════════════════════════════════════════════════

type PolicyRequirement = 'authenticated' | 'owner-or-admin' | 'admin';

const PROCESS_POLICY: Record<ProcessAction, { require: PolicyRequirement }> = {
    'os.process.spawn': { require: 'authenticated' },
    'os.process.terminate': { require: 'owner-or-admin' },
    'os.process.forceQuit': { require: 'owner-or-admin' },
    'os.process.suspend': { require: 'owner-or-admin' },
    'os.process.resume': { require: 'owner-or-admin' },
    'os.process.list': { require: 'authenticated' },
};

// ═══════════════════════════════════════════════════════════════════════════
// In-Memory Process Registry (Server-side tracking)
// Note: Actual process execution runs client-side via Web Workers
// ═══════════════════════════════════════════════════════════════════════════

const processRegistry = new Map<string, { ownerId: string; appId: string; createdAt: number }>();

// ═══════════════════════════════════════════════════════════════════════════
// Request Handler
// ═══════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
    const traceId = extractOrGenerateTraceId(request);
    const startTime = Date.now();

    try {
        // Auth check
        const auth = await getAuthContext();
        if (!auth) {
            return createTracedResponse(
                {
                    success: false,
                    action: 'os.process.list' as ProcessAction,
                    decision: {
                        outcome: 'DENY',
                        reason: 'Not authenticated',
                        errorCode: ProcessError.authRequired,
                    },
                },
                traceId,
                401
            );
        }

        const userId = auth.uid;
        const isAdmin = (auth as any).role === 'admin';

        // Parse intent
        const intent: ProcessIntent = await request.json();
        const { action, pid, options } = intent;

        // Validate action
        if (!action || !action.startsWith('os.process.')) {
            return createTracedResponse(
                {
                    success: false,
                    action,
                    error: 'Invalid action format',
                },
                traceId,
                400
            );
        }

        // Get policy
        const policy = PROCESS_POLICY[action];
        if (!policy) {
            return createTracedResponse(
                {
                    success: false,
                    action,
                    decision: {
                        outcome: 'DENY',
                        reason: 'Unknown action',
                    },
                },
                traceId,
                400
            );
        }

        // ═══════════════════════════════════════════════════════════════════════
        // Policy Evaluation
        // ═══════════════════════════════════════════════════════════════════════

        let allowed = false;
        let denyReason = '';

        switch (policy.require) {
            case 'authenticated':
                allowed = true;
                break;

            case 'owner-or-admin':
                if (isAdmin) {
                    allowed = true;
                } else if (pid) {
                    const proc = processRegistry.get(pid);
                    if (proc && proc.ownerId === userId) {
                        allowed = true;
                    } else {
                        denyReason = 'Not owner of process';
                    }
                } else {
                    denyReason = 'No pid specified';
                }
                break;

            case 'admin':
                allowed = isAdmin;
                if (!allowed) denyReason = 'Admin required';
                break;
        }

        const opId = `${traceId}:${action}:${pid || options?.appId || 'system'}`;

        // ═══════════════════════════════════════════════════════════════════════
        // Execute Action (Server-side registration)
        // ═══════════════════════════════════════════════════════════════════════

        let result: any = {};

        if (allowed) {
            switch (action) {
                case 'os.process.spawn':
                    if (!options?.appId) {
                        return createTracedResponse(
                            {
                                success: false,
                                action,
                                decision: { outcome: 'DENY', reason: 'Missing appId' },
                            },
                            traceId,
                            400
                        );
                    }
                    // Register process
                    const newPid = `proc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
                    processRegistry.set(newPid, {
                        ownerId: userId,
                        appId: options.appId,
                        createdAt: Date.now(),
                    });
                    result = {
                        pid: newPid,
                        process: {
                            pid: newPid,
                            appId: options.appId,
                            state: 'RUNNING',
                            startedAt: Date.now(),
                            ownerId: userId,
                        } as ProcessDescriptor,
                    };
                    break;

                case 'os.process.terminate':
                case 'os.process.forceQuit':
                    if (pid && processRegistry.has(pid)) {
                        processRegistry.delete(pid);
                        result = { pid, terminated: true };
                    } else {
                        result = { pid, terminated: false, reason: 'Process not found' };
                    }
                    break;

                case 'os.process.suspend':
                case 'os.process.resume':
                    result = { pid, action };
                    break;

                case 'os.process.list':
                    const processes: ProcessDescriptor[] = [];
                    for (const [id, proc] of processRegistry.entries()) {
                        if (isAdmin || proc.ownerId === userId) {
                            processes.push({
                                pid: id,
                                appId: proc.appId,
                                state: 'RUNNING',
                                startedAt: proc.createdAt,
                                ownerId: proc.ownerId,
                            });
                        }
                    }
                    result = { processes };
                    break;
            }
        }

        // ═══════════════════════════════════════════════════════════════════════
        // Audit Log
        // ═══════════════════════════════════════════════════════════════════════

        const db = getAdminFirestore();
        const auditEntry = {
            eventType: 'process_operation',
            action,
            pid: pid || result.pid || null,
            appId: options?.appId || processRegistry.get(pid || '')?.appId || null,
            decision: allowed ? 'ALLOW' : 'DENY',
            denyReason: allowed ? null : denyReason,
            result: allowed ? 'SUCCESS' : 'DENIED',
            traceId,
            opId,
            actor: {
                uid: userId,
                email: auth.email || null,
                isAdmin,
            },
            actorId: userId,
            timestamp: new Date(),
            latencyMs: Date.now() - startTime,
            source: 'process-dispatcher',
        };

        await db.collection(COLLECTION_AUDIT_LOGS).add(auditEntry);

        // ═══════════════════════════════════════════════════════════════════════
        // Response
        // ═══════════════════════════════════════════════════════════════════════

        if (!allowed) {
            return createTracedResponse(
                {
                    success: false,
                    action,
                    decision: {
                        outcome: 'DENY',
                        reason: denyReason,
                        errorCode: ProcessError.accessDenied,
                    },
                    opId,
                    traceId,
                },
                traceId,
                403
            );
        }

        return createTracedResponse(
            {
                success: true,
                action,
                decision: { outcome: 'ALLOW' },
                opId,
                traceId,
                ...result,
            },
            traceId,
            200
        );

    } catch (error: unknown) {
        const appError = handleError(error as Error);
        console.error(`[API:ProcessIntents] Failed [${appError.errorId}]:`, appError.message);

        return createTracedResponse(
            { error: 'Internal server error', success: false },
            traceId,
            500
        );
    }
}
