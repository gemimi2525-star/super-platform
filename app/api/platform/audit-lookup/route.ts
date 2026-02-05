/**
 * API: Audit Lookup (Read-only for Verifier)
 * 
 * Phase 15A.2: G8 Audit Verification
 * 
 * GET /api/platform/audit-lookup?opId=...
 * GET /api/platform/audit-lookup?traceId=...
 * 
 * Returns audit record for verification purposes.
 * Admin-only (authenticated users only).
 */

import { NextRequest } from 'next/server';
import { getAuthContext } from '@/lib/auth/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { extractOrGenerateTraceId, createTracedResponse } from '@/lib/platform/trace/server';

export const runtime = 'nodejs';

const COLLECTION_AUDIT_LOGS = 'platform_audit_logs';

export async function GET(request: NextRequest) {
    const traceId = extractOrGenerateTraceId(request);

    try {
        // Auth check
        const auth = await getAuthContext();
        if (!auth) {
            return createTracedResponse(
                { error: 'Unauthorized', success: false },
                traceId,
                401
            );
        }

        // Get query params
        const { searchParams } = new URL(request.url);
        const opId = searchParams.get('opId');
        const lookupTraceId = searchParams.get('traceId');

        if (!opId && !lookupTraceId) {
            return createTracedResponse(
                { error: 'Missing opId or traceId parameter', success: false },
                traceId,
                400
            );
        }

        const db = getAdminFirestore();
        let query;

        if (opId) {
            query = db.collection(COLLECTION_AUDIT_LOGS)
                .where('opId', '==', opId)
                .orderBy('timestamp', 'desc')
                .limit(1);
        } else {
            query = db.collection(COLLECTION_AUDIT_LOGS)
                .where('traceId', '==', lookupTraceId)
                .orderBy('timestamp', 'desc')
                .limit(5);
        }

        const snapshot = await query.get();

        if (snapshot.empty) {
            return createTracedResponse(
                {
                    success: true,
                    found: false,
                    records: [],
                    query: { opId, traceId: lookupTraceId }
                },
                traceId,
                200
            );
        }

        const records = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            // Convert Firestore Timestamp to ISO string
            timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || doc.data().timestamp,
        }));

        return createTracedResponse(
            {
                success: true,
                found: true,
                count: records.length,
                records,
            },
            traceId,
            200
        );

    } catch (error: any) {
        console.error('[API:AuditLookup] Error:', error);
        return createTracedResponse(
            { error: 'Internal server error', success: false },
            traceId,
            500
        );
    }
}
