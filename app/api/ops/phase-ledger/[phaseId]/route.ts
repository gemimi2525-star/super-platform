/**
 * ═══════════════════════════════════════════════════════════════════════════
 * GET /api/ops/phase-ledger/[phaseId] — Phase Detail
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Admin-only. Returns all snapshots (preview + production) for a given phaseId,
 * ordered by createdAt desc.
 *
 * Phase 34.1
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin-guard';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTION_PHASE_LEDGER } from '@/coreos/ops/phaseLedger/types';
import type { PhaseLedgerSnapshot, PhaseLedgerDetailResponse } from '@/coreos/ops/phaseLedger/types';

export const dynamic = 'force-dynamic';

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ phaseId: string }> },
) {
    // ── Admin Gate ────────────────────────────────────────────────────────
    const guard = await requireAdmin();
    if (guard.error) return guard.error;

    const { phaseId } = await params;

    if (!phaseId || typeof phaseId !== 'string') {
        return NextResponse.json(
            { ok: false, error: 'Missing phaseId parameter' },
            { status: 400 },
        );
    }

    try {
        const db = getAdminFirestore();
        const snapshot = await db
            .collection(COLLECTION_PHASE_LEDGER)
            .where('phaseId', '==', phaseId)
            .orderBy('createdAt', 'desc')
            .limit(50)
            .get();

        const snapshots = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...(doc.data() as PhaseLedgerSnapshot),
        }));

        const response: PhaseLedgerDetailResponse = {
            ok: true,
            data: {
                phaseId,
                snapshots,
            },
        };

        return NextResponse.json(response);
    } catch (err: unknown) {
        console.error(`[API/ops/phase-ledger/${phaseId}] Error:`, err);
        return NextResponse.json(
            { ok: false, error: 'Internal server error' },
            { status: 500 },
        );
    }
}
