/**
 * ═══════════════════════════════════════════════════════════════════════════
 * GET /api/ops/ledger-status — Ledger Metadata (Phase 34)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Secure read-only endpoint for ledger hash-chain metadata.
 * Returns minimal metadata only — NO raw entries.
 *
 * Auth: owner/admin only (requireAdmin)
 *
 * @module app/api/ops/ledger-status/route
 * @version 1.0.0
 */

import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin-guard';
import type { LedgerStatusResponse } from '@/coreos/integrity/IntegrityContract';

export const dynamic = 'force-dynamic';

export async function GET() {
    // ── Auth Gate ──────────────────────────────────────────────────────
    const guard = await requireAdmin();
    if (guard.error) return guard.error;

    try {
        // ── Load AuditLedger ──────────────────────────────────────────
        let ledger: {
            verifyChain(): { isValid: boolean; totalEntries: number };
            getChain(): readonly { hash: string }[];
        };

        try {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const mod = require('@synapse/core');
            ledger = mod.AuditLedger.getInstance();
        } catch {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const { AuditLedger } = require('../../../../packages/synapse/src/audit-ledger/ledger');
            ledger = AuditLedger.getInstance();
        }

        // ── Verify Chain ──────────────────────────────────────────────
        const report = ledger.verifyChain();
        const chain = ledger.getChain();

        const rootHash = chain.length > 0 ? chain[0].hash : 'N/A';
        const lastHash = chain.length > 0 ? chain[chain.length - 1].hash : 'N/A';

        const response: LedgerStatusResponse = {
            ok: report.isValid,
            ledgerRootHash: rootHash,
            lastEntryHash: lastHash,
            chainLength: report.totalEntries,
            isValid: report.isValid,
            fetchedAt: new Date().toISOString(),
        };

        return NextResponse.json(response, {
            headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
        });
    } catch (err: any) {
        console.error('[ledger-status] Error:', err.message);
        return NextResponse.json(
            {
                ok: false,
                ledgerRootHash: 'ERROR',
                lastEntryHash: 'ERROR',
                chainLength: 0,
                isValid: false,
                fetchedAt: new Date().toISOString(),
                error: err.message,
            } satisfies LedgerStatusResponse & { error: string },
            { status: 500 },
        );
    }
}
