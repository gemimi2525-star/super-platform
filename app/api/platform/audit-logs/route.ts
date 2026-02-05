/**
 * API: Platform Audit Logs
 * Returns audit log entries for platform owner/admin
 * 
 * Supports filtering, sorting, and cursor-based pagination.
 * Access: Platform Owner or Admin with audit:read permission
 * 
 * READ-ONLY: No mutations allowed (Phase 5 requirement)
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { getAuthContext } from '@/lib/auth/server';
import type { PlatformUser } from '@/lib/platform/types';
import { hasPermission } from '@/lib/platform/types';
import { ApiSuccessResponse, ApiErrorResponse, validateRequest } from '@/lib/api';
import { handleError } from '@super-platform/core';

// Phase 13: Governance Legibility imports
import type { AuditViewModel } from '@/lib/platform/types/audit-view-model';
import { resolveActor } from '@/lib/platform/resolvers/actor-resolver';
import { mapToStatus, generateReason, extractDecisionInfo } from '@/lib/platform/mappers/audit-status-mapper';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'; // Phase 14.3: Prevent caching of audit logs

// Inline collection constants to avoid webpack path resolution issues
const COLLECTION_PLATFORM_USERS = 'platform_users';
const COLLECTION_AUDIT_LOGS = 'platform_audit_logs';

// Validation schema for Query Params
const querySchema = z.object({
    eventType: z.string().optional(),
    action: z.string().optional(),
    actorId: z.string().optional(),
    targetId: z.string().optional(),
    targetType: z.enum(['org', 'user', 'role']).optional(),
    success: z.enum(['true', 'false']).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    limit: z.coerce.number().min(10).max(100).default(25),
    cursor: z.string().optional(),
});

export async function GET(request: NextRequest) {
    try {
        // ═══════════════════════════════════════════════════════════════════════════
        // PHASE 9.9: DEV BYPASS — Check FIRST before auth (same pattern as Users API)
        // ═══════════════════════════════════════════════════════════════════════════
        if (process.env.NODE_ENV === 'development' && process.env.AUTH_DEV_BYPASS === 'true') {
            console.log('[API:AuditLogs] Dev bypass mode - returning mock audit logs');
            return getMockAuditLogs();
        }

        // Auth check
        const auth = await getAuthContext();
        if (!auth) {
            return ApiErrorResponse.unauthorized();
        }

        const db = getAdminFirestore();

        // Check permission
        const userDoc = await db.collection(COLLECTION_PLATFORM_USERS).doc(auth.uid).get();
        if (!userDoc.exists) {
            return ApiErrorResponse.forbidden('Not a platform user');
        }

        const currentUser = userDoc.data() as PlatformUser;

        // Require audit:read permission or owner role
        if (currentUser.role !== 'owner' && !hasPermission(currentUser, 'platform:audit:read')) {
            return ApiErrorResponse.forbidden('Insufficient permissions to view audit logs');
        }

        // Parse query params
        const url = new URL(request.url);
        const queryParams = Object.fromEntries(url.searchParams.entries());

        const validation = validateRequest(querySchema, queryParams);
        if (!validation.success) {
            return ApiErrorResponse.validationError(validation.errors);
        }

        const {
            eventType,
            action,
            actorId,
            targetId,
            targetType,
            success,
            startDate,
            endDate,
            limit,
            cursor
        } = validation.data;

        let query: FirebaseFirestore.Query = db.collection(COLLECTION_AUDIT_LOGS);

        // Apply filters
        if (eventType) query = query.where('eventType', '==', eventType);
        if (action) query = query.where('action', '==', action);
        if (actorId) query = query.where('actor.uid', '==', actorId);
        if (targetId) query = query.where('target.id', '==', targetId);
        if (targetType) query = query.where('target.type', '==', targetType);

        if (success !== undefined) {
            query = query.where('success', '==', success === 'true');
        }

        if (startDate) query = query.where('timestamp', '>=', new Date(startDate));
        if (endDate) query = query.where('timestamp', '<=', new Date(endDate));

        // Sorting - always by timestamp descending
        query = query.orderBy('timestamp', 'desc');

        // Pagination cursor
        if (cursor) {
            try {
                const cursorDate = new Date(cursor);
                if (!isNaN(cursorDate.getTime())) {
                    query = query.startAfter(cursorDate);
                }
            } catch {
                // Ignore invalid cursor
            }
        }

        // Limit
        query = query.limit(limit);

        // Execute
        const snapshot = await query.get();

        // Phase 13: Map to AuditViewModel with enriched data
        const logs: AuditViewModel[] = snapshot.docs.map(doc => {
            const data = doc.data();

            // Resolve actor truth (never "-")
            const actor = resolveActor({
                actorId: data.actorId,
                actorRole: data.actorRole,
                actor: data.actor,
                action: data.action || data.eventType,
            });

            // Categorize status (DENIED vs FAILED distinction)
            const status = mapToStatus({
                success: data.success,
                decision: data.decision,
                action: data.action || data.eventType,
                metadata: data.metadata || data.details,
            });

            // Generate human-readable reason if applicable
            const reason = generateReason({
                success: data.success,
                decision: data.decision,
                action: data.action || data.eventType,
                metadata: data.metadata || data.details,
            });

            // Extract decision info if present
            const decision = extractDecisionInfo({
                decision: data.decision,
                metadata: data.metadata || data.details,
            });

            return {
                id: doc.id,
                traceId: data.traceId || doc.id,
                action: data.action || data.eventType || 'unknown',
                status,
                actor,
                reason,
                decision,
                timestamp: data.timestamp?.toDate?.()?.toISOString() || new Date().toISOString(),
                rawPayload: {
                    ...data,
                    // Truncate large metadata to avoid bloat
                    metadata: data.metadata ? JSON.stringify(data.metadata).slice(0, 200) : undefined,
                },
                metadata: data.metadata || null, // Phase 14.3: Expose metadata for frontend badges (e.g. simulated)
            };
        });

        // Generate next cursor
        let nextCursor = null;
        if (logs.length === limit) {
            nextCursor = logs[logs.length - 1].timestamp;
        }

        return ApiSuccessResponse.ok({
            items: logs,
            nextCursor,
            hasMore: logs.length === limit,
        });

    } catch (error: unknown) {
        const appError = handleError(error as Error);
        console.error(`[API] Failed to fetch audit logs [${appError.errorId}]:`, appError.message);

        // Handle Firestore index requirement error
        if ((error as { code?: number }).code === 9 ||
            (error as Error).message?.includes('index')) {
            return ApiErrorResponse.internalError('Missing Firestore index configuration');
        }

        return ApiErrorResponse.internalError();
    }
}

/**
 * Mock audit logs for dev bypass mode
 * Phase 13: Updated to return AuditViewModel format
 */
