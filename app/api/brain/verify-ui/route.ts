/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TEMPORARY — Phase 20 UI-Level Verification Endpoint
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * GET-callable endpoint for browser-level testing of the execution pipeline.
 * 
 * Actions via query parameter:
 *   ?action=status   → Kill switch + engine state
 *   ?action=execute  → Create SignedApproval + execute
 *   ?action=undo     → Undo last execution (&executionId=xxx)
 *   ?action=undo-double → Attempt double-undo (should fail)
 *   ?action=replay   → Replay same nonce (should fail with 409)
 *   ?action=audit    → Get audit log + verify chain
 * 
 * ⚠️ DELETE THIS FILE BEFORE PROMOTING TO PRODUCTION ⚠️
 * 
 * @module app/api/brain/verify-ui (TEMPORARY)
 */

import { NextRequest, NextResponse } from 'next/server';
import { executionEngine } from '@/coreos/brain/execution';
import { signData } from '@/coreos/attestation/signer';
import { getDefaultKeyProvider } from '@/coreos/attestation/keys';
import type { SignedApproval, ResourceTarget } from '@/coreos/brain/types';

// Store state between requests (server-side in-memory)
let lastExecutionId: string | null = null;
let lastNonce: string | null = null;
let lastApproval: SignedApproval | null = null;

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const action = request.nextUrl.searchParams.get('action') || 'status';
    const timestamp = new Date().toISOString();

    try {
        switch (action) {
            // ═══════════════════════════════════════════════════
            // STATUS — Check kill switch + engine state
            // ═══════════════════════════════════════════════════
            case 'status': {
                return NextResponse.json({
                    action: 'status',
                    timestamp,
                    killSwitch: process.env.BRAIN_AGENT_KILL || 'not set',
                    killSwitchActive: process.env.BRAIN_AGENT_KILL === 'true',
                    auditLogSize: executionEngine.getAuditLog().length,
                    lastExecutionId,
                });
            }

            // ═══════════════════════════════════════════════════
            // EXECUTE — Create SignedApproval + run pipeline
            // ═══════════════════════════════════════════════════
            case 'execute': {
                // Kill switch check (same as production endpoint)
                if (process.env.BRAIN_AGENT_KILL === 'true') {
                    return NextResponse.json({
                        action: 'execute',
                        blocked: true,
                        reason: 'Kill switch is active (BRAIN_AGENT_KILL=true)',
                        timestamp,
                    }, { status: 503 });
                }

                const nonce = `verify-ui-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
                const approvalId = `verify-approval-${Date.now()}`;
                const intentId = `verify-intent-${Date.now()}`;

                // Fields that will be signed (canonical order)
                const signedFields = [
                    'approvalId', 'intentId', 'actionType', 'scope',
                    'target', 'diff', 'approvedBy', 'approvedAt',
                    'expiresAt', 'nonce',
                ];

                // Build approval payload (without signature)
                const approvalPayload = {
                    approvalId,
                    intentId,
                    actionType: 'NOTE_REWRITE' as const,
                    scope: 'core.notes',
                    target: {
                        resourceType: 'note' as const,
                        resourceId: 'verify-ui-note-001',
                        displayName: 'UI Verification Note',
                    },
                    diff: {
                        before: '[Original content]',
                        after: '[Modified by UI verification test]',
                        summary: 'UI verification test: rewrite note content',
                    },
                    approvedBy: 'verify-ui-test',
                    approvedAt: Date.now(),
                    expiresAt: Date.now() + 300_000, // 5 minutes
                    nonce,
                    signedFields,
                };

                // Sign with Ed25519
                const dataToSign = JSON.stringify(approvalPayload);
                const signature = signData(dataToSign);

                const approval: SignedApproval = {
                    ...approvalPayload,
                    signature,
                };

                // Store for undo/replay tests
                lastNonce = nonce;
                lastApproval = approval;

                // Execute
                const result = await executionEngine.executeWithApproval(
                    approval,
                    async (target: ResourceTarget) => {
                        return JSON.stringify({
                            resourceId: target.resourceId,
                            content: `[Content of ${target.displayName}]`,
                            readAt: Date.now(),
                        });
                    },
                    async (target: ResourceTarget, diff: { before: string; after: string }) => {
                        console.log(`[VerifyUI] 📝 Applied: ${target.resourceId}`);
                    },
                );

                lastExecutionId = result.executionId;

                return NextResponse.json({
                    action: 'execute',
                    success: true,
                    timestamp,
                    executionId: result.executionId,
                    status: result.status,
                    snapshotRef: result.snapshotRef,
                    duration: result.duration,
                    nonce,
                    auditLogSize: executionEngine.getAuditLog().length,
                    _hint: 'Use ?action=undo to test undo, ?action=replay to test nonce replay, ?action=audit to check audit chain',
                });
            }

            // ═══════════════════════════════════════════════════
            // UNDO — Undo the last execution
            // ═══════════════════════════════════════════════════
            case 'undo': {
                const executionId = request.nextUrl.searchParams.get('executionId') || lastExecutionId;
                if (!executionId) {
                    return NextResponse.json({
                        action: 'undo',
                        error: 'No executionId — run ?action=execute first',
                    }, { status: 400 });
                }

                const undoResult: any = await executionEngine.undo(
                    executionId,
                    async (target: ResourceTarget, previousState: string) => {
                        console.log(`[VerifyUI] ↩️ Restored: ${target.resourceId}`);
                    },
                );

                return NextResponse.json({
                    action: 'undo',
                    success: true,
                    timestamp,
                    executionId: undoResult.executionId,
                    status: undoResult.status,
                    auditLogSize: executionEngine.getAuditLog().length,
                    _hint: 'Use ?action=undo-double to test double-undo rejection',
                });
            }

            // ═══════════════════════════════════════════════════
            // UNDO-DOUBLE — Attempt undo again (should fail)
            // ═══════════════════════════════════════════════════
            case 'undo-double': {
                const executionId = request.nextUrl.searchParams.get('executionId') || lastExecutionId;
                if (!executionId) {
                    return NextResponse.json({
                        action: 'undo-double',
                        error: 'No executionId — run ?action=execute then ?action=undo first',
                    }, { status: 400 });
                }

                try {
                    await executionEngine.undo(
                        executionId,
                        async (target: ResourceTarget, previousState: string) => {
                            console.log(`[VerifyUI] ↩️ Should NOT reach here`);
                        },
                    );
                    // If we got here, the double-undo was NOT blocked
                    return NextResponse.json({
                        action: 'undo-double',
                        success: false,
                        error: 'UNEXPECTED: Double-undo was NOT blocked!',
                        timestamp,
                    }, { status: 500 });
                } catch (err: any) {
                    // Expected: double-undo should throw
                    return NextResponse.json({
                        action: 'undo-double',
                        success: true,
                        blocked: true,
                        timestamp,
                        error: err.message,
                        _explanation: 'This is the EXPECTED result — double-undo was correctly blocked',
                    });
                }
            }

            // ═══════════════════════════════════════════════════
            // REPLAY — Reuse same nonce (should fail with 409)
            // ═══════════════════════════════════════════════════
            case 'replay': {
                if (!lastApproval || !lastNonce) {
                    return NextResponse.json({
                        action: 'replay',
                        error: 'No previous approval — run ?action=execute first',
                    }, { status: 400 });
                }

                // Kill switch check
                if (process.env.BRAIN_AGENT_KILL === 'true') {
                    return NextResponse.json({
                        action: 'replay',
                        blocked: true,
                        reason: 'Kill switch is active — cannot test replay',
                    }, { status: 503 });
                }

                try {
                    // Create a NEW approval with the SAME nonce (replay attack)
                    const replayApproval: SignedApproval = {
                        ...lastApproval,
                        approvalId: `replay-${Date.now()}`,
                        // Keep same nonce! This should be rejected
                    };

                    await executionEngine.executeWithApproval(
                        replayApproval,
                        async () => '{}',
                        async () => { },
                    );

                    // If we got here, replay was NOT blocked
                    return NextResponse.json({
                        action: 'replay',
                        success: false,
                        error: 'UNEXPECTED: Replay was NOT blocked!',
                        timestamp,
                    }, { status: 500 });
                } catch (err: any) {
                    // Expected: nonce replay should throw
                    return NextResponse.json({
                        action: 'replay',
                        success: true,
                        blocked: true,
                        timestamp,
                        error: err.message,
                        nonce: lastNonce,
                        _explanation: 'This is the EXPECTED result — nonce replay was correctly rejected',
                    }, { status: 409 });
                }
            }

            // ═══════════════════════════════════════════════════
            // AUDIT — Get audit log + verify chain integrity
            // ═══════════════════════════════════════════════════
            case 'audit': {
                const auditLog = executionEngine.getAuditLog();
                const chainResult = executionEngine.verifyAuditChain();

                return NextResponse.json({
                    action: 'audit',
                    timestamp,
                    chainValid: chainResult.valid,
                    brokenAt: chainResult.brokenAt,
                    totalEntries: auditLog.length,
                    entries: auditLog.map(e => ({
                        entryId: e.entryId,
                        executionId: e.executionId,
                        actionType: e.actionType,
                        scope: e.scope,
                        status: e.status,
                        executedAt: new Date(e.executedAt).toISOString(),
                        prevHash: e.prevHash?.substring(0, 16) + '...',
                        recordHash: e.recordHash?.substring(0, 16) + '...',
                    })),
                });
            }

            default:
                return NextResponse.json({
                    error: `Unknown action: ${action}`,
                    availableActions: ['status', 'execute', 'undo', 'undo-double', 'replay', 'audit'],
                }, { status: 400 });
        }

    } catch (error: any) {
        return NextResponse.json({
            action,
            error: error.message,
            timestamp,
        }, { status: 500 });
    }
}
