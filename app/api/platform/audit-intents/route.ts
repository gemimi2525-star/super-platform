/**
 * API: Platform Audit Intents Writer
 * 
 * Phase 14.1: User Intent Event Pipeline
 * 
 * POST /api/platform/audit-intents
 * 
 * Accepts user intent events from OS shell and persists to audit store.
 * Protected: requires authenticated session (no bypass mode for production).
 */

import { NextRequest } from 'next/server';
import { getAuthContext } from '@/lib/auth/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { ApiSuccessResponse, ApiErrorResponse } from '@/lib/api';
import { handleError } from '@super-platform/core';
import type { IntentEventPayload, IntentEventResponse } from '@/lib/platform/types/intent-events';

export const runtime = 'nodejs';

const COLLECTION_AUDIT_LOGS = 'platform_audit_logs';

export async function POST(request: NextRequest) {
    try {
        // ═══════════════════════════════════════════════════════════════════════════
        // AUTH CHECK (NO DEV BYPASS - Production-first requirement)
        // ═══════════════════════════════════════════════════════════════════════════
        const auth = await getAuthContext();
        if (!auth) {
            return ApiErrorResponse.unauthorized();
        }

        // Parse payload
        const payload: IntentEventPayload = await request.json();

        if (!payload.action) {
            return ApiErrorResponse.validationError([{
                field: 'action',
                code: 'REQUIRED',
                message: 'Action is required',
            }]);
        }

        if (!payload.action.startsWith('os.')) {
            return ApiErrorResponse.validationError([{
                field: 'action',
                code: 'INVALID_FORMAT',
                message: 'Intent action must start with "os."',
            }]);
        }

        // Generate traceId if not provided
        const traceId = payload.traceId || crypto.randomUUID();

        // Create audit entry
        const db = getAdminFirestore();
        const auditEntry = {
            // Core fields
            action: payload.action,
            eventType: 'user_intent',

            // Actor from session
            actor: {
                uid: auth.uid,
                email: auth.email || null,
            },
            actorId: auth.uid,
            actorRole: 'user', // Intent events always from user sessions

            // Target and metadata
            target: payload.target || null,
            metadata: payload.meta || {},

            // Trace and timing
            traceId,
            timestamp: new Date(payload.timestamp || Date.now()),

            // Status (intent events are informational, always success)
            success: true,
            decision: null, // No policy decision for intent events

            // Phase 14.1 marker
            source: 'os-shell',
        };

        const docRef = await db.collection(COLLECTION_AUDIT_LOGS).add(auditEntry);

        const response: IntentEventResponse = {
            id: docRef.id,
            traceId,
        };

        return ApiSuccessResponse.created(response);

    } catch (error: unknown) {
        const appError = handleError(error as Error);
        console.error(`[API:AuditIntents] Failed to persist intent [${appError.errorId}]:`, appError.message);
        return ApiErrorResponse.internalError();
    }
}
