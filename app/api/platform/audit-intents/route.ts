/**
 * API: Platform Audit Intents Writer
 * 
 * Phase 14.3: User Intent Event Pipeline + Governance Decisions
 * 
 * POST /api/platform/audit-intents
 * 
 * Accepts user intent events from OS shell and persists to audit store.
 * Protected: requires authenticated session (no bypass mode for production).
 * Evaluates platform policy and persists decision outcome.
 */

import { NextRequest } from 'next/server';
import { getAuthContext } from '@/lib/auth/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { ApiSuccessResponse, ApiErrorResponse } from '@/lib/api';
import { handleError } from '@super-platform/core';
import type { IntentEventPayload, IntentEventResponse } from '@/lib/platform/types/intent-events';
import { extractOrGenerateTraceId, createTracedResponse } from '@/lib/platform/trace/server';
import { evaluateIntentPolicy, getCurrentEnvironment } from '@/lib/platform/policy/intent-policy';

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

        // ═══════════════════════════════════════════════════════════════════════════
        // PHASE 14.3: Evaluate Intent Policy
        // ═══════════════════════════════════════════════════════════════════════════
        const decision = evaluateIntentPolicy({
            action: payload.action,
            target: payload.target,
            meta: payload.meta,
            actor: {
                uid: auth.uid,
                email: auth.email || undefined,
                role: 'owner', // TODO: get real role from session/DB
            },
            env: getCurrentEnvironment(),
        });

        // Determine status based on decision outcome
        let status: 'SUCCESS' | 'DENIED' | 'FAILED' | 'INFO';
        let success: boolean;

        if (decision.outcome === 'DENY') {
            status = 'DENIED';
            success = false;
        } else if (decision.outcome === 'ALLOW') {
            // Intent events are informational by default
            status = payload.action.includes('.switch') || payload.action.includes('.open') ? 'INFO' : 'SUCCESS';
            success = true;
        } else {
            // SKIP
            status = 'INFO';
            success = true;
        }

        // Create audit entry with decision
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
            actorRole: 'user',

            // Target and metadata
            target: payload.target || null,
            metadata: {
                ...payload.meta,
                simulated: payload.meta?.test === true, // Mark test scenarios as simulated
            },

            // Trace and timing
            traceId: finalTraceId,
            timestamp: new Date(payload.timestamp || Date.now()),

            // Decision (Phase 14.3)
            decision: {
                decision: decision.outcome,  // Frontend expects 'decision', not 'outcome'
                policyId: decision.policyKey || null,
                capability: decision.capability || null,
                ruleHit: decision.reason || null,  // Map reason to ruleHit for UI
            },
            decisionOutcome: decision.outcome,

            // Status
            success,
            status,

            // Source
            source: 'os-shell',
        };

        const docRef = await db.collection(COLLECTION_AUDIT_LOGS).add(auditEntry);

        // ═══════════════════════════════════════════════════════════════════════════
        // Response based on decision
        // ═══════════════════════════════════════════════════════════════════════════
        if (decision.outcome === 'DENY') {
            return createTracedResponse(
                {
                    success: false,
                    decision: {
                        outcome: decision.outcome,
                        policyKey: decision.policyKey,
                        reason: decision.reason,
                        capability: decision.capability,
                    },
                    traceId: finalTraceId,
                },
                finalTraceId,
                403
            );
        }

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
