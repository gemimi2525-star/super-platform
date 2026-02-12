/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TEMPORARY — Phase 20 Deep Verification Endpoint
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * !! DELETE THIS FILE AFTER VERIFICATION IS COMPLETE !!
 * 
 * Server-side test endpoint that runs the full execution pipeline:
 * - Creates valid SignedApprovals (signed with TestKeyProvider)
 * - Executes NO TE_REWRITE through ExecutionEngine
 * - Verifies Snapshot, Undo, Audit Trail, Nonce Replay
 * 
 * @module app/api/brain/test-deep-verify
 */

import { NextRequest, NextResponse } from 'next/server';
import { executionEngine } from '@/coreos/brain/execution';
import { signData } from '@/coreos/attestation/signer';
import type { SignedApproval, ResourceTarget } from '@/coreos/brain/types';

/**
 * Create a valid SignedApproval with Ed25519 signature
 */
function createSignedApproval(overrides: Partial<SignedApproval> = {}): SignedApproval {
    const now = Date.now();

    const approval: Omit<SignedApproval, 'signature'> & { signature: string } = {
        approvalId: overrides.approvalId || `apr-test-${crypto.randomUUID()}`,
        intentId: overrides.intentId || `int-test-${crypto.randomUUID()}`,
        actionType: overrides.actionType || 'NOTE_REWRITE',
        scope: overrides.scope || 'core.notes',
        target: overrides.target || {
            resourceId: 'note-deep-verify-001',
            resourceType: 'note',
            displayName: 'Deep Verification Test Note',
        },
        diff: overrides.diff || {
            before: 'Original content before execution',
            after: 'New content after AI rewrite',
            summary: 'AI rewrote the note content',
        },
        approvedBy: overrides.approvedBy || 'OWNER_AUTHORITY',
        approvedAt: overrides.approvedAt || now,
        expiresAt: overrides.expiresAt || (now + 15 * 60 * 1000), // 15 min
        nonce: overrides.nonce || crypto.randomUUID(),
        signature: '', // Will be computed below
        signedFields: overrides.signedFields || [
            'approvalId', 'intentId', 'actionType', 'scope',
            'target', 'diff', 'approvedBy', 'approvedAt',
            'expiresAt', 'nonce',
        ],
    };

    // Canonicalize and sign (matches ExecutionEngine.canonicalize)
    const canonical: Record<string, any> = {};
    for (const field of approval.signedFields) {
        canonical[field] = (approval as any)[field];
    }
    const canonicalPayload = JSON.stringify(canonical);
    approval.signature = signData(canonicalPayload);

    return approval as SignedApproval;
}

/**
 * POST /api/brain/test-deep-verify
 * 
 * Runs complete 7-Gate verification and returns all evidence.
 */