function getMockAuditLogs() {
    const mockLogs: AuditViewModel[] = [
        {
            id: 'audit-001',
            traceId: 'trace-001',
            action: 'login',
            status: 'INFO',
            actor: {
                kind: 'user',
                displayName: 'admin@apicoredata.local',
                actorId: 'dev-user-001',
            },
            timestamp: new Date().toISOString(),
        },
        {
            id: 'audit-002',
            traceId: 'trace-002',
            action: 'org.created',
            status: 'SUCCESS',
            actor: {
                kind: 'user',
                displayName: 'admin@apicoredata.local',
                actorId: 'dev-user-001',
            },
            decision: {
                decision: 'ALLOW',
                capability: 'platform:orgs:write',
            },
            timestamp: new Date(Date.now() - 3600000).toISOString(),
        },
        {
            id: 'audit-003',
            traceId: 'trace-003',
            action: 'user.role_change',
            status: 'SUCCESS',
            actor: {
                kind: 'user',
                displayName: 'admin@apicoredata.local',
                actorId: 'dev-user-001',
            },
            decision: {
                decision: 'ALLOW',
                capability: 'platform:users:write',
            },
            timestamp: new Date(Date.now() - 7200000).toISOString(),
        },
        {
            id: 'audit-004',
            traceId: 'trace-004',
            action: 'org.settings.update',
            status: 'DENIED',
            actor: {
                kind: 'user',
                displayName: 'user@example.com',
                actorId: 'regular-user-001',
            },
            reason: {
                code: 'POLICY_VIOLATION',
                summary: 'Access denied: insufficient permission for "platform:orgs:write"',
            },
            decision: {
                decision: 'DENY',
                capability: 'platform:orgs:write',
            },
            timestamp: new Date(Date.now() - 86400000).toISOString(),
        },
        {
            id: 'audit-005',
            traceId: 'trace-005',
            action: 'api.call',
            status: 'FAILED',
            actor: {
                kind: 'system',
                displayName: 'system',
                actorId: 'system',
            },
            reason: {
                code: 'EXECUTION_ERROR',
                summary: 'Database query failed: connection timeout',
            },
            timestamp: new Date(Date.now() - 172800000).toISOString(),
        },
    ];

    return ApiSuccessResponse.ok({
        items: mockLogs,
        nextCursor: null,
        hasMore: false,
    });
}
