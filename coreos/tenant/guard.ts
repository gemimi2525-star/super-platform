/**
 * ═══════════════════════════════════════════════════════════════════════════
 * API Guard Middleware (Phase 29.2 — Real Firestore Validation)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Server-side session context validation for tenant-aware APIs.
 * When multi-tenant is disabled: returns legacy single-tenant context.
 * When enabled: validates membership + session in Firestore.
 */

import type { SessionContext, TenantRole } from './types';
import { DEFAULT_TENANT_ID, SESSION_EXPIRY_MS } from './types';
import { isMultiTenantEnabled } from './featureFlag';
import { extractSessionHeaders } from './context';

// ─── Error Codes ────────────────────────────────────────────────────────

export const TENANT_ERRORS = {
    HEADERS_MISSING: 'TENANT_HEADERS_MISSING',
    MEMBER_REQUIRED: 'TENANT_MEMBER_REQUIRED',
    SESSION_INVALID: 'TENANT_SESSION_INVALID',
    SESSION_REVOKED: 'TENANT_SESSION_REVOKED',
    AUTH_REQUIRED: 'AUTH_REQUIRED',
    INSUFFICIENT_ROLE: 'INSUFFICIENT_ROLE',
} as const;

// ─── Context Resolution ─────────────────────────────────────────────────

/**
 * Resolve SessionContext from an API request.
 *
 * When multi-tenant is DISABLED:
 *   → Returns legacy context with DEFAULT_TENANT_ID
 *
 * When multi-tenant is ENABLED:
 *   → Validates headers, membership, session via Firestore
 *   → Returns full SessionContext or throws TenantGuardError
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
        throw new TenantGuardError(
            'Missing x-tenant-id or x-session-id header',
            401,
            TENANT_ERRORS.HEADERS_MISSING,
        );
    }

    if (!firebaseUid) {
        throw new TenantGuardError(
            'Authentication required',
            401,
            TENANT_ERRORS.AUTH_REQUIRED,
        );
    }

    // Validate membership in Firestore
    const { validateMembership, validateSession, touchSession } =
        await import('./firestore');

    const member = await validateMembership(headers.tenantId, firebaseUid);
    if (!member) {
        throw new TenantGuardError(
            `User ${firebaseUid} is not an active member of tenant ${headers.tenantId}`,
            403,
            TENANT_ERRORS.MEMBER_REQUIRED,
        );
    }

    // Validate session in Firestore
    const session = await validateSession(
        headers.tenantId,
        headers.sessionId,
        firebaseUid,
    );
    if (!session) {
        throw new TenantGuardError(
            `Session ${headers.sessionId} is invalid, revoked, or expired`,
            401,
            TENANT_ERRORS.SESSION_INVALID,
        );
    }

    // Touch lastSeenAt (fire-and-forget, non-blocking)
    touchSession(headers.tenantId, headers.sessionId).catch(() => {
        /* silently ignore touch failures */
    });

    return {
        tenantId: headers.tenantId,
        userId: firebaseUid,
        sessionId: headers.sessionId,
        role: member.role,
        issuedAt: new Date(session.createdAt).getTime(),
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
            TENANT_ERRORS.INSUFFICIENT_ROLE,
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
        public readonly errorCode?: string,
    ) {
        super(`[Phase 29 Guard] ${message}`);
        this.name = 'TenantGuardError';
    }
}
