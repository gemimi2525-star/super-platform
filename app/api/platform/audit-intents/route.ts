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
import { extractOrGenerateTraceId, createTracedResponse } from '@/lib/platform/trace/server';

export const runtime = 'nodejs';

const COLLECTION_AUDIT_LOGS = 'platform_audit_logs';

export async function POST(request: NextRequest) {
    try {
        // ═══════════════════════════════════════════════════════════════════════════
        // PHASE 14.2: Extract or generate traceId
        // ═══════════════════════════════════════════════════════════════════════════
        const traceId = extractOrGenerateTraceId(request);

        // ═══════════════════════════════════════════════════════════════════════════
        // AUTH CHECK (NO DEV BYPASS - Production-first requirement)
        // ═══════════════════════════════════════════════════════════════════════════
        const auth = await getAuthContext();
        if (!auth) {
            return createTracedResponse(
                { error: 'Unauthorized' },
                traceId,
                401
            );
        }

        // Parse payload
        const payload: IntentEventPayload = await request.json();

        // Validate minimal fields
        if (!payload.action) {
            return createTracedResponse(
                {
                    error: 'Validation failed',
                    details: [{ field: 'action', code: 'REQUIRED', message: 'Action is required' }],
                },
                traceId,
                400
            );
        }

        if (!payload.action.startsWith('os.')) {
            return createTracedResponse(
                {
                    error: 'Validation failed',
                    details: [{ field: 'action', code: 'INVALID_FORMAT', message: 'Intent action must start with "os."' }],
                },
                traceId,
                400
            );
        }

        // Use traceId from header (already extracted) or payload (fallback)
        const finalTraceId = payload.traceId || traceId;

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

            // Trace and timing (Phase 14.2: use extracted traceId)
            traceId: finalTraceId,
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
            traceId: finalTraceId,
        };

        // Phase 14.2: Return response with x-trace-id header
        return createTracedResponse(response, finalTraceId, 201);

    } catch (error: unknown) {
        const appError = handleError(error as Error);
        console.error(`[API:AuditIntents] Failed to persist intent [${appError.errorId}]:`, appError.message);

        // Phase 14.2: Include trace in error response
        const traceId = extractOrGenerateTraceId(request);
        return createTracedResponse(
            { error: 'Internal server error' },
            traceId,
            500
        );
    }
}
