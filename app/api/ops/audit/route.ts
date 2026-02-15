
import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth/server';
import { ApiSuccessResponse, ApiErrorResponse } from '@/lib/api';
import { withQuotaGuard, isQuotaError } from '@/lib/firebase-admin';
import { handleError } from '@super-platform/core';

/**
 * GET /api/ops/audit-logs
 * Fetch system-wide audit logs
 */
export async function GET(request: NextRequest) {
    try {
        // ═══════════════════════════════════════════════════════════════════════════
        // PHASE 9.9: DEV BYPASS — Check FIRST before auth
        // ═══════════════════════════════════════════════════════════════════════════
        if (process.env.NODE_ENV === 'development' && process.env.AUTH_DEV_BYPASS === 'true') {
            return getMockAuditLogs();
        }

        const auth = await getAuthContext(request);

        if (!auth) {
            return ApiErrorResponse.unauthorized();
        }

        // Strict Access Control: Owner or specific OPS permission
        if (auth.role !== 'owner' && auth.role !== 'admin') {
            // In a real scenario, might check for 'ops.audit.read' permission
            return ApiErrorResponse.forbidden('Access restricted to platform owners/admins');
        }

        const searchParams = request.nextUrl.searchParams;
        const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);

        // MOCK DATA for Quota Bypass
        const MOCK_LOGS_FALLBACK = [
            {
                id: 'audit-mock-001',
                action: 'system.login',
                actor: { uid: 'mock-user', email: 'user@mock.com', role: 'user' },
                target: { id: 'session-123', type: 'session' },
                status: 'success',
                timestamp: new Date().toISOString(),
                metadata: { method: 'mock' }
            },
            {
                id: 'audit-mock-002',
                action: 'user.create',
                actor: { uid: 'mock-admin', email: 'admin@mock.com', role: 'admin' },
                target: { id: 'user-new', type: 'user' },
                status: 'success',
                timestamp: new Date(Date.now() - 10000).toISOString(),
                metadata: { method: 'mock' }
            }
        ];

        try {
            const { getAdminFirestore } = await import('@/lib/firebase-admin');
            const db = getAdminFirestore();

            const snapshot = await withQuotaGuard(
                () => db.collection('platform_audit_logs')
                    .orderBy('timestamp', 'desc')
                    .limit(limit)
                    .get(),
                // @ts-ignore - Mock snapshot
                { docs: MOCK_LOGS_FALLBACK.map(l => ({ id: l.id, data: () => l })) }
            );

            let logs = [];

            if ('docs' in snapshot) {
                logs = snapshot.docs.map((doc: any) => ({
                    id: doc.id,
                    ...doc.data(),
                    timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || doc.data().timestamp
                }));
            }

            // Phase 27C.5: Add Cache-Control to reduce Firestore reads
            const auditResponse = ApiSuccessResponse.ok({
                logs,
                authMode: 'REAL'
            });
            auditResponse.headers.set('Cache-Control', 'private, max-age=30');
            return auditResponse;

        } catch (dbError: any) {
            if (isQuotaError(dbError) || dbError?.code === 'SERVICE_UNAVAILABLE') {
                return ApiErrorResponse.serviceUnavailable(
                    'Audit logs unavailable due to high traffic (Quota).',
                    60
                );
            }
            throw dbError;
        }

    } catch (error) {
        if (isQuotaError(error)) {
            return ApiErrorResponse.serviceUnavailable('Audit logs unavailable (Quota).');
        }

        const appError = handleError(error as Error);
        console.error(`[API] Failed to fetch audit logs [${appError.errorId}]:`, appError.message);
        return ApiErrorResponse.internalError();
    }
}

function getMockAuditLogs() {
    return ApiSuccessResponse.ok({
        logs: [
            {
                id: 'dev-bypass-log-1',
                action: 'dev.bypass',
                status: 'success',
                timestamp: new Date().toISOString(),
                actor: { uid: 'dev', email: 'dev@local' }
            }
        ],
        authMode: 'DEV_BYPASS'
    });
}
