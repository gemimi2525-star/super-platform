/**
 * Runtime Invariants
 * 
 * Production hardening invariant checks.
 * These assertions ensure the system operates within expected bounds.
 * 
 * Part of Phase 11: Production Hardening
 * SYNAPSE Kernel: FROZEN ❄️ - This module does NOT touch synapse-core
 */

import { invariant } from './assert';

// ============================================================================
// Environment Invariants
// ============================================================================

/**
 * Required environment variables for production
 */
const REQUIRED_ENV_VARS = [
    'FIREBASE_PROJECT_ID',
] as const;

/**
 * Assert all required environment variables are present.
 * Logs warning in dev, throws in production if critical vars missing.
 */
export function assertEnvVars(): void {
    const missing: string[] = [];

    for (const varName of REQUIRED_ENV_VARS) {
        if (!process.env[varName]) {
            missing.push(varName);
        }
    }

    if (missing.length > 0) {
        const message = `Missing required env vars: ${missing.join(', ')}`;
        if (process.env.NODE_ENV === 'production') {
            console.error(`[INVARIANT][ENV] ❌ ${message}`);
            throw new Error(message);
        } else {
            console.warn(`[INVARIANT][ENV] ⚠️ ${message}`);
        }
    }
}

// ============================================================================
// Auth Invariants
// ============================================================================

/**
 * Assert that DEV_BYPASS is locked in production.
 * This is a critical security invariant.
 * 
 * @param context - Where the assertion is called from (for logging)
 */
export function assertProductionLock(context: string = 'unknown'): void {
    const isProduction = process.env.NODE_ENV === 'production' ||
        process.env.VERCEL_ENV === 'production';

    const bypassConfigured = process.env.AUTH_DEV_BYPASS === 'true';

    if (isProduction && bypassConfigured) {
        console.warn(`[INVARIANT][SECURITY] 🔒 AUTH_DEV_BYPASS is configured but LOCKED in production @ ${context}`);
    }

    // Return the effective bypass state
    const bypassEffective = !isProduction && bypassConfigured;

    if (process.env.NODE_ENV === 'development') {
        console.log(`[INVARIANT][AUTH] Production lock check @ ${context}:`, {
            isProduction,
            bypassConfigured,
            bypassEffective,
        });
    }
}

/**
 * Check if dev bypass is currently active (safe version that never throws).
 */
export function isDevBypassActive(): boolean {
    const isProduction = process.env.NODE_ENV === 'production' ||
        process.env.VERCEL_ENV === 'production';

    return !isProduction && process.env.AUTH_DEV_BYPASS === 'true';
}

// ============================================================================
// Response Invariants
// ============================================================================

/**
 * Standard API response shape
 */
export interface ApiResponseShape {
    success: boolean;
    data?: unknown;
    error?: {
        code: string;
        message: string;
        errorId?: string;
        traceId?: string;
        timestamp?: string;
        retryable?: boolean;
        hint?: string;
    };
}

/**
 * Assert that an API response has the correct shape.
 * Does not throw, returns validation result.
 */
export function validateResponseShape(response: unknown): {
    valid: boolean;
    issues: string[];
} {
    const issues: string[] = [];

    if (typeof response !== 'object' || response === null) {
        return { valid: false, issues: ['Response is not an object'] };
    }

    const resp = response as Record<string, unknown>;

    // Must have success field
    if (typeof resp.success !== 'boolean') {
        issues.push('Missing or invalid "success" field');
    }

    // If success=true, must have data
    if (resp.success === true && !('data' in resp)) {
        issues.push('Success response missing "data" field');
    }

    // If success=false, must have error with required fields
    if (resp.success === false) {
        if (!resp.error || typeof resp.error !== 'object') {
            issues.push('Error response missing "error" object');
        } else {
            const err = resp.error as Record<string, unknown>;
            if (typeof err.code !== 'string') {
                issues.push('Error missing "code" field');
            }
            if (typeof err.message !== 'string') {
                issues.push('Error missing "message" field');
            }
        }
    }

    return { valid: issues.length === 0, issues };
}

/**
 * Assert API response shape is valid.
 */
export function assertResponseShape(response: unknown, context: string): void {
    const { valid, issues } = validateResponseShape(response);
    invariant(valid, `Invalid response shape @ ${context}: ${issues.join(', ')}`, 'BUG_INVALID_RESPONSE');
}

// ============================================================================
// Governance Invariants (Wrapper Only - Does NOT touch SYNAPSE)
// ============================================================================

/**
 * Validate that a decision object has expected shape.
 * This is a wrapper that does NOT modify synapse-core.
 * Used for logging/observability only.
 */
export interface DecisionShape {
    allowed: boolean;
    reason?: string;
    policyId?: string;
}

export function validateDecisionShape(decision: unknown): {
    valid: boolean;
    issues: string[];
} {
    const issues: string[] = [];

    if (typeof decision !== 'object' || decision === null) {
        return { valid: false, issues: ['Decision is not an object'] };
    }

    const dec = decision as Record<string, unknown>;

    if (typeof dec.allowed !== 'boolean') {
        issues.push('Decision missing "allowed" boolean');
    }

    return { valid: issues.length === 0, issues };
}
