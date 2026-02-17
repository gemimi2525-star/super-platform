/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Enforcement Gate — Phase 33A
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Server-side gate called from /os/layout.tsx before rendering.
 * Checks platform integrity and decides whether to allow or reject access.
 *
 * Modes:
 *   disabled — always allow (production default in Phase 33A)
 *   soft     — allow but log warning when integrity fails
 *   hard     — reject /os access when integrity fails (non-prod only)
 *
 * IMPORTANT: /ops (Ops Center) is NEVER gated — always accessible.
 *
 * @module lib/ops/integrity/enforcementGate
 */

import { getIntegrity, IntegrityResult } from './getIntegrity';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type EnforcementMode = 'disabled' | 'soft' | 'hard';

export interface EnforcementResult {
    /** Whether the request should be allowed to proceed */
    allowed: boolean;
    /** Active enforcement mode */
    mode: EnforcementMode;
    /** Reason for rejection (if blocked) */
    reason?: string;
    /** Current integrity status */
    integrityStatus: 'OK' | 'DEGRADED';
    /** Error codes from integrity check */
    errorCodes: string[];
    /** Timestamp of check */
    ts: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// MODE RESOLUTION
// ═══════════════════════════════════════════════════════════════════════════

function resolveMode(): EnforcementMode {
    const envMode = process.env.ENFORCEMENT_MODE?.toLowerCase();

    // Explicit mode from ENV
    if (envMode === 'hard' || envMode === 'soft' || envMode === 'disabled') {
        // SAFETY: hard mode not allowed in production (Phase 33A rule)
        const isProduction =
            process.env.NODE_ENV === 'production' ||
            process.env.VERCEL_ENV === 'production';

        if (envMode === 'hard' && isProduction) {
            console.warn(
                '[ENFORCEMENT_GATE][SAFETY] ENFORCEMENT_MODE=hard is BLOCKED in production. Falling back to disabled.'
            );
            return 'disabled';
        }

        return envMode;
    }

    // Default: disabled in production, soft elsewhere
    const isProduction =
        process.env.NODE_ENV === 'production' ||
        process.env.VERCEL_ENV === 'production';

    return isProduction ? 'disabled' : 'soft';
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check integrity and enforce access policy for /os.
 * Called from /os/layout.tsx (server component).
 *
 * - disabled: always allow
 * - soft: allow + log warning
 * - hard: reject if integrity != OK
 */
export async function checkEnforcementGate(): Promise<EnforcementResult> {
    const mode = resolveMode();
    const ts = new Date().toISOString();

    // disabled mode — skip integrity check entirely for performance
    if (mode === 'disabled') {
        return {
            allowed: true,
            mode: 'disabled',
            integrityStatus: 'OK',
            errorCodes: [],
            ts,
        };
    }

    // Run integrity check
    let integrity: IntegrityResult;
    try {
        integrity = await getIntegrity();
    } catch (err) {
        console.error('[ENFORCEMENT_GATE] Integrity check failed:', err);
        // On check failure: soft allows, hard rejects
        return {
            allowed: mode === 'soft',
            mode,
            reason: mode === 'hard' ? 'Integrity check threw an exception' : undefined,
            integrityStatus: 'DEGRADED',
            errorCodes: ['INTEGRITY_CHECK_EXCEPTION'],
            ts,
        };
    }

    const isOk = integrity.status === 'OK';

    if (isOk) {
        return {
            allowed: true,
            mode,
            integrityStatus: 'OK',
            errorCodes: [],
            ts,
        };
    }

    // Integrity is DEGRADED
    if (mode === 'soft') {
        console.warn('[ENFORCEMENT_GATE][SOFT] Integrity DEGRADED but allowing access:', {
            errorCodes: integrity.errorCodes,
            ts,
        });
        return {
            allowed: true,
            mode: 'soft',
            integrityStatus: 'DEGRADED',
            errorCodes: integrity.errorCodes,
            ts,
        };
    }

    // mode === 'hard' — REJECT
    console.error('[ENFORCEMENT_GATE][HARD] Integrity DEGRADED — BLOCKING /os access:', {
        errorCodes: integrity.errorCodes,
        ts,
    });
    return {
        allowed: false,
        mode: 'hard',
        reason: `Integrity check failed: ${integrity.errorCodes.join(', ')}`,
        integrityStatus: 'DEGRADED',
        errorCodes: integrity.errorCodes,
        ts,
    };
}
