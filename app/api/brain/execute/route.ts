/**
 * ═══════════════════════════════════════════════════════════════════════════
 * API ROUTE — Brain Execute (Phase 20 AGENT)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Dedicated endpoint for executing approved AI proposals.
 * 
 * Flow: Client Confirm → SignedApproval → Snapshot → Execute → Audit
 * 
 * Security:
 * - Requires valid SignedApproval with Ed25519 signature
 * - Nonce replay protection
 * - Scope locked to core.notes only in Phase 20
 * - Kill switch support via BRAIN_AGENT_KILL env variable
 * - Hash-chained audit trail
 * 
 * @module app/api/brain/execute
 */

import { NextRequest, NextResponse } from 'next/server';
import { trustEngine } from '@/coreos/brain/trust';
import { safetyGate } from '@/coreos/brain/shield';
import { executionEngine } from '@/coreos/brain/execution';
import type { SignedApproval, ResourceTarget } from '@/coreos/brain/types';

// ═══════════════════════════════════════════════════════════════════════════
// Rate Limiting (stricter for execute endpoint)
// ═══════════════════════════════════════════════════════════════════════════
const executeRateLimitMap = new Map<string, { count: number; resetAt: number }>();
const EXECUTE_RATE_LIMIT = 5; // Max 5 execute requests per minute
const EXECUTE_RATE_WINDOW = 60_000;

function checkExecuteRateLimit(clientId: string): boolean {
    const now = Date.now();
    const entry = executeRateLimitMap.get(clientId);

    if (!entry || now > entry.resetAt) {
        executeRateLimitMap.set(clientId, { count: 1, resetAt: now + EXECUTE_RATE_WINDOW });
        return true;
    }

    if (entry.count >= EXECUTE_RATE_LIMIT) {
        return false;
    }

    entry.count++;
    return true;
}

/**
 * POST /api/brain/execute
 * 
 * Body: SignedApproval object — fully constructed by the client
 * after user explicitly confirms a proposal.
 * 
 * {
 *   approval: SignedApproval,  // Full signed approval with Ed25519 signature
 * }
 */
export async function POST(request: NextRequest) {
    const correlationId = crypto.randomUUID();

    try {
        // ═══════════════════════════════════════════════════════════════
        // R0: Kill Switch Check
        // ═══════════════════════════════════════════════════════════════
        if (process.env.BRAIN_AGENT_KILL === 'true') {
            console.error(`[Execute] 🛑 KILL SWITCH ACTIVE — all executions blocked`);
            return NextResponse.json(
                { error: 'AI execution is currently disabled by kill switch.' },
                { status: 503 }
            );
        }

        // Client identification
        const clientId = request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip') ||
            'anonymous';

        // Strict rate limiting for execute
        if (!checkExecuteRateLimit(clientId)) {
            return NextResponse.json(
                { error: 'Execute rate limit exceeded. Max 5 per minute.' },
                { status: 429 }
            );
        }

        // Parse request body
        const body = await request.json();

        // ═══════════════════════════════════════════════════════════════
        // Validate required approval object
        // ═══════════════════════════════════════════════════════════════
        const approval: SignedApproval | undefined = body.approval;

        if (!approval) {
            return NextResponse.json(
                { error: 'Missing required field: approval (SignedApproval object)' },
                { status: 400 }
            );
        }

        // Validate essential fields exist
        const requiredFields = [
            'approvalId', 'intentId', 'actionType', 'scope',
            'target', 'diff', 'approvedBy', 'approvedAt',
            'expiresAt', 'nonce', 'signature',
        ];
        for (const field of requiredFields) {
            if (!(approval as any)[field]) {
                return NextResponse.json(
                    { error: `Missing required field in approval: ${field}` },
                    { status: 400 }
                );
            }
        }

        // ═══════════════════════════════════════════════════════════════
        // R1: Trust & Scope Validation
        // Phase 20: Only core.notes allowed
        // ═══════════════════════════════════════════════════════════════
        if (!trustEngine.isAppExecuteAllowed(approval.scope)) {
            console.warn(`[Execute] 🛑 App '${approval.scope}' not in Phase 20 execute allow-list`);
            return NextResponse.json(
                { error: `App '${approval.scope}' is not allowed to execute in Phase 20. Only core.notes is permitted.` },
                { status: 403 }
            );
        }

        // Shield check for execute access
        const executeCheck = safetyGate.checkExecuteAccess(
            `apply_note_${approval.actionType.toLowerCase()}`,
            approval.scope,
            approval.actionType,
        );
        if (!executeCheck.safe) {
            return NextResponse.json(
                { error: executeCheck.reason },
                { status: 403 }
            );
        }

        // ═══════════════════════════════════════════════════════════════
        // R2-R4: Execute via Engine
        // Approval validation (sig + nonce) → Snapshot → Execute → Audit
        // ═══════════════════════════════════════════════════════════════
        const result = await executionEngine.executeWithApproval(
            approval,
            // readResource: read current state of the target resource
            async (target: ResourceTarget) => {
                // Phase 20: Only notes — read from in-memory or stub
                // In production, this reads from the actual note storage
                return JSON.stringify({
                    resourceId: target.resourceId,
                    resourceType: target.resourceType,
                    content: `[Current content of ${target.displayName || target.resourceId}]`,
                    readAt: Date.now(),
                });
            },
            // applyChange: apply the diff to the target resource
            async (target: ResourceTarget, diff: { before: string; after: string }) => {
                // Phase 20: Only notes — apply change
                // In production, this writes to the actual note storage
                console.log(`[Execute] 📝 Applying change to ${target.resourceId}: ${diff.after.substring(0, 100)}...`);
            },
        );

        // Report outcome to trust engine
        trustEngine.reportOutcome(result.status === 'COMPLETED', 'execution');

        // Return result with metadata
        return NextResponse.json({
            ...result,
            _meta: {
                phase: 20,
                scope: approval.scope,
                actionType: approval.actionType,
                correlationId,
                tier: 'AGENT',
            },
        });

    } catch (error: any) {
        console.error(`[Execute] Error: ${error.message}`);

        // Phase 20 safety blocks
        if (error.message?.includes('P20:') || error.message?.includes('Phase 20')) {
            return NextResponse.json(
                { error: error.message },
                { status: 403 }
            );
        }

        // Nonce reuse
        if (error.message?.includes('NONCE')) {
            return NextResponse.json(
                { error: error.message },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { error: 'Internal server error during execution' },
            { status: 500 }
        );
    }
}
