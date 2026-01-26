/**
 * API: Platform Audit Logs
 * Returns audit log entries for platform owner
 * 
 * Supports filtering, sorting, and cursor-based pagination.
 * Access: Platform Owner ONLY
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { requireOwner } from '@/lib/auth/server';
import { ApiSuccessResponse, ApiErrorResponse, validateRequest } from '@/lib/api';
import { handleError } from '@super-platform/core';

// Validation schema for Query Params
const querySchema = z.object({
    eventType: z.string().optional(),
    action: z.string().optional(),
    actorId: z.string().optional(),
    targetId: z.string().optional(),
    targetType: z.enum(['org', 'user', 'role']).optional(),
    success: z.enum(['true', 'false']).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    limit: z.coerce.number().min(10).max(100).default(25),
    cursor: z.string().optional(), // For pagination
});

export async function GET(request: NextRequest) {
    try {
        // Enforce strict security: Platform Owner ONLY
        await requireOwner();

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

        const db = getAdminFirestore();
        let query: FirebaseFirestore.Query = db.collection('platform_audit_logs');

        // Apply filters
        // Note: Firestore requires composite indexes for multiple equality filters + range/sort
        // We order by timestamp DESC by default.

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

        // Sorting
        query = query.orderBy('timestamp', 'desc');

        // Pagination (Cursor)
        if (cursor) {
            // Need to decode cursor or use startAfter if it's just ID/Timestamp?
            // Simple approach: Use the document snapshot or timestamp from cursor
            // For robustness, we usually pass the timestamp + ID, but allow simple direct use 
            // of the last document if client sends it.
            // Here we assume cursor is the ISO string of the timestamp for simple implementation,
            // OR we can implement full base64 encoded cursor.
            // Plan said: "nextCursor": "eyJ0aW1lc3RhbXAiOiIyMDI2...." (Base64)

            // For now, let's treat cursor as the ID of the last doc (startAfter) 
            // BUT startAfter(doc) requires the doc. startAfter(value) depends on order.
            // If ordered by timestamp, we need timestamp. 
            // Let's rely on client passing the ISO string for now or implement strict cursor later.
            // Actually, best practice with Firestore is using `startAfter` with the field value.
            // If cursor is provided, try to parse it as date, else ignore?
            // Let's rely on simple Date string for now to match strict checks.
            try {
                const cursorDate = new Date(cursor);
                if (!isNaN(cursorDate.getTime())) {
                    query = query.startAfter(cursorDate);
                }
            } catch (e) {
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
                // Ensure dates are ISO strings
                timestamp: data.timestamp?.toDate?.()?.toISOString() || null,
            };
        });

        // Generate next cursor
        let nextCursor = null;
        if (logs.length === limit) {
            // Use the last item's timestamp as cursor
            nextCursor = logs[logs.length - 1].timestamp;
        }

        return ApiSuccessResponse.ok({
            items: logs,
            nextCursor,
            hasMore: logs.length === limit,
            totalCount: null // Calculating total is expensive in Firestore
        });

    } catch (error: any) {
        const appError = handleError(error as Error);
        console.error(`[API] Failed to fetch audit logs [${appError.errorId}]:`, appError.message);

        // Handle index requirement error specially to help Dev
        if (error.code === 9 || error.message?.includes('index')) {
            return ApiErrorResponse.internalError('Missing index configuration');
        }

        return ApiErrorResponse.internalError();
    }
}