export async function POST(request: NextRequest) {
    // Safety: Only allow in non-production environments
    if (process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV === 'production') {
        return NextResponse.json({ error: 'Test endpoint not available in production' }, { status: 403 });
    }

    const results: Record<string, any> = {
        timestamp: new Date().toISOString(),
        environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown',
        killSwitchEnv: process.env.BRAIN_AGENT_KILL,
        gates: {},
    };

    try {
        // ═══════════════════════════════════════════════════════════════
        // TEST B.1: Execute NOTE_REWRITE → Verify Snapshot + Audit
        // ═══════════════════════════════════════════════════════════════
        console.log('[DeepVerify] ═══ TEST B.1: Execute + Snapshot ═══');

        const approval1 = createSignedApproval();
        const nonce1 = approval1.nonce;

        let result1: any;
        try {
            result1 = await executionEngine.executeWithApproval(
                approval1,
                async (target: ResourceTarget) => {
                    return JSON.stringify({
                        resourceId: target.resourceId,
                        content: 'Original content before execution',
                        readAt: Date.now(),
                    });
                },
                async (target: ResourceTarget, diff: { before: string; after: string }) => {
                    console.log(`[DeepVerify] \ud83d\udcdd Applied: ${diff.after.substring(0, 50)}...`);
                },
            );
        } catch (err: any) {
            result1 = { _caughtError: true, error: err.message };
        }

        results.gates['G20-2_Snapshot'] = {
            test: 'Execute NOTE_REWRITE → Verify snapshotRef created',
            approval: { approvalId: approval1.approvalId, nonce: nonce1 },
            result: result1,
            passed: !!(result1 && !result1._caughtError && result1.snapshotRef),
            evidence: {
                hasExecutionId: !!(result1 as any)?.executionId,
                hasSnapshotRef: !!(result1 as any)?.snapshotRef,
                snapshotRef: (result1 as any)?.snapshotRef || null,
                hasUndoPlan: !!(result1 as any)?.undoPlan,
                status: (result1 as any)?.status || (result1 as any)?.error,
            },
        };

        // ═══════════════════════════════════════════════════════════════
        // TEST B.2: Hash Chain — Execute 2nd time, verify chain
        // ═══════════════════════════════════════════════════════════════
        console.log('[DeepVerify] ═══ TEST B.2: Hash Chain ═══');

        const approval2 = createSignedApproval();

        let result2: any;
        try {
            result2 = await executionEngine.executeWithApproval(
                approval2,
                async (target: ResourceTarget) => {
                    return JSON.stringify({
                        resourceId: target.resourceId,
                        content: 'Content for hash chain test',
                        readAt: Date.now(),
                    });
                },
                async () => { },
            );
        } catch (err: any) {
            result2 = { _caughtError: true, error: err.message };
        }

        // Verify audit chain
        let chainValid = false;
        try {
            const chainResult = executionEngine.verifyAuditChain();
            chainValid = chainResult.valid;
            results.gates['G20-5_AuditTrail'] = {
                test: 'Hash chain integrity after 2 executions',
                chainResult,
                auditLogLength: executionEngine.getAuditLog().length,
                passed: chainValid,
                evidence: {
                    entries: executionEngine.getAuditLog().map((e: any) => ({
                        entryId: e.entryId,
                        executionId: e.executionId,
                        status: e.status,
                        prevHash: e.prevHash,
                        recordHash: e.recordHash,
                    })),
                },
            };
        } catch (err: any) {
            results.gates['G20-5_AuditTrail'] = {
                test: 'Hash chain integrity',
                passed: false,
                error: err.message,
            };
        }

        // ═══════════════════════════════════════════════════════════════
        // TEST C: Undo Flow — Execute → Undo → Verify
        // ═══════════════════════════════════════════════════════════════
        console.log('[DeepVerify] ═══ TEST C: Undo Flow ═══');

        const approval3 = createSignedApproval({
            target: {
                resourceId: 'note-undo-test-001',
                resourceType: 'note',
                displayName: 'Undo Test Note',
            },
        });

        let result3: any;
        try {
            result3 = await executionEngine.executeWithApproval(
                approval3,
                async (target: ResourceTarget) => {
                    return JSON.stringify({
                        resourceId: target.resourceId,
                        content: 'Content BEFORE undo test',
                        readAt: Date.now(),
                    });
                },
                async () => { },
            );
        } catch (err: any) {
            result3 = { _caughtError: true, error: err.message };
        }

        let undoResult: any;
        let undoDoubleResult: any;
        if (result3 && !result3._caughtError) {
            // Try undo
            try {
                undoResult = await executionEngine.undo(
                    result3.executionId,
                    async (_target: ResourceTarget, _previousState: string) => {
                        console.log('[DeepVerify] 🔄 Restore applied from snapshot');
                    },
                );
            } catch (err: any) {
                undoResult = { _caughtError: true, error: err.message };
            }

            // Try double undo (should fail)
            try {
                undoDoubleResult = await executionEngine.undo(
                    result3.executionId,
                    async (_t: ResourceTarget, _s: string) => { },
                );
            } catch (err: any) {
                undoDoubleResult = { _caughtError: true, error: err.message, expectedFailure: true };
            }
        }

        results.gates['G20-3_Undo'] = {
            test: 'Execute → Undo → Verify revert + double-undo rejection',
            executeResult: result3 ? { executionId: result3.executionId, status: result3.status } : null,
            undoResult,
            doubleUndoResult: undoDoubleResult,
            passed: !!(undoResult && !undoResult._caughtError && undoDoubleResult && undoDoubleResult._caughtError),
            evidence: {
                undoSuccess: !!(undoResult && !undoResult._caughtError),
                doubleUndoBlocked: !!(undoDoubleResult && undoDoubleResult._caughtError),
                auditLogAfterUndo: executionEngine.getAuditLog().length,
                chainStillValid: executionEngine.verifyAuditChain().valid,
            },
        };

        // ═══════════════════════════════════════════════════════════════
        // TEST D.1: Nonce Replay — Same nonce should be rejected
        // ═══════════════════════════════════════════════════════════════
        console.log('[DeepVerify] ═══ TEST D.1: Nonce Replay ═══');

        const replayApproval = createSignedApproval({ nonce: nonce1 }); // REUSE nonce from TEST B.1

        let replayResult: any;
        try {
            replayResult = await executionEngine.executeWithApproval(
                replayApproval,
                async () => '{}',
                async () => { },
            );
        } catch (err: any) {
            replayResult = { _caughtError: true, error: err.message, isNonceRejection: err.message.includes('NONCE') };
        }

        results.gates['G20-6_NonceReplay'] = {
            test: 'Replay same nonce → must be rejected',
            reusedNonce: nonce1,
            result: replayResult,
            passed: !!(replayResult && replayResult._caughtError && replayResult.isNonceRejection),
            evidence: {
                rejected: !!replayResult?._caughtError,
                errorMessage: replayResult?.error || null,
                isNonceRelated: replayResult?.isNonceRejection || false,
            },
        };

        // ═══════════════════════════════════════════════════════════════
        // TEST D.2: Scope Isolation — Wrong scope should be rejected
        // ═══════════════════════════════════════════════════════════════
        console.log('[DeepVerify] ═══ TEST D.2: Scope Isolation ═══');

        const wrongScopeApproval = createSignedApproval({ scope: 'core.files' });

        let scopeResult: any;
        try {
            scopeResult = await executionEngine.executeWithApproval(
                wrongScopeApproval,
                async () => '{}',
                async () => { },
            );
        } catch (err: any) {
            scopeResult = { _caughtError: true, error: err.message, isScopeRejection: err.message.includes('scope') || err.message.includes('Phase 20') };
        }

        results.gates['G20-4_ScopeIsolation'] = {
            test: 'Wrong scope (core.files) → must be rejected',
            result: scopeResult,
            passed: !!(scopeResult && scopeResult._caughtError),
        };

        // ═══════════════════════════════════════════════════════════════
        // TEST G20-1: No Unsigned Execution
        // ═══════════════════════════════════════════════════════════════
        console.log('[DeepVerify] ═══ TEST G20-1: Unsigned ═══');

        // Create approval without signature
        const unsignedApproval = createSignedApproval();
        unsignedApproval.signature = ''; // Remove signature

        let unsignedResult: any;
        try {
            unsignedResult = await executionEngine.executeWithApproval(
                unsignedApproval,
                async () => '{}',
                async () => { },
            );
        } catch (err: any) {
            unsignedResult = { _caughtError: true, error: err.message };
        }

        results.gates['G20-1_UnsignedExec'] = {
            test: 'Execution without signature → must be rejected',
            result: unsignedResult,
            passed: !!(unsignedResult && unsignedResult._caughtError),
        };

        // ═══════════════════════════════════════════════════════════════
        // FINAL: Audit Chain Summary
        // ═══════════════════════════════════════════════════════════════
        const finalChain = executionEngine.verifyAuditChain();
        const fullAuditLog = executionEngine.getAuditLog();

        results.finalAuditChain = {
            valid: finalChain.valid,
            totalEntries: fullAuditLog.length,
            entries: fullAuditLog.map((e: any) => ({
                entryId: e.entryId,
                executionId: e.executionId,
                actionType: e.actionType,
                status: e.status,
                prevHash: e.prevHash?.substring(0, 16) + '...',
                recordHash: e.recordHash?.substring(0, 16) + '...',
            })),
        };

        // ═══════════════════════════════════════════════════════════════
        // SUMMARY
        // ═══════════════════════════════════════════════════════════════
        const allGates = Object.entries(results.gates);
        const passedCount = allGates.filter(([_, v]) => (v as any).passed).length;
        results.summary = {
            total: allGates.length,
            passed: passedCount,
            failed: allGates.length - passedCount,
            allPassed: passedCount === allGates.length,
            gateResults: Object.fromEntries(allGates.map(([k, v]) => [k, (v as any).passed ? '✅ PASSED' : '❌ FAILED'])),
        };

        return NextResponse.json(results, { status: 200 });

    } catch (error: any) {
        results.fatalError = error.message;
        return NextResponse.json(results, { status: 500 });
    }
}
