/**
 * API: Audit Verification
 * 
 * Phase 12.2: Verify audit logs in SYNAPSE Ledger
 * 
 * GET /api/platform/audit-verify?traceId=xxx
 * Returns verification result and attestation proof
 */

import { NextRequest } from 'next/server';
import { getAuthContext } from '@/lib/auth/server';
import { ApiSuccessResponse, ApiErrorResponse } from '@/lib/api';
import { handleError } from '@super-platform/core';
import {
    verifyAuditInLedger,
    generateAttestationProof,
    getLedgerSummary
} from '@/lib/platform/bridge/audit-synapse-bridge';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
    try {
        // ═══════════════════════════════════════════════════════════════════════════
        // PHASE 9.9: DEV BYPASS
        // ═══════════════════════════════════════════════════════════════════════════
        const isDev = process.env.NODE_ENV === 'development' &&
            process.env.AUTH_DEV_BYPASS === 'true';

        if (!isDev) {
            const auth = await getAuthContext();
            if (!auth) {
                return ApiErrorResponse.unauthorized();
            }
        }

        const { searchParams } = new URL(request.url);
        const traceId = searchParams.get('traceId');

        // If no traceId, return ledger summary
        if (!traceId) {
            const summary = await getLedgerSummary();
            return ApiSuccessResponse.ok({
                mode: 'summary',
                ledger: summary,
            });
        }

        // Verify specific audit log
        const verification = await verifyAuditInLedger(traceId);

        if (!verification.found) {
            return ApiSuccessResponse.ok({
                mode: 'verify',
                traceId,
                found: false,
                verified: false,
                error: verification.error,
            });
        }

        // Generate full attestation proof
        const proof = await generateAttestationProof(traceId);

        return ApiSuccessResponse.ok({
            mode: 'verify',
            traceId,
            found: true,
            verified: verification.verified,
            chainValid: verification.chainValid,
            ledgerIndex: verification.ledgerIndex,
            hash: verification.hash,
            proof,
        });

    } catch (error) {
        const appError = handleError(error as Error);
        console.error(`[API] Audit verification failed [${appError.errorId}]:`, appError.message);
        return ApiErrorResponse.internalError();
    }
}
