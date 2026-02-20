/**
 * ═══════════════════════════════════════════════════════════════════════════
 * API — GET /api/os/process/list (Phase 15B)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Returns all active process records.
 * No auth required for list (read-only, client state).
 */

import { NextResponse } from 'next/server';
import { getIntegrity } from '@/lib/ops/integrity/getIntegrity';

export async function GET() {
    try {
        const integrity = await getIntegrity();

        return NextResponse.json({
            processes: [],  // Client-side store is source of truth; server returns empty for now
            ts: new Date().toISOString(),
            sha: integrity.checks?.build?.sha ?? 'unknown',
            phase: integrity.phase ?? 'unknown',
            version: integrity.version ?? 'unknown',
            note: 'Process registry is client-side (localStorage). This endpoint provides integrity metadata.',
        });
    } catch (error: any) {
        console.error('[API/os/process/list] Error:', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
