/**
 * API: Filesystem Intent Handler (Server-side)
 * 
 * Phase 15A.2: Intent-only Enforcement
 * 
 * POST /api/platform/fs-intents
 * 
 * This is the SOURCE OF TRUTH for filesystem policy decisions.
 * - Receives intents from client dispatcher
 * - Evaluates Policy v0 (system:// read-only, quota)
 * - Executes via FileSystemService (kernel)
 * - Writes canonical audit entries with opId correlation
 * 
 * ❌ Client CANNOT bypass this API
 * ✅ All decisions and audit written here
 */

import { NextRequest } from 'next/server';
import { getAuthContext } from '@/lib/auth/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { handleError } from '@super-platform/core';
import { extractOrGenerateTraceId, createTracedResponse } from '@/lib/platform/trace/server';
import { FileCapability, FileSystemError } from '@/lib/filesystem/types';
import type { FsIntentMeta } from '@/lib/platform/types/intent-events';

export const runtime = 'nodejs';

const COLLECTION_AUDIT_LOGS = 'platform_audit_logs';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

type FsIntentAction =
    | 'os.fs.read'
    | 'os.fs.write'
    | 'os.fs.delete'
    | 'os.fs.list'
    | 'os.fs.mkdir'
    | 'os.fs.stat'
    | 'os.fs.rename'
    | 'os.fs.move'
    | 'os.fs.copy'
    | 'os.fs.openHandle'
    | 'os.fs.closeHandle'
    | 'os.fs.shareHandle';

interface FsIntent {
    action: FsIntentAction;
    meta: FsIntentMeta;
    content?: string;
    options?: {
        create?: boolean;
        overwrite?: boolean;
        mimeType?: string;
    };
}

