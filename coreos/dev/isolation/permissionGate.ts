/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Permission Gate Layer (Phase 26)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Checks declared permissions in package manifest.
 * Blocks SYSTEM trust, undeclared access, escalation.
 */

import { FORBIDDEN_TRUST, PROTECTED_IDS } from '@/coreos/dev/packages/types';

export type GateVerdict = 'ALLOW' | 'DENY';

interface GateResult {
    verdict: GateVerdict;
    reason?: string;
}

/**
 * Check if a capability has a specific permission declared.
 */
export function checkPermission(
    declaredPermissions: string[],
    requiredPermission: string,
    trustLevel: string,
    capabilityId: string,
): GateResult {
    // Block forbidden trust levels
    if (FORBIDDEN_TRUST.includes(trustLevel)) {
        return { verdict: 'DENY', reason: `Forbidden trustLevel: ${trustLevel}` };
    }

    // Block access to protected core capabilities
    if (PROTECTED_IDS.includes(requiredPermission)) {
        if (!declaredPermissions.includes(requiredPermission)) {
            return { verdict: 'DENY', reason: `Undeclared access to protected capability: ${requiredPermission}` };
        }
    }

    // Check if permission is declared
    if (!declaredPermissions.includes(requiredPermission)) {
        return { verdict: 'DENY', reason: `Permission not declared: ${requiredPermission} by ${capabilityId}` };
    }

    return { verdict: 'ALLOW' };
}

/**
 * Check for privilege escalation attempt.
 * A capability cannot request permissions beyond its trust level.
 */
export function checkEscalation(
    trustLevel: string,
    requestedPermissions: string[],
): GateResult {
    // SYSTEM-level permissions are never grantable to dev packages
    const systemPerms = requestedPermissions.filter(p =>
        p.startsWith('system.') || p.startsWith('kernel.')
    );

    if (systemPerms.length > 0 && trustLevel !== 'SYSTEM') {
        return {
            verdict: 'DENY',
            reason: `Escalation: ${trustLevel} cannot access system permissions: ${systemPerms.join(', ')}`,
        };
    }

    return { verdict: 'ALLOW' };
}
