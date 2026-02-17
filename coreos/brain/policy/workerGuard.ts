/**
 * ═══════════════════════════════════════════════════════════════════════════
 * WORKER EXECUTION GUARD (Phase 35C — Runtime Isolation Level 2)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Second-layer enforcement at the worker/execution level.
 * Defense-in-depth: even if gateway is bypassed, worker MUST verify
 * nonce, scope, argsHash, and policy decision independently.
 *
 * @module coreos/brain/policy/workerGuard
 */

import type { GuardInput, GuardResult } from './policyTypes';
import { NONCE_TTL_MS } from './policyMatrix';
import { policyAuditLogger } from './policyAudit';
import { governanceReactionEngine } from './governanceReactionEngine';

// ═══════════════════════════════════════════════════════════════════════════
// WORKER-LEVEL NONCE TRACKING (independent from gateway)
// ═══════════════════════════════════════════════════════════════════════════

/** Worker-level used nonces — separate from gateway to enforce defense-in-depth */
const workerUsedNonces: Map<string, number> = new Map();

function cleanWorkerNonces(): void {
    const cutoff = Date.now() - NONCE_TTL_MS;
    for (const [nonce, ts] of workerUsedNonces.entries()) {
        if (ts < cutoff) {
            workerUsedNonces.delete(nonce);
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// WORKER GUARD
// ═══════════════════════════════════════════════════════════════════════════

export class WorkerGuard {

    /**
     * Verify a tool execution at the worker level.
     * This is the LAST line of defense before actual execution.
     *
     * Checks:
     * 1. Policy decision must be ALLOW
     * 2. Nonce must not be reused (independent tracking)
     * 3. Scope token must be non-empty and valid
     * 4. ArgsHash must match approval (if approval exists)
     */
    verify(input: GuardInput): GuardResult {
        const checks: { name: string; passed: boolean; detail?: string }[] = [];

        // ─────────────────────────────────────────────────────────────────
        // Check 0: GOVERNANCE STATE (Phase 35D — defense-in-depth)
        // ─────────────────────────────────────────────────────────────────
        const govCheck = governanceReactionEngine.isExecutionAllowed();
        checks.push({
            name: 'GOVERNANCE_STATE',
            passed: govCheck.allowed,
            detail: govCheck.allowed
                ? `Governance mode permits execution`
                : `Governance block: ${govCheck.reason}`,
        });

        if (!govCheck.allowed) {
            policyAuditLogger.record({
                eventType: 'GUARD_BLOCKED',
                timestamp: Date.now(),
                correlationId: input.correlationId,
                toolName: input.toolName,
                appScope: input.scopeToken,
                actorRole: 'unknown',
                metadata: { reason: 'GOVERNANCE_FREEZE_AT_WORKER', detail: govCheck.reason },
            });

            return {
                permitted: false,
                blockReason: `Governance enforcement: ${govCheck.reason}`,
                checks,
            };
        }

        // ─────────────────────────────────────────────────────────────────
        // Check 1: POLICY DECISION
        // ─────────────────────────────────────────────────────────────────
        const policyOk = input.policyDecision === 'ALLOW';
        checks.push({
            name: 'POLICY_DECISION',
            passed: policyOk,
            detail: policyOk
                ? 'Policy decision is ALLOW'
                : `Policy decision is '${input.policyDecision}' — execution blocked`,
        });

        if (!policyOk) {
            policyAuditLogger.record({
                eventType: 'GUARD_BLOCKED',
                timestamp: Date.now(),
                correlationId: input.correlationId,
                toolName: input.toolName,
                appScope: input.scopeToken,
                actorRole: 'unknown',
                decision: input.policyDecision,
                metadata: { reason: 'POLICY_NOT_ALLOW' },
            });

            return {
                permitted: false,
                blockReason: `Policy decision '${input.policyDecision}' does not permit execution`,
                checks,
            };
        }

        // ─────────────────────────────────────────────────────────────────
        // Check 2: NONCE ANTI-REPLAY (worker-level, independent)
        // ─────────────────────────────────────────────────────────────────
        cleanWorkerNonces();
        const nonceOk = !workerUsedNonces.has(input.nonce);
        checks.push({
            name: 'NONCE_REPLAY',
            passed: nonceOk,
            detail: nonceOk
                ? 'Nonce is fresh at worker level'
                : `Nonce '${input.nonce.substring(0, 8)}...' already used at worker level`,
        });

        if (!nonceOk) {
            policyAuditLogger.record({
                eventType: 'GUARD_BLOCKED',
                timestamp: Date.now(),
                correlationId: input.correlationId,
                toolName: input.toolName,
                appScope: input.scopeToken,
                actorRole: 'unknown',
                nonce: input.nonce,
                metadata: { reason: 'NONCE_REPLAY_AT_WORKER' },
            });

            return {
                permitted: false,
                blockReason: `Nonce replay detected at worker level`,
                checks,
            };
        }

        // Register nonce at worker level
        workerUsedNonces.set(input.nonce, Date.now());

        // ─────────────────────────────────────────────────────────────────
        // Check 3: SCOPE TOKEN
        // ─────────────────────────────────────────────────────────────────
        const scopeOk = input.scopeToken && input.scopeToken.trim().length > 0;
        checks.push({
            name: 'SCOPE_TOKEN',
            passed: !!scopeOk,
            detail: scopeOk
                ? `Scope token: '${input.scopeToken}'`
                : 'Scope token is empty or missing',
        });

        if (!scopeOk) {
            policyAuditLogger.record({
                eventType: 'GUARD_BLOCKED',
                timestamp: Date.now(),
                correlationId: input.correlationId,
                toolName: input.toolName,
                appScope: '',
                actorRole: 'unknown',
                metadata: { reason: 'EMPTY_SCOPE_TOKEN' },
            });

            return {
                permitted: false,
                blockReason: 'Scope token is empty — cannot verify app context',
                checks,
            };
        }

        // ─────────────────────────────────────────────────────────────────
        // Check 4: ARGS HASH INVARIANT (if approval exists)
        // ─────────────────────────────────────────────────────────────────
        if (input.approvalArgsHash) {
            const hashMatch = input.argsHash === input.approvalArgsHash;
            checks.push({
                name: 'ARGS_HASH_INVARIANT',
                passed: hashMatch,
                detail: hashMatch
                    ? 'ArgsHash matches approval at worker level'
                    : `ArgsHash mismatch at worker: exec=${input.argsHash} ≠ approve=${input.approvalArgsHash}`,
            });

            if (!hashMatch) {
                policyAuditLogger.record({
                    eventType: 'GUARD_BLOCKED',
                    timestamp: Date.now(),
                    correlationId: input.correlationId,
                    toolName: input.toolName,
                    appScope: input.scopeToken,
                    actorRole: 'unknown',
                    argsHash: input.argsHash,
                    metadata: { reason: 'ARGS_HASH_MISMATCH_AT_WORKER', approvalArgsHash: input.approvalArgsHash },
                });

                return {
                    permitted: false,
                    blockReason: 'ArgsHash mismatch at worker level — args modified after approval',
                    checks,
                };
            }
        }

        // ─────────────────────────────────────────────────────────────────
        // ALL WORKER CHECKS PASSED
        // ─────────────────────────────────────────────────────────────────
        return {
            permitted: true,
            checks,
        };
    }
}

/** Singleton instance */
export const workerGuard = new WorkerGuard();