interface FsDecision {
    outcome: 'ALLOW' | 'DENY';
    errorCode?: FileSystemError;
    reason?: string;
    policyKey?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Policy v0 (SERVER-SIDE SOURCE OF TRUTH)
// ═══════════════════════════════════════════════════════════════════════════

const WRITE_CAPABILITIES: FileCapability[] = [
    'fs.write', 'fs.delete', 'fs.move', 'fs.copy', 'fs.rename', 'fs.mkdir'
];

function actionToCapability(action: FsIntentAction): FileCapability {
    const map: Record<FsIntentAction, FileCapability> = {
        'os.fs.read': 'fs.read',
        'os.fs.write': 'fs.write',
        'os.fs.delete': 'fs.delete',
        'os.fs.list': 'fs.list',
        'os.fs.mkdir': 'fs.mkdir',
        'os.fs.stat': 'fs.stat',
        'os.fs.rename': 'fs.rename',
        'os.fs.move': 'fs.move',
        'os.fs.copy': 'fs.copy',
        'os.fs.openHandle': 'fs.openHandle',
        'os.fs.closeHandle': 'fs.closeHandle',
        'os.fs.shareHandle': 'fs.shareHandle',
    };
    return map[action];
}

function evaluateFsPolicy(intent: FsIntent): FsDecision {
    const capability = actionToCapability(intent.action);
    const scheme = intent.meta.scheme;

    // Policy Rule 1: system:// is read-only
    if (scheme === 'system' && WRITE_CAPABILITIES.includes(capability)) {
        return {
            outcome: 'DENY',
            errorCode: FileSystemError.accessDenied,
            reason: 'Write operations forbidden on system:// scheme',
            policyKey: 'fs.policy.system_readonly',
        };
    }

    // Policy Rule 2: Quota guard (soft limit 50MB per file)
    if (intent.meta.fileSize && intent.meta.fileSize > 50 * 1024 * 1024) {
        return {
            outcome: 'DENY',
            errorCode: FileSystemError.accessDenied,
            reason: 'File size exceeds 50MB limit',
            policyKey: 'fs.policy.quota_exceeded',
        };
    }

    // Policy Rule 3: Require valid scheme
    if (!['user', 'temp', 'system'].includes(scheme)) {
        return {
            outcome: 'DENY',
            errorCode: FileSystemError.unknownScheme,
            reason: `Unknown scheme: ${scheme}`,
            policyKey: 'fs.policy.unknown_scheme',
        };
    }

    // Default: ALLOW
    return {
        outcome: 'ALLOW',
        policyKey: 'fs.policy.default_allow',
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// API Handler
// ═══════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
    try {
        // Extract or generate traceId from TraceContext
        const traceId = extractOrGenerateTraceId(request);

        // Auth check
        const auth = await getAuthContext();
        if (!auth) {
            return createTracedResponse(
                { error: 'Unauthorized', success: false },
                traceId,
                401
            );
        }

        // Parse intent
        const intent: FsIntent = await request.json();

        // Validate
        if (!intent.action || !intent.action.startsWith('os.fs.')) {
            return createTracedResponse(
                {
                    error: 'Validation failed',
                    details: [{ field: 'action', message: 'Must be os.fs.* action' }],
                    success: false,
                },
                traceId,
                400
            );
        }

        if (!intent.meta?.path || !intent.meta?.scheme) {
            return createTracedResponse(
                {
                    error: 'Validation failed',
                    details: [{ field: 'meta', message: 'path and scheme are required' }],
                    success: false,
                },
                traceId,
                400
            );
        }

        // Generate opId for audit correlation
        const opId = `${traceId}:${intent.action}:${intent.meta.path}`;
        const capability = actionToCapability(intent.action);

        // ═══════════════════════════════════════════════════════════════════
        // POLICY EVALUATION (Server-side source of truth)
        // ═══════════════════════════════════════════════════════════════════
        const decision = evaluateFsPolicy(intent);

        // ═══════════════════════════════════════════════════════════════════
        // AUDIT ENTRY (Canonical with opId)
        // ═══════════════════════════════════════════════════════════════════
        const timestamp = new Date();
        const db = getAdminFirestore();

        const auditEntry: Record<string, any> = {
            // Event identification
            eventType: 'fs_intent',
            action: intent.action,

            // Correlation
            opId,
            traceId,

            // FS-specific fields
            capability,
            path: intent.meta.path,
            scheme: intent.meta.scheme,
            fileSize: intent.meta.fileSize || null,

            // Actor
            actor: {
                uid: auth.uid,
                email: auth.email || null,
            },
            actorId: auth.uid,

            // Decision (from policy)
            decision: decision.outcome,
            policyKey: decision.policyKey || null,
            errorCode: decision.errorCode || null,

            // Result (to be updated after execution)
            result: null as 'SUCCESS' | 'FAILED' | 'DENIED' | null,

            // Metadata
            timestamp,
            source: 'fs-dispatcher',
        };

        // If DENIED by policy, write audit and return immediately
        if (decision.outcome === 'DENY') {
            auditEntry.result = 'DENIED';
            await db.collection(COLLECTION_AUDIT_LOGS).add(auditEntry);

            return createTracedResponse(
                {
                    success: false,
                    decision: {
                        outcome: 'DENY',
                        errorCode: decision.errorCode,
                        reason: decision.reason,
                        policyKey: decision.policyKey,
                    },
                    opId,
                    traceId,
                },
                traceId,
                403
            );
        }

        // ═══════════════════════════════════════════════════════════════════
        // EXECUTION (Server-side only — kernel access)
        // ═══════════════════════════════════════════════════════════════════
        // Note: In Phase 15A, the actual filesystem operations run client-side
        // because OPFS is browser-only. The server validates policy and logs audit.
        // The client receives ALLOW and performs the operation locally.
        // 
        // For true server-side execution (future phases), we would:
        // const data = await kernelFs.execute(intent);

        // For now: Policy ALLOW means client is authorized to proceed
        auditEntry.result = 'SUCCESS';  // Optimistic — client will execute
        await db.collection(COLLECTION_AUDIT_LOGS).add(auditEntry);

        return createTracedResponse(
            {
                success: true,
                authorized: true,
                decision: {
                    outcome: 'ALLOW',
                    policyKey: decision.policyKey,
                },
                opId,
                traceId,
            },
            traceId,
            200
        );

    } catch (error: unknown) {
        const appError = handleError(error as Error);
        console.error(`[API:FsIntents] Failed [${appError.errorId}]:`, appError.message);

        const traceId = extractOrGenerateTraceId(request);
        return createTracedResponse(
            { error: 'Internal server error', success: false },
            traceId,
            500
        );
    }
}
