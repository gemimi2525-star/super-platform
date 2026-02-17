/**
 * ═══════════════════════════════════════════════════════════════════════════
 * GET /api/ops/governance/status
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Phase 35D: Owner-only governance enforcement status endpoint.
 * Returns current governance mode, violation counts, reaction log.
 *
 * Security: requireAdmin() — same guard as phase-ledger.
 */

import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin-guard';
import { governanceReactionEngine } from '@/coreos/brain/policy/governanceReactionEngine';

export async function GET() {
    // Owner-only gate
    const guard = await requireAdmin();
    if (guard.error) return guard.error;

    try {
        const state = governanceReactionEngine.getState();
        const reactions = governanceReactionEngine.getReactionLog(10);

        return NextResponse.json({
            ok: true,
            data: {
                phase: '35D',
                governance: {
                    mode: state.mode,
                    reason: state.reason,
                    triggeredAt: state.triggeredAt,
                    triggeredBy: state.triggeredBy,
                    promotionBlocked: state.promotionBlocked,
                    lockExpiresAt: state.lockExpiresAt,
                },
                violations: state.violationCounts,
                lastIntegrityCheck: state.lastIntegrityCheck,
                recentReactions: reactions.map(r => ({
                    trigger: r.trigger,
                    actions: r.actions,
                    severity: r.severity,
                    timestamp: r.timestamp,
                    detail: r.detail,
                    previousMode: r.previousMode,
                    newMode: r.newMode,
                })),
                ts: new Date().toISOString(),
            },
        });
    } catch (error: any) {
        console.error('[Governance] Status error:', error);
        return NextResponse.json(
            { ok: false, error: 'Failed to retrieve governance status' },
            { status: 500 },
        );
    }
}
