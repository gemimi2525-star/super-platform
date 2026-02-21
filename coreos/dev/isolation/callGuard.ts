/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Cross-Capability Call Guard (Phase 26)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Verifies that capability A can call capability B.
 * Based on declared permissions + trust compatibility.
 */

export type CallVerdict = 'ALLOW' | 'DENY';

interface CallGuardResult {
    verdict: CallVerdict;
    caller: string;
    target: string;
    reason?: string;
}

/** Trust level hierarchy (higher = more privileged) */
const TRUST_RANK: Record<string, number> = {
    'DEV_ONLY': 0,
    'COMMUNITY': 1,
    'VERIFIED': 2,
    'SYSTEM': 99, // never granted to dev packages
};

/**
 * Check if caller capability can invoke target capability.
 */
export function checkCrossCall(
    callerId: string,
    callerPermissions: string[],
    callerTrust: string,
    targetId: string,
    targetTrust: string,
): CallGuardResult {
    // Self-call always allowed
    if (callerId === targetId) {
        return { verdict: 'ALLOW', caller: callerId, target: targetId };
    }

    // Check if caller declares permission to access target
    const hasPermission = callerPermissions.some(p =>
        p === targetId || p === `${targetId}.read` || p === `${targetId}.write`
    );

    if (!hasPermission) {
        return {
            verdict: 'DENY',
            caller: callerId,
            target: targetId,
            reason: `No declared permission to call ${targetId}`,
        };
    }

    // Trust compatibility: caller cannot call higher-trust targets
    const callerRank = TRUST_RANK[callerTrust] ?? 0;
    const targetRank = TRUST_RANK[targetTrust] ?? 0;

    if (callerRank < targetRank && targetTrust === 'SYSTEM') {
        return {
            verdict: 'DENY',
            caller: callerId,
            target: targetId,
            reason: `Trust incompatible: ${callerTrust}(${callerRank}) cannot call ${targetTrust}(${targetRank})`,
        };
    }

    return { verdict: 'ALLOW', caller: callerId, target: targetId };
}
