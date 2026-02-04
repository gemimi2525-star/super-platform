/**
 * API: Audit Bridge Test
 * 
 * Phase 12.2: Direct test endpoint for Audit → SYNAPSE Bridge
 * 
 * POST /api/platform/audit-bridge-test
 * Creates test audit entries and bridges them to SYNAPSE
 */

import { NextRequest } from 'next/server';
import { ApiSuccessResponse, ApiErrorResponse } from '@/lib/api';
import { handleError } from '@super-platform/core';
import { bridgeAuditToSynapse, getLedgerSummary, verifyAuditInLedger, generateAttestationProof } from '@/lib/platform/bridge/audit-synapse-bridge';
import type { AuditLog } from '@/lib/platform/data/audit.repo';

export const runtime = 'nodejs';

function generateTraceId(): string {
    return `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export async function POST(request: NextRequest) {
    try {
        // Only allow in development
        const isDev = process.env.NODE_ENV === 'development';
        if (!isDev) {
            return ApiErrorResponse.forbidden('Test endpoint only available in development');
        }

        const body = await request.json();
        const testCount = body.count || 3;
        const results: Array<{
            test: number;
            traceId: string;
            bridge: { ok: boolean; ledgerIndex?: number; hash?: string; signature?: string };
            verify: { found: boolean; verified: boolean };
            proof: object | null;
        }> = [];

        // Create and bridge test audit logs
        for (let i = 0; i < testCount; i++) {
            const traceId = generateTraceId();
            const testAudit: AuditLog = {
                id: `test-audit-${i + 1}`,
                actorId: 'test-actor',
                actorRole: 'admin',
                action: `PHASE12_E2E_TEST_${i + 1}`,
                target: 'audit-bridge-test',
                decision: i % 2 === 0 ? 'ALLOW' : 'DENY',
                policyId: 'phase12-test-policy',
                traceId,
                details: { testNumber: i + 1, timestamp: new Date().toISOString() },
                ts: new Date().toISOString(),
            };

            // Bridge to SYNAPSE
            const bridgeResult = await bridgeAuditToSynapse(testAudit);

            // Verify in ledger
            const verifyResult = await verifyAuditInLedger(traceId);

            // Generate proof
            const proof = await generateAttestationProof(traceId);

            results.push({
                test: i + 1,
                traceId,
                bridge: bridgeResult,
                verify: verifyResult,
                proof,
            });
        }

        // Get final ledger summary
        const summary = await getLedgerSummary();

        return ApiSuccessResponse.ok({
            message: `Created and verified ${testCount} test audit entries`,
            results,
            ledgerSummary: summary,
        });

    } catch (error) {
        const appError = handleError(error as Error);
        console.error(`[API] Bridge test failed [${appError.errorId}]:`, appError.message);
        return ApiErrorResponse.internalError();
    }
}

export async function GET() {
    try {
        const summary = await getLedgerSummary();
        return ApiSuccessResponse.ok({
            mode: 'test-summary',
            ledger: summary,
        });
    } catch (error) {
        const appError = handleError(error as Error);
        console.error(`[API] Bridge test summary failed [${appError.errorId}]:`, appError.message);
        return ApiErrorResponse.internalError();
    }
}
