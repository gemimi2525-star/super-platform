/**
 * ═══════════════════════════════════════════════════════════════════════════
 * GET /api/ops/phase-ledger/diff — Snapshot Diff (Latest vs Previous)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Owner-only. Fetches the latest 2 snapshots for a given env and returns
 * a field-level diff of parity-critical fields.
 *
 * Phase 35B
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin-guard';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTION_PHASE_LEDGER } from '@/coreos/ops/phaseLedger/types';
import type {
    PhaseLedgerSnapshot,
    DiffSnapshotSummary,
    DiffChange,
    DiffResponse,
} from '@/coreos/ops/phaseLedger/types';

export const dynamic = 'force-dynamic';

/** Fields allowed for diff comparison — parity-critical only */
const DIFF_FIELDS: { path: string; label: string; extract: (d: PhaseLedgerSnapshot) => string }[] = [
    { path: 'commitShort', label: 'commitShort', extract: d => d.commitShort ?? '' },
    { path: 'version', label: 'version', extract: d => d.version ?? '' },
    { path: 'tag', label: 'tag', extract: d => d.tag ?? '' },
    { path: 'integrity.status', label: 'integrity.status', extract: d => d.integrity?.status ?? '' },
    {
        path: 'integrity.governance.ok',
        label: 'integrity.governance.ok',
        extract: d => String(d.integrity?.governance?.ok ?? ''),
    },
    {
        path: 'integrity.governance.hashValid',
        label: 'integrity.governance.hashValid',
        extract: d => String(d.integrity?.governance?.hashValid ?? ''),
    },
    {
        path: 'integrity.governance.kernelFrozen',
        label: 'integrity.governance.kernelFrozen',
        extract: d => String(d.integrity?.governance?.kernelFrozen ?? ''),
    },
    {
        path: 'integrity.errorCodes',
        label: 'integrity.errorCodes',
        extract: d => JSON.stringify(d.integrity?.errorCodes ?? []),
    },
];

function toSummary(id: string, doc: PhaseLedgerSnapshot): DiffSnapshotSummary {
    return {
        id,
        phaseId: doc.phaseId,
        commitShort: doc.commitShort,
        version: doc.version,
        tag: doc.tag,
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
        const env = url.searchParams.get('env')?.trim().toLowerCase() || 'production';

        const db = getAdminFirestore();

        let query: FirebaseFirestore.Query = db
            .collection(COLLECTION_PHASE_LEDGER)
            .orderBy('createdAt', 'desc');

        if (env === 'preview' || env === 'production') {
            query = query.where('environment', '==', env);
        }

        query = query.limit(2);

        const snapshot = await query.get();
        const docs = snapshot.docs;

        if (docs.length === 0) {
            return NextResponse.json({
                ok: false,
                error: 'No snapshots found',
                data: { latest: null, previous: null, changes: [], driftDetected: false },
            });
        }

        const latestDoc = docs[0].data() as PhaseLedgerSnapshot;
        const latest = toSummary(docs[0].id, latestDoc);

        let previous: DiffSnapshotSummary | null = null;
        const changes: DiffChange[] = [];

        if (docs.length >= 2) {
            const prevDoc = docs[1].data() as PhaseLedgerSnapshot;
            previous = toSummary(docs[1].id, prevDoc);

            // Compute field-level diff
            for (const field of DIFF_FIELDS) {
                const fromVal = field.extract(prevDoc);
                const toVal = field.extract(latestDoc);
                if (fromVal !== toVal) {
                    changes.push({ field: field.label, from: fromVal, to: toVal });
                }
            }
        }

        const response: DiffResponse = {
            ok: true,
            data: {
                latest,
                previous,
                changes,
                driftDetected: changes.length > 0,
            },
        };

        return NextResponse.json(response);
    } catch (err: unknown) {
        console.error('[API/ops/phase-ledger/diff] Error:', err);
        return NextResponse.json({
            ok: false,
            data: { latest: null, previous: null, changes: [], driftDetected: false },
            error: err instanceof Error ? err.message.slice(0, 200) : 'Unknown error',
        });
    }
}
