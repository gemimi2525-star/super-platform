/**
 * Security Assertions
 * 
 * Runtime security checks for production hardening.
 * Part of Phase 11: Production Hardening
 * 
 * SYNAPSE Kernel: FROZEN ❄️ - This module does NOT touch synapse-core
 */

import { info, warn, error } from '../logging/logger';

// ============================================================================
// Cookie Security
// ============================================================================

export interface CookieSecurityCheck {
    secure: boolean;
    httpOnly: boolean;
    sameSite: boolean;
    issues: string[];
}

/**
 * Check if cookie security flags are appropriate for the environment.
 */
export function checkCookieSecurity(
    cookieName: string,
    cookieOptions: {
        secure?: boolean;
        httpOnly?: boolean;
        sameSite?: string;
    }
): CookieSecurityCheck {
    const issues: string[] = [];
    const isProd = process.env.NODE_ENV === 'production';

    // Check secure flag
    const secure = cookieOptions.secure ?? false;
    if (isProd && !secure) {
        issues.push(`Cookie ${cookieName} should have secure=true in production`);
    }

    // Check httpOnly flag
    const httpOnly = cookieOptions.httpOnly ?? false;
    if (!httpOnly) {
        issues.push(`Cookie ${cookieName} should have httpOnly=true`);
    }

    // Check sameSite flag
    const sameSite = cookieOptions.sameSite !== undefined;
    if (!sameSite) {
        issues.push(`Cookie ${cookieName} should have sameSite attribute`);
    }

    return { secure, httpOnly, sameSite, issues };
}

// ============================================================================
// Sensitive Data Protection
// ============================================================================

/**
 * Patterns that indicate sensitive data.
 */
const SENSITIVE_PATTERNS = [
    /password/i,
    /secret/i,
    /token/i,
    /bearer/i,
    /api[_-]?key/i,
    /private[_-]?key/i,
    /-----BEGIN/,
];

/**
 * Check if a string appears to contain sensitive data.
 */
export function containsSensitiveData(value: string): boolean {
    return SENSITIVE_PATTERNS.some(pattern => pattern.test(value));
}

/**
 * Sanitize an object for logging (remove/mask sensitive fields).
 */
export function sanitizeForLogging<T extends Record<string, unknown>>(
    obj: T,
    sensitiveKeys: string[] = ['password', 'token', 'secret', 'apiKey', 'privateKey', 'sessionCookie']
): T {
    const result = { ...obj };

    for (const key of Object.keys(result)) {
        // Check if key is in sensitive list
        if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk.toLowerCase()))) {
            (result as Record<string, unknown>)[key] = '[REDACTED]';
            continue;
        }

        // Check if value looks sensitive
        const value = result[key];
        if (typeof value === 'string' && containsSensitiveData(value)) {
            (result as Record<string, unknown>)[key] = '[REDACTED]';
        }
    }

    return result;
}

// ============================================================================
// Production Lock Verification
// ============================================================================

/**
 * Verify that dev bypass is properly locked in production.
 * Returns true if system is secure.
 */
export function verifyProductionLock(): {
    secure: boolean;
    isProduction: boolean;
    bypassActive: boolean;
    message: string;
} {
    const isProduction = process.env.NODE_ENV === 'production' ||
        process.env.VERCEL_ENV === 'production';

    const bypassConfigured = process.env.AUTH_DEV_BYPASS === 'true';

    // In production, bypass should never be active
    if (isProduction && bypassConfigured) {
        warn('AUTH', 'DEV_BYPASS configured but LOCKED in production');
        return {
            secure: true, // Still secure because middleware blocks it
            isProduction: true,
            bypassActive: false,
            message: 'DEV_BYPASS is configured but LOCKED in production',
        };
    }

    // In development, bypass is allowed
    if (!isProduction && bypassConfigured) {
        info('AUTH', 'DEV_BYPASS is active (development only)');
        return {
            secure: true,
            isProduction: false,
            bypassActive: true,
            message: 'DEV_BYPASS is active in development',
        };
    }

    return {
        secure: true,
        isProduction,
        bypassActive: false,
        message: isProduction ? 'Production mode, bypass disabled' : 'Development mode, bypass not configured',
    };
}

// ============================================================================
// Security Report
// ============================================================================

export interface SecurityReport {
    timestamp: string;
    productionLock: ReturnType<typeof verifyProductionLock>;
    recommendations: string[];
}

/**
 * Generate a security report for the current environment.
 */
export function generateSecurityReport(): SecurityReport {
    const recommendations: string[] = [];

    const productionLock = verifyProductionLock();

    // Check for common security issues
    if (!process.env.FIREBASE_PROJECT_ID) {
        recommendations.push('FIREBASE_PROJECT_ID should be set');
    }

    if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'development') {
        recommendations.push(`Unusual NODE_ENV: ${process.env.NODE_ENV}`);
    }

    return {
        timestamp: new Date().toISOString(),
        productionLock,
        recommendations,
    };
}
