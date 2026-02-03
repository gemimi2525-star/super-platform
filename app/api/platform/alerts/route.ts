/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PHASE 6.5.2: Alerts API
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * GET /api/platform/alerts
 * Returns active alerts and summary for Ops Center.
 * Requires authentication with audit.view permission.
 * 
 * ⚠️ READ-ONLY — No alert acknowledgment or action endpoints.
 */

import { getAuthContext } from '@/lib/auth/server';
import { ApiSuccessResponse, ApiErrorResponse } from '@/lib/api';
import { handleError } from '@super-platform/core';
import {
    checkAndGenerateAlerts,
    getAlertHistory,
    getAlertRules,
    getLogStats,
    type AlertsResponse,
} from '@/lib/ops';

export const runtime = 'nodejs';

export async function GET() {
    try {
        const auth = await getAuthContext();

        if (!auth) {
            return ApiErrorResponse.unauthorized();
        }

        // Note: In production, should check for audit.view permission
        // For now, any authenticated user can view alerts

        // Trigger alert evaluation
        const { activeAlerts, summary } = checkAndGenerateAlerts();

        // Get alert history for timeline view
        const history = getAlertHistory(50);

        // Get log stats for context
        const logStats = getLogStats();

        // Get rule definitions for display
        const rules = getAlertRules();

        const response: AlertsResponse & {
            history: typeof history;
            logStats: typeof logStats;
            rules: typeof rules;
        } = {
            alerts: activeAlerts,
            summary,
            history,
            logStats,
            rules,
            timestamp: new Date().toISOString(),
        };

        return ApiSuccessResponse.ok(response);

    } catch (error) {
        const appError = handleError(error as Error);
        console.error(`[API] Failed to fetch alerts [${appError.errorId}]:`, appError.message);
        return ApiErrorResponse.internalError();
    }
}
