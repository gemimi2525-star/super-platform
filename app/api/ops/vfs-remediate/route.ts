/**
 * ═══════════════════════════════════════════════════════════════════════════
 * POST /api/ops/vfs-remediate — VFS Remediation API (Phase 37C)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Owner-only endpoint for generating and applying remediation plans.
 *
 * POST { action: 'plan', scanResult }  → Generate remediation plan (preview)
 * POST { action: 'apply', planId }     → Execute stored plan (step-by-step)
 *
 * @module app/api/ops/vfs-remediate/route
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin-guard';

// ═══════════════════════════════════════════════════════════════════════════
// IN-MEMORY PLAN STORE (server-side, per-deployment)
// ═══════════════════════════════════════════════════════════════════════════

interface StoredPlan {
    planId: string;
    plan: any;
    createdBy: string;
    createdAt: number;
    applied: boolean;
    appliedAt?: number;
}

let storedPlans: Map<string, StoredPlan> = new Map();

// ═══════════════════════════════════════════════════════════════════════════
// POST — Plan or Apply
// ═══════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
    try {
        const guard = await requireAdmin();
        if (guard.error) return guard.error;

        const body = await request.json();
        const { action } = body;

        if (action === 'plan') {
            return handlePlan(body, guard.uid);
        }

        if (action === 'apply') {
            return handleApply(body, guard.uid);
        }

        return NextResponse.json(
            { ok: false, error: `Unknown action: ${action}. Use 'plan' or 'apply'.` },
            { status: 400 },
        );
    } catch (error: any) {
        console.error('[API/ops/vfs-remediate] POST error:', error?.message);
        return NextResponse.json(
            { ok: false, error: 'Internal error' },
            { status: 500 },
        );
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// PLAN HANDLER
// ═══════════════════════════════════════════════════════════════════════════

function handlePlan(body: any, uid: string) {
    const { plan } = body;

    if (!plan || !plan.planId || !Array.isArray(plan.actions)) {
        return NextResponse.json(
            { ok: false, error: 'Invalid plan format. Requires planId and actions[].' },
            { status: 400 },
        );
    }

    // Store plan for later apply
    const stored: StoredPlan = {
        planId: plan.planId,
        plan,
        createdBy: uid,
        createdAt: Date.now(),
        applied: false,
    };

    storedPlans.set(plan.planId, stored);

    console.info('[API/ops/vfs-remediate] Plan stored:', {
        planId: plan.planId,
        actions: plan.actions.length,
        createdBy: uid,
    });

    return NextResponse.json({
        ok: true,
        data: {
            planId: plan.planId,
            stored: true,
            actionsCount: plan.actions.length,
            summary: plan.summary,
        },
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// APPLY HANDLER
// ═══════════════════════════════════════════════════════════════════════════

function handleApply(body: any, uid: string) {
    const { planId } = body;

    if (!planId) {
        return NextResponse.json(
            { ok: false, error: 'Missing planId' },
            { status: 400 },
        );
    }

    const stored = storedPlans.get(planId);
    if (!stored) {
        return NextResponse.json(
            { ok: false, error: `Plan not found: ${planId}` },
            { status: 404 },
        );
    }

    if (stored.applied) {
        return NextResponse.json(
            { ok: false, error: `Plan already applied at ${new Date(stored.appliedAt!).toISOString()}` },
            { status: 409 },
        );
    }

    // Mark as applied (actual rename execution happens client-side via driver)
    stored.applied = true;
    stored.appliedAt = Date.now();

    console.info('[API/ops/vfs-remediate] Plan applied:', {
        planId,
        appliedBy: uid,
        actionsCount: stored.plan.actions.length,
    });

    return NextResponse.json({
        ok: true,
        data: {
            planId,
            applied: true,
            appliedAt: stored.appliedAt,
            actionsCount: stored.plan.actions.length,
        },
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// GET — Check plan status
// ═══════════════════════════════════════════════════════════════════════════

export async function GET() {
    try {
        const guard = await requireAdmin();
        if (guard.error) return guard.error;

        const plans = Array.from(storedPlans.values()).map(p => ({
            planId: p.planId,
            createdBy: p.createdBy,
            createdAt: p.createdAt,
            applied: p.applied,
            appliedAt: p.appliedAt,
            actionsCount: p.plan.actions?.length || 0,
        }));

        return NextResponse.json({
            ok: true,
            data: { plans, total: plans.length },
        });
    } catch (error: any) {
        console.error('[API/ops/vfs-remediate] GET error:', error?.message);
        return NextResponse.json(
            { ok: false, error: 'Internal error' },
            { status: 500 },
        );
    }
}
