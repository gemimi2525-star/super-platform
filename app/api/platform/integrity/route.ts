/**
 * ═══════════════════════════════════════════════════════════════════════════
 * API — GET /api/platform/integrity (Phase 35A — Access Controlled)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * OS-level integrity endpoint with enterprise access control.
 *   - Owner/Admin: full response with checks, signature, governance details
 *   - Public: redacted response (status + errorCodes only)
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
import { checkOpsAccess } from '@/lib/auth/opsAccessPolicy';

const NO_STORE_HEADERS = {
    'Cache-Control': 'no-store',
    'Pragma': 'no-cache',
    'Surrogate-Control': 'no-store',
    'Content-Type': 'application/json',
};

export async function GET() {
    try {
        // ── Access Check ──────────────────────────────────────────────────
        const access = await checkOpsAccess();
        const result = await getIntegrity();

        // ── Owner: Full Response with Signature ───────────────────────────
        if (access.isOwner) {
            const signature = signPayload(result as unknown as Record<string, unknown>);
            const signedResult = {
                ...result,
                signature: signature ?? 'unsigned',
            };
            return NextResponse.json(signedResult, {
                status: 200,
                headers: NO_STORE_HEADERS,
            });
        }

        // ── Public: Redacted Response ─────────────────────────────────────
        return NextResponse.json(
            {
                status: result.status,
                errorCodes: result.errorCodes,
                ts: result.ts,
                phase: result.phase,
                _notice: 'Authenticate as owner for full integrity details.',
            },
            {
                status: 200,
                headers: NO_STORE_HEADERS,
            },
        );
    } catch (error: unknown) {
        // Internal error — do NOT expose stack trace
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('[API/platform/integrity] Unhandled error:', message);

        return NextResponse.json(
            {
                status: 'DEGRADED',
                errorCodes: ['INTERNAL_ERROR'],
                ts: new Date().toISOString(),
                _notice: 'System integrity check encountered an error.',
            },
            {
                status: 200,
                headers: NO_STORE_HEADERS,
            },
        );
    }
}

