/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Fail Injection — Phase 33A
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ENV-based fail injection for testing integrity enforcement gates.
 * All flags default OFF. In production, flags are ignored unless
 * ALLOW_FAIL_INJECTION=1 is explicitly set (dangerous — never use in prod).
 *
 * Flags:
 *   FAIL_INTEGRITY=1      → force overall status to DEGRADED
 *   FAIL_KERNEL_FROZEN=1  → force kernelFrozen = false
 *   FAIL_HASH_CHAIN=1     → force hashValid = false
 *
 * @module lib/ops/integrity/failInjection
 */

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface FailInjection {
    /** Force overall integrity status to DEGRADED */
    failIntegrity: boolean;
    /** Force governance.kernelFrozen to false */
    failKernelFrozen: boolean;
    /** Force governance.hashValid to false */
    failHashChain: boolean;
    /** Whether any injection is active */
    active: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// PRODUCTION SAFETY
// ═══════════════════════════════════════════════════════════════════════════

function isProductionEnvironment(): boolean {
    return (
        process.env.NODE_ENV === 'production' ||
        process.env.VERCEL_ENV === 'production'
    );
}

function isInjectionAllowed(): boolean {
    // Non-production: always allowed
    if (!isProductionEnvironment()) return true;

    // Production: only if explicitly allowlisted (DANGEROUS)
    if (process.env.ALLOW_FAIL_INJECTION === '1') {
        console.warn(
            '[FAIL_INJECTION][DANGER] Fail injection ENABLED in production via ALLOW_FAIL_INJECTION=1'
        );
        return true;
    }

    return false;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Read fail injection flags from environment.
 * Returns all-false if in production without explicit opt-in.
 */
export function getFailInjection(): FailInjection {
    if (!isInjectionAllowed()) {
        return {
            failIntegrity: false,
            failKernelFrozen: false,
            failHashChain: false,
            active: false,
        };
    }

    const failIntegrity = process.env.FAIL_INTEGRITY === '1';
    const failKernelFrozen = process.env.FAIL_KERNEL_FROZEN === '1';
    const failHashChain = process.env.FAIL_HASH_CHAIN === '1';
    const active = failIntegrity || failKernelFrozen || failHashChain;

    if (active) {
        console.warn('[FAIL_INJECTION] Active flags:', {
            failIntegrity,
            failKernelFrozen,
            failHashChain,
            env: process.env.NODE_ENV,
        });
    }

    return { failIntegrity, failKernelFrozen, failHashChain, active };
}
