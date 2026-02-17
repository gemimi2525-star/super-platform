/**
 * ═══════════════════════════════════════════════════════════════════════════
 * GET /api/ops/runtime-policy/status
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Phase 35C: Owner-only runtime policy status endpoint.
 * Returns policy config summary + recent audit events.
 *
 * Security: requireAdmin() — same guard as phase-ledger.
 */

import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin-guard';
import { policyAuditLogger } from '@/coreos/brain/policy/policyAudit';
import { POLICY_VERSION, SCOPE_TOOL_ALLOWLIST, RATE_LIMITS } from '@/coreos/brain/policy/policyMatrix';
import { getNoncePoolSize } from '@/coreos/brain/policy/policyEngine';

export async function GET() {
    // Owner-only gate
    const guard = await requireAdmin();
    if (guard.error) return guard.error;

    try {
        const summary = policyAuditLogger.getSummary();

        return NextResponse.json({
            ok: true,
            data: {
                policyVersion: POLICY_VERSION,
                enforcementLayers: 2, // Gateway + Worker
                activeGates: 9, // 9-rule chain
                noncePoolSize: getNoncePoolSize(),
                scopes: Object.keys(SCOPE_TOOL_ALLOWLIST),
                rateLimits: RATE_LIMITS,
                audit: {
                    totalEvents: summary.totalEvents,
                    allowed: summary.allowed,
                    blocked: summary.blocked,
                    replayBlocked: summary.replayBlocked,
                    hashMismatches: summary.hashMismatches,
                    rateLimitHits: summary.rateLimitHits,
                    recentEvents: summary.recentEvents.map(e => ({
                        eventType: e.eventType,
                        timestamp: e.timestamp,
                        toolName: e.toolName,
                        appScope: e.appScope,
                        decision: e.decision,
                        riskLevel: e.riskLevel,
                    })),
                },
                ts: new Date().toISOString(),
            },
        });
    } catch (error: any) {
        console.error('[RuntimePolicy] Status error:', error);
        return NextResponse.json(
            { ok: false, error: 'Failed to retrieve runtime policy status' },
            { status: 500 },
        );
    }
}
