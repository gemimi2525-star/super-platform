/**
 * ═══════════════════════════════════════════════════════════════════════════
 * GET /api/ops/phase-ledger/timeline — Deploy Timeline
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Owner-only. Returns slim timeline entries ordered by createdAt desc.
 * Supports env filter (production/preview) and limit.
 *
 * Phase 35B
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin-guard';
import { getAdminFirestore } from '@/lib/firebase-admin';
import {
    COLLECTION_PHASE_LEDGER,
    DEFAULT_PAGE_LIMIT,
    MAX_PAGE_LIMIT,
} from '@/coreos/ops/phaseLedger/types';
import type { PhaseLedgerSnapshot, TimelineEntry, TimelineResponse } from '@/coreos/ops/phaseLedger/types';

export const dynamic = 'force-dynamic';

function toTimelineEntry(id: string, doc: PhaseLedgerSnapshot): TimelineEntry {
    return {
        id,
        phaseId: doc.phaseId,
        commitShort: doc.commitShort,
        version: doc.version,
        tag: doc.tag,
        environment: doc.environment,
        integrityStatus: doc.integrity?.status ?? 'DEGRADED',
        governanceOk: doc.integrity?.governance?.ok ?? false,
        hashValid: doc.integrity?.governance?.hashValid ?? false,
        createdAt: doc.createdAt,
    };
}

export async function GET(req: NextRequest) {
    // ── Admin Gate ────────────────────────────────────────────────────────
    const guard = await requireAdmin();
    if (guard.error) return guard.error;

    try {
        const url = new URL(req.url);
        const envFilter = url.searchParams.get('env')?.trim().toLowerCase() || '';
        const limitParam = parseInt(url.searchParams.get('limit') || '', 10);
        const limit = Math.min(
            Math.max(isNaN(limitParam) ? DEFAULT_PAGE_LIMIT : limitParam, 1),
            MAX_PAGE_LIMIT,
        );

        const db = getAdminFirestore();

        let query: FirebaseFirestore.Query = db
            .collection(COLLECTION_PHASE_LEDGER)
            .orderBy('createdAt', 'desc');

        if (envFilter === 'preview' || envFilter === 'production') {
            query = query.where('environment', '==', envFilter);
        }

        query = query.limit(limit);

        const snapshot = await query.get();
        const items: TimelineEntry[] = snapshot.docs.map(doc =>
            toTimelineEntry(doc.id, doc.data() as PhaseLedgerSnapshot),
        );

        const response: TimelineResponse = {
            ok: true,
            data: { items, total: items.length },
        };

        return NextResponse.json(response);
    } catch (err: unknown) {
        console.error('[API/ops/phase-ledger/timeline] Error:', err);
        return NextResponse.json({
            ok: false,
            data: { items: [], total: 0 },
            error: err instanceof Error ? err.message.slice(0, 200) : 'Unknown error',
        });
    }
}
