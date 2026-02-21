/**
 * ═══════════════════════════════════════════════════════════════════════════
 * API Guard Middleware (Phase 29)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Server-side session context validation for tenant-aware APIs.
 * When multi-tenant is disabled, returns a legacy single-tenant context.
 */

import type { SessionContext, TenantRole } from './types';
import { DEFAULT_TENANT_ID, SESSION_EXPIRY_MS } from './types';
import { isMultiTenantEnabled } from './featureFlag';
import { extractSessionHeaders } from './context';

// ─── Context Resolution ─────────────────────────────────────────────────

/**
 * Resolve SessionContext from an API request.
 *
 * When multi-tenant is DISABLED:
 *   → Returns legacy context with DEFAULT_TENANT_ID
 *
 * When multi-tenant is ENABLED:
 *   → Validates headers, membership, and session
 *   → Returns full SessionContext or throws
 */
export async function resolveSessionContext(
    req: Request,
    firebaseUid: string | null,
): Promise<SessionContext> {
    // ─── Legacy mode ────────────────────────────────────────────────
    if (!isMultiTenantEnabled()) {
        return {
            tenantId: DEFAULT_TENANT_ID,
            userId: firebaseUid || 'anonymous',
            sessionId: 'legacy-single',
            role: 'owner' as TenantRole,
            issuedAt: Date.now(),
            authMode: firebaseUid ? 'REAL' : 'DEV',
        };
    }

    // ─── Multi-tenant mode ──────────────────────────────────────────
    const headers = extractSessionHeaders(req);

    if (!headers.tenantId || !headers.sessionId) {
        throw new TenantGuardError('Missing x-tenant-id or x-session-id header', 401);
    }

    if (!firebaseUid) {
        throw new TenantGuardError('Authentication required', 401);
    }

    // TODO Phase 29.1: Validate membership + session in Firestore
    // For now, return a context based on headers (scaffolding)
    return {
        tenantId: headers.tenantId,
        userId: firebaseUid,
        sessionId: headers.sessionId,
        role: 'user' as TenantRole,
        issuedAt: Date.now(),
        authMode: 'REAL',
    };
}

// ─── Assertions ─────────────────────────────────────────────────────────

/**
 * Assert that a SessionContext is present (non-null).
 * Use at service boundaries.
 */
export function assertContext(
    ctx: SessionContext | null,
): asserts ctx is SessionContext {
    if (!ctx) {
        throw new TenantGuardError('SessionContext required but not provided', 500);
    }
}

/**
 * Assert that the context has at least the specified role.
 */
export function assertMinRole(ctx: SessionContext, minRole: TenantRole): void {
    const hierarchy: TenantRole[] = ['viewer', 'user', 'admin', 'owner'];
    if (hierarchy.indexOf(ctx.role) < hierarchy.indexOf(minRole)) {
        throw new TenantGuardError(
            `Insufficient role: requires ${minRole}, has ${ctx.role}`,
            403,
        );
    }
}

/**
 * Check if a session has expired based on issuedAt.
 */
export function isSessionExpired(issuedAt: number): boolean {
    return Date.now() - issuedAt > SESSION_EXPIRY_MS;
}

// ─── Error ──────────────────────────────────────────────────────────────

export class TenantGuardError extends Error {
    constructor(
        message: string,
        public readonly statusCode: number,
    ) {
        super(`[Phase 29 Guard] ${message}`);
        this.name = 'TenantGuardError';
    }
}
