/**
 * ═══════════════════════════════════════════════════════════════════════════
 * API — GET /api/platform/integrity (Phase 29)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * OS-level integrity endpoint. Returns JSON-only system integrity status.
 *
 * - No redirects, no sensitive data, no PII, no stack traces.
 * - Always 200 with status field (OK / DEGRADED) for monitoring tools.
 * - Cache-Control: no-store
 *
 * Response schema: see IntegrityResult in lib/ops/integrity/getIntegrity.ts
 */

import { NextResponse } from 'next/server';
import { getIntegrity } from '@/lib/ops/integrity/getIntegrity';

export async function GET() {
    try {
        const result = await getIntegrity();

        return NextResponse.json(result, {
            status: 200,
            headers: {
                'Cache-Control': 'no-store',
                'Content-Type': 'application/json',
            },
        });
    } catch (error: any) {
        // Internal error — do NOT expose stack trace
        console.error('[API/platform/integrity] Unhandled error:', error.message);

        return NextResponse.json(
            {
                status: 'DEGRADED',
                checks: {
                    firebase: { ok: false, latencyMs: 0, mode: 'unknown' as const },
                    auth: { mode: 'unknown' as const, ok: false },
                    governance: { kernelFrozen: 'unknown' as const, hashValid: 'unknown' as const, ok: false },
                    build: { sha: null, lockedTag: null, ok: false },
                },
                errorCodes: ['INTERNAL_ERROR'],
                ts: new Date().toISOString(),
                phase: '29',
                version: 'v0.29',
            },
            {
                status: 200,
                headers: {
                    'Cache-Control': 'no-store',
                    'Content-Type': 'application/json',
                },
            },
        );
    }
}
