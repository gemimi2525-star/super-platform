/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TOOL FIREWALL (Phase 35C — Runtime Isolation Level 2)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Normalizes tool calls, computes argument hashes, and enforces
 * allowlist/denylist/payload checks BEFORE the policy engine.
 *
 * @module coreos/brain/policy/toolFirewall
 */

import type { FirewallResult, FirewallCheck } from './policyTypes';

import {
    isToolAllowedForScope,
    isDestructiveTool,
    MAX_ARGS_PAYLOAD_BYTES,
} from './policyMatrix';

import { hashArguments } from '../providers/types';
import { policyAuditLogger } from './policyAudit';

// ═══════════════════════════════════════════════════════════════════════════
// TOOL FIREWALL
// ═══════════════════════════════════════════════════════════════════════════

export class ToolFirewall {

    /**
     * Check a tool call against firewall rules.
     * Must be called BEFORE policy engine evaluation.
     *
     * @param toolName - Raw tool name from LLM output
     * @param args - Raw tool arguments
     * @param appScope - App scope context
     * @param approvalArgsHash - Pre-approved args hash (if exists)
     * @returns FirewallResult with allowed status and computed hash
     */
    check(
        toolName: string,
        args: Record<string, any>,
        appScope: string,
        approvalArgsHash?: string,
    ): FirewallResult {
        const checks: FirewallCheck[] = [];

        // ─────────────────────────────────────────────────────────────────
        // 1. NORMALIZE tool name
        // ─────────────────────────────────────────────────────────────────
        const normalizedToolName = toolName.toLowerCase().trim();
        checks.push({
            checkName: 'NORMALIZE',
            passed: true,
            detail: `Normalized: '${toolName}' → '${normalizedToolName}'`,
        });

        // ─────────────────────────────────────────────────────────────────
        // 2. COMPUTE args hash (SHA-256 via existing utility)
        // ─────────────────────────────────────────────────────────────────
        const computedArgsHash = hashArguments(args);
        checks.push({
            checkName: 'ARGS_HASH',
            passed: true,
            detail: `Hash: ${computedArgsHash}`,
        });

        // ─────────────────────────────────────────────────────────────────
        // 3. PAYLOAD SIZE check
        // ─────────────────────────────────────────────────────────────────
        const payloadSize = new TextEncoder().encode(JSON.stringify(args)).byteLength;
        const payloadOk = payloadSize <= MAX_ARGS_PAYLOAD_BYTES;
        checks.push({
            checkName: 'PAYLOAD_SIZE',
            passed: payloadOk,
            detail: `${payloadSize} bytes (max: ${MAX_ARGS_PAYLOAD_BYTES})`,
        });

        if (!payloadOk) {
            policyAuditLogger.record({
                eventType: 'FIREWALL_BLOCKED',
                timestamp: Date.now(),
                correlationId: '',
                toolName: normalizedToolName,
                appScope,
                actorRole: 'unknown',
                metadata: { reason: 'PAYLOAD_SIZE_EXCEEDED', size: payloadSize },
            });

            return {
                allowed: false,
                normalizedToolName,
                computedArgsHash,
                blockReason: `Payload size ${payloadSize} exceeds max ${MAX_ARGS_PAYLOAD_BYTES} bytes`,
                checks,
            };
        }

        // ─────────────────────────────────────────────────────────────────
        // 4. SCOPE ALLOWLIST check
        // ─────────────────────────────────────────────────────────────────
        const scopeOk = isToolAllowedForScope(normalizedToolName, appScope);
        checks.push({
            checkName: 'SCOPE_ALLOWLIST',
            passed: scopeOk,
            detail: scopeOk
                ? `Tool allowed for scope '${appScope}'`
                : `Tool NOT in allowlist for scope '${appScope}'`,
        });

        if (!scopeOk) {
            policyAuditLogger.record({
                eventType: 'FIREWALL_BLOCKED',
                timestamp: Date.now(),
                correlationId: '',
                toolName: normalizedToolName,
                appScope,
                actorRole: 'unknown',
                metadata: { reason: 'SCOPE_NOT_ALLOWED' },
            });

            return {
                allowed: false,
                normalizedToolName,
                computedArgsHash,
                blockReason: `Tool '${normalizedToolName}' not allowed for scope '${appScope}'`,
                checks,
            };
        }

        // ─────────────────────────────────────────────────────────────────
        // 5. DESTRUCTIVE DENYLIST check (info-only at firewall level)
        // ─────────────────────────────────────────────────────────────────
        const isDestructive = isDestructiveTool(normalizedToolName);
        checks.push({
            checkName: 'DESTRUCTIVE_CHECK',
            passed: true, // Firewall doesn't block — policy engine handles denial
            detail: isDestructive
                ? `⚠️ Tool is destructive — policy engine will require owner approval`
                : `Tool is not destructive`,
        });

        // ─────────────────────────────────────────────────────────────────
        // 6. ARGS HASH INVARIANT (if approval exists)
        // ─────────────────────────────────────────────────────────────────
        if (approvalArgsHash) {
            const hashMatch = computedArgsHash === approvalArgsHash;
            checks.push({
                checkName: 'ARGS_HASH_INVARIANT',
                passed: hashMatch,
                detail: hashMatch
                    ? `Hash matches approval`
                    : `Hash mismatch: computed=${computedArgsHash} ≠ approval=${approvalArgsHash}`,
            });

            if (!hashMatch) {
                policyAuditLogger.record({
                    eventType: 'FIREWALL_BLOCKED',
                    timestamp: Date.now(),
                    correlationId: '',
                    toolName: normalizedToolName,
                    appScope,
                    actorRole: 'unknown',
                    argsHash: computedArgsHash,
                    metadata: { reason: 'ARGS_HASH_MISMATCH', approvalArgsHash },
                });

                return {
                    allowed: false,
                    normalizedToolName,
                    computedArgsHash,
                    blockReason: `ArgsHash mismatch: args were modified after approval`,
                    checks,
                };
            }
        }

        // ─────────────────────────────────────────────────────────────────
        // ALL FIREWALL CHECKS PASSED
        // ─────────────────────────────────────────────────────────────────
        return {
            allowed: true,
            normalizedToolName,
            computedArgsHash,
            checks,
        };
    }
}

/** Singleton instance */
export const toolFirewall = new ToolFirewall();
