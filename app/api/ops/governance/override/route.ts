/**
 * ═══════════════════════════════════════════════════════════════════════════
 * POST /api/ops/governance/override
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Phase 35D: Owner-only governance override endpoint.
 * Allows owner to manually reset governance mode (e.g., NORMAL after review).
 *
 * Security: requireAdmin() + POST-only.
 */

import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin-guard';
import { governanceReactionEngine } from '@/coreos/brain/policy/governanceReactionEngine';
import type { GovernanceMode } from '@/coreos/brain/policy/governanceTypes';

const VALID_MODES: GovernanceMode[] = ['NORMAL', 'THROTTLED', 'SOFT_LOCK', 'HARD_FREEZE'];

export async function POST(request: Request) {
    // Owner-only gate
    const guard = await requireAdmin();
    if (guard.error) return guard.error;

    try {
        const body = await request.json();
        const targetMode = body.mode as GovernanceMode;

        if (!targetMode || !VALID_MODES.includes(targetMode)) {
            return NextResponse.json(
                { ok: false, error: `Invalid mode. Must be one of: ${VALID_MODES.join(', ')}` },
                { status: 400 },
            );
        }

        const previousState = governanceReactionEngine.getState();
        const reaction = governanceReactionEngine.ownerOverride(targetMode);

        return NextResponse.json({
            ok: true,
            data: {
                action: 'OVERRIDE',
                previousMode: previousState.mode,
                newMode: targetMode,
                reaction: {
                    trigger: reaction.trigger,
                    actions: reaction.actions,
                    detail: reaction.detail,
                    timestamp: reaction.timestamp,
                },
                ts: new Date().toISOString(),
            },
        });
    } catch (error: any) {
        console.error('[Governance] Override error:', error);
        return NextResponse.json(
            { ok: false, error: 'Failed to execute governance override' },
            { status: 500 },
        );
    }
}
