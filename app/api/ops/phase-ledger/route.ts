/**
 * ═══════════════════════════════════════════════════════════════════════════
 * GET /api/ops/phase-ledger — List Phase Ledger Snapshots
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Admin-only, paginated, searchable list of all phase deployment snapshots.
 * Supports filtering by query (phaseId/commit/tag/version) and environment.
 *
 * Phase 34.1
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin-guard';
import { getAdminFirestore } from '@/lib/firebase-admin';
import {
    COLLECTION_PHASE_LEDGER,
    DEFAULT_PAGE_LIMIT,
    MAX_PAGE_LIMIT,
} from '@/coreos/ops/phaseLedger/types';
import type { PhaseLedgerSnapshot, PhaseLedgerListResponse } from '@/coreos/ops/phaseLedger/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    // ── Admin Gate ────────────────────────────────────────────────────────
    const guard = await requireAdmin();
    if (guard.error) return guard.error;

    try {
        const url = new URL(req.url);
        const query = url.searchParams.get('query')?.trim().toLowerCase() || '';
        const envFilter = url.searchParams.get('env')?.trim().toLowerCase() || '';
        const cursor = url.searchParams.get('cursor')?.trim() || '';
        const limitParam = parseInt(url.searchParams.get('limit') || '', 10);
        const limit = Math.min(
            Math.max(isNaN(limitParam) ? DEFAULT_PAGE_LIMIT : limitParam, 1),
            MAX_PAGE_LIMIT,
        );

        const db = getAdminFirestore();

        // ── Build Firestore Query ────────────────────────────────────────
        let firestoreQuery: FirebaseFirestore.Query = db
            .collection(COLLECTION_PHASE_LEDGER)
            .orderBy('createdAt', 'desc');

        // Environment filter (native Firestore .where)
        if (envFilter === 'preview' || envFilter === 'production') {
            firestoreQuery = firestoreQuery.where('environment', '==', envFilter);
        }

        // Cursor pagination
        if (cursor) {
            try {
                const cursorDoc = await db.collection(COLLECTION_PHASE_LEDGER).doc(cursor).get();
                if (cursorDoc.exists) {
                    firestoreQuery = firestoreQuery.startAfter(cursorDoc);
                }
            } catch {
                // Invalid cursor → start from beginning
            }
        }

        // Fetch more if we need post-query search filtering
        const needsOverfetch = !!query;
        const fetchLimit = needsOverfetch
            ? Math.min((limit + 1) * 5, 500)
            : limit + 1;
        firestoreQuery = firestoreQuery.limit(fetchLimit);

        // ── Execute ──────────────────────────────────────────────────────
        const snapshot = await firestoreQuery.get();
        let docs = snapshot.docs;

        // ── Post-query search filter ─────────────────────────────────────
        if (query) {
            docs = docs.filter((doc) => {
                const d = doc.data() as PhaseLedgerSnapshot;
                return (
                    d.phaseId?.toLowerCase().includes(query) ||
                    d.commit?.toLowerCase().includes(query) ||
                    d.commitShort?.toLowerCase().includes(query) ||
                    d.tag?.toLowerCase().includes(query) ||
                    d.version?.toLowerCase().includes(query)
                );
            });
        }

        // ── Pagination ───────────────────────────────────────────────────
        const hasMore = docs.length > limit;
        const resultDocs = docs.slice(0, limit);
        const nextCursor = hasMore ? resultDocs[resultDocs.length - 1]?.id ?? null : null;

        const items = resultDocs.map((doc) => ({
            id: doc.id,
            ...(doc.data() as PhaseLedgerSnapshot),
        }));

        const response: PhaseLedgerListResponse = {
            ok: true,
            data: {
                items,
                nextCursor,
                total: items.length,
            },
        };

        return NextResponse.json(response);
    } catch (err: unknown) {
        console.error('[API/ops/phase-ledger] Error:', err);
        return NextResponse.json(
            { ok: false, error: 'Internal server error' },
            { status: 500 },
        );
    }
}
