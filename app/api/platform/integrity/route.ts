/**
 * ═══════════════════════════════════════════════════════════════════════════
 * API — GET /api/platform/integrity (Phase 30 — Signed Integrity)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * OS-level integrity endpoint. Returns JSON-only system integrity status
 * with HMAC SHA-256 signature for tamper detection.
 *
 * - No redirects, no sensitive data, no PII, no stack traces.
 * - Always 200 with status field (OK / DEGRADED) for monitoring tools.
 * - Cache-Control: no-store
 * - Signature field added in Phase 30 (backward compatible)
 *
 * Response schema: see IntegrityResult in lib/ops/integrity/getIntegrity.ts
 */

import { NextResponse } from 'next/server';
import { getIntegrity } from '@/lib/ops/integrity/getIntegrity';
import { signPayload } from '@/lib/ops/integrity/signIntegrity';

export async function GET() {
    try {
        const result = await getIntegrity();

        // Sign the payload with HMAC SHA-256
        const signature = signPayload(result as unknown as Record<string, unknown>);

        // Compose final response with signature
        const signedResult = {
            ...result,
            signature: signature ?? 'unsigned',
        };

        return NextResponse.json(signedResult, {
            status: 200,
            headers: {
                'Cache-Control': 'no-store',
                'Pragma': 'no-cache',
                'Surrogate-Control': 'no-store',
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
                phase: '30',
                version: 'v0.30',
                signature: 'unsigned',
            },
            {
                status: 200,
                headers: {
                    'Cache-Control': 'no-store',
                    'Pragma': 'no-cache',
                    'Surrogate-Control': 'no-store',
                    'Content-Type': 'application/json',
                },
            },
        );
    }
}
