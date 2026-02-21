/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Multi-tenant Core Types (Phase 29)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Canonical type definitions for multi-tenant session context.
 * These types are shared across client, server, and worker layers.
 */

/** Organizational / tenant identifier */
export type TenantId = string;

/** Firebase UID */
export type UserId = string;

/** Opaque session UUID v4 */
export type SessionId = string;

/** Role within a tenant */
export type TenantRole = 'owner' | 'admin' | 'user' | 'viewer';

/** Tenant membership status */
export type MemberStatus = 'active' | 'disabled' | 'invited';

/** Tenant status */
export type TenantStatus = 'active' | 'suspended' | 'archived';

/**
 * Session Context — carried through every operation.
 * Every state mutation, VFS op, capability action, process/job operation,
 * and audit write MUST include this context.
 */
export interface SessionContext {
    readonly tenantId: TenantId;
    readonly userId: UserId;
    readonly sessionId: SessionId;
    readonly role: TenantRole;
    readonly issuedAt: number;            // ms epoch
    readonly authMode: 'REAL' | 'DEV';
    readonly deviceId?: string;
}

/** Tenant document shape (Firestore) */
export interface TenantDoc {
    readonly name: string;
    readonly createdAt: string;            // ISO
    readonly plan: 'free' | 'pro' | 'enterprise';
    readonly ownerUserId: UserId;
    readonly status: TenantStatus;
}

/** Tenant membership document (Firestore) */
export interface TenantMemberDoc {
    readonly role: TenantRole;
    readonly status: MemberStatus;
    readonly invitedAt: string;            // ISO
    readonly joinedAt?: string;            // ISO
}

/** Session document (Firestore) */
export interface SessionDoc {
    readonly userId: UserId;
    readonly roleSnapshot: TenantRole;
    readonly createdAt: string;            // ISO
    readonly lastSeenAt: string;           // ISO
    readonly deviceId?: string;
    readonly revokedAt?: string;           // ISO, null = active
}

/** Tenant membership summary (API response) */
export interface TenantMembership {
    readonly tenantId: TenantId;
    readonly tenantName: string;
    readonly role: TenantRole;
    readonly status: MemberStatus;
}

// ─── Constants ──────────────────────────────────────────────────────────

/** Default tenant ID for legacy/single-tenant mode */
export const DEFAULT_TENANT_ID = 'default' as TenantId;

/** Session expiry: 24 hours of inactivity */
export const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000;

/** Max sessions per user per tenant */
export const MAX_SESSIONS_PER_USER = 5;

/** Role hierarchy (higher index = more privilege) */
export const ROLE_HIERARCHY: readonly TenantRole[] = ['viewer', 'user', 'admin', 'owner'] as const;

/**
 * Check if roleA has at least roleB level privilege.
 */
export function hasMinRole(roleA: TenantRole, minRole: TenantRole): boolean {
    return ROLE_HIERARCHY.indexOf(roleA) >= ROLE_HIERARCHY.indexOf(minRole);
}
