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

export const runtime = 'nodejs';

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

        const logs = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                timestamp: data.timestamp?.toDate?.()?.toISOString() || null,
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
