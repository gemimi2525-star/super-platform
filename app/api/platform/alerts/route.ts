/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PHASE 12.1: Alerts API — Firestore DAL
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * GET /api/platform/alerts
 * Returns active alerts and summary from Firestore.
 * Requires authentication with audit.view permission.
 * 
 * ⚠️ READ-ONLY — No alert acknowledgment or action endpoints.
 * 
 * SYNAPSE Kernel: FROZEN ❄️ - Policy at API layer only
 */

import { getAuthContext } from '@/lib/auth/server';
import { ApiSuccessResponse, ApiErrorResponse } from '@/lib/api';
import { handleError } from '@super-platform/core';
import { normalizeError } from '@/lib/platform/errors/normalize';
import { getTraceId } from '@/lib/platform/logging/trace';

// DAL Imports (Phase 12)
import { listAlerts, countByLevel } from '@/lib/platform/data/alerts.repo';

export const runtime = 'nodejs';

export async function GET() {
    const traceId = await getTraceId();

    try {
        // ═══════════════════════════════════════════════════════════════════════════
        // PHASE 9.9: DEV BYPASS — Check FIRST before auth (same pattern as Users API)
        // ═══════════════════════════════════════════════════════════════════════════
        if (process.env.NODE_ENV === 'development' && process.env.AUTH_DEV_BYPASS === 'true') {
            console.log('[API:Alerts] Dev bypass mode - returning mock alerts');
            return getMockAlerts(traceId);
        }

        const auth = await getAuthContext();

        if (!auth) {
            const normalized = normalizeError(new Error('Authentication required'));
            return ApiErrorResponse.unauthorized(normalized.message);
        }

        // ═══════════════════════════════════════════════════════════════════════════
        // PHASE 12: Use Firestore DAL
        // ═══════════════════════════════════════════════════════════════════════════

        // Get unresolved alerts (active)
        const alertsResult = await listAlerts({ resolved: false, limit: 50 });

        if (!alertsResult.ok) {
            const normalized = normalizeError(new Error(alertsResult.message || 'Failed to fetch alerts'));
            return ApiErrorResponse.internalError(normalized.message);
        }

        const activeAlerts = alertsResult.data || [];

        // Get alert counts by level
        const countResult = await countByLevel();

        const summary = countResult.ok ? {
            total: activeAlerts.length,
            critical: countResult.data?.critical || 0,
            warning: countResult.data?.warning || 0,
            info: countResult.data?.info || 0,
            acknowledged: 0, // resolved alerts not counted here
        } : {
            total: activeAlerts.length,
            critical: 0,
            warning: 0,
            info: 0,
            acknowledged: 0,
        };

        // Transform for API response
        const alerts = activeAlerts.map(alert => ({
            id: alert.id,
            type: alert.level,
            title: alert.title,
            description: alert.message,
            severity: alert.level === 'critical' ? 'high' : alert.level === 'warning' ? 'medium' : 'low',
            timestamp: alert.createdAt,
            acknowledged: alert.resolved,
            correlatedRequestIds: [],
        }));

        return ApiSuccessResponse.ok({
            alerts,
            summary,
            history: [],
            logStats: {
                total: 0,
                errors: summary.critical,
                warnings: summary.warning,
                info: summary.info,
            },
            rules: [],
            timestamp: new Date().toISOString(),
            traceId,
            authMode: 'REAL',
        });

    } catch (error) {
        const appError = handleError(error as Error);
        const normalized = normalizeError(error);
        console.error(`[API] Failed to fetch alerts [${appError.errorId}]:`, appError.message);

        return new Response(JSON.stringify({
            success: false,
            error: {
                code: normalized.code,
                message: normalized.message,
                traceId,
                retryable: normalized.retryable,
            },
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

/**
 * Mock alerts for dev bypass mode
 */
function getMockAlerts(traceId: string) {
    const mockData = {
        alerts: [
            {
                id: 'mock-alert-001',
                type: 'warning',
                title: 'High Memory Usage',
                description: 'Memory usage is above 80% threshold (Mock)',
                severity: 'medium',
                timestamp: new Date().toISOString(),
                acknowledged: false,
                correlatedRequestIds: [],
            },
            {
                id: 'mock-alert-002',
                type: 'info',
                title: 'System Update Available',
                description: 'A new system update is ready to install (Mock)',
                severity: 'low',
                timestamp: new Date(Date.now() - 3600000).toISOString(),
                acknowledged: true,
                correlatedRequestIds: [],
            },
        ],
        summary: {
            total: 2,
            critical: 0,
            warning: 1,
            info: 1,
            acknowledged: 1,
        },
        history: [],
        logStats: {
            total: 150,
            errors: 5,
            warnings: 20,
            info: 125,
        },
        rules: [],
        timestamp: new Date().toISOString(),
        traceId,
        authMode: 'DEV_BYPASS',
    };

    return ApiSuccessResponse.ok(mockData);
}
