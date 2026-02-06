/**
 * API: Filesystem Security Handler (Server-side)
 * 
 * Phase 15A.3: Security v0 (Logout & Handle Control)
 * 
 * POST /api/platform/fs-security
 * 
 * Handles logout security intents:
 * - os.fs.logout.soft_lock: Lock filesystem, close handles
 * - os.fs.logout.clear: Wipe user/temp, close handles
 * 
 * This is the SOURCE OF TRUTH for security policy decisions.
 * All audit entries are written here.
 */

import { NextRequest } from 'next/server';
import { getAuthContext } from '@/lib/auth/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { handleError } from '@super-platform/core';
import { extractOrGenerateTraceId, createTracedResponse } from '@/lib/platform/trace/server';

export const runtime = 'nodejs';

const COLLECTION_AUDIT_LOGS = 'platform_audit_logs';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

type FsSecurityAction = 'os.fs.logout.soft_lock' | 'os.fs.logout.clear';

interface FsSecurityIntent {
    action: FsSecurityAction;
    openHandlesBefore?: number; // Client reports current handle count
}

// ═══════════════════════════════════════════════════════════════════════════
// API Handler
// ═══════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
    try {
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
        const intent: FsSecurityIntent = await request.json();

        // Validate action
        if (!intent.action || !intent.action.startsWith('os.fs.logout.')) {
            return createTracedResponse(
                {
                    error: 'Validation failed',
                    details: [{ field: 'action', message: 'Must be os.fs.logout.* action' }],
                    success: false,
                },
                traceId,
                400
            );
        }

        // Generate opId
        const opId = `${traceId}:${intent.action}:logout`;
        const timestamp = new Date();

        // ═══════════════════════════════════════════════════════════════════
        // POLICY EXECUTION (Server-side source of truth)
        // ═══════════════════════════════════════════════════════════════════

        const db = getAdminFirestore();
        const isClear = intent.action === 'os.fs.logout.clear';

        // Canonical audit entry
        const auditEntry: Record<string, any> = {
            // Event identification
            eventType: 'fs_security',
            action: intent.action,

            // Correlation
            opId,
            traceId,

            // Security-specific fields
            policy: isClear ? 'CLEAR' : 'SOFT_LOCK',
            openHandlesBefore: intent.openHandlesBefore ?? 0,
            openHandlesAfter: 0, // Always 0 after security event

            // Actor
            actor: {
                uid: auth.uid,
                email: auth.email || null,
            },
            actorId: auth.uid,

            // Result
            result: isClear ? 'FS_WIPE_SUCCESS' : 'FS_SOFT_LOCK_APPLIED',
            wipedSchemes: isClear ? ['user', 'temp'] : [],

            // Metadata
            timestamp,
            source: 'fs-security',
        };

        await db.collection(COLLECTION_AUDIT_LOGS).add(auditEntry);

        // Return success with policy instruction for client
        return createTracedResponse(
            {
                success: true,
                policy: isClear ? 'CLEAR' : 'SOFT_LOCK',
                instruction: isClear
                    ? 'WIPE_USER_TEMP_LOCK_STATE'
                    : 'CLOSE_HANDLES_LOCK_STATE',
                opId,
                traceId,
            },
            traceId,
            200
        );

    } catch (error: unknown) {
        const appError = handleError(error as Error);
        console.error(`[API:FsSecurity] Failed [${appError.errorId}]:`, appError.message);

        const traceId = extractOrGenerateTraceId(request);
        return createTracedResponse(
            { error: 'Internal server error', success: false },
            traceId,
            500
        );
    }
}
