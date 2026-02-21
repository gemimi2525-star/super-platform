/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Namespace Utilities (Phase 29)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Deterministic key generation for per-tenant/per-user scoping.
 * Used by Zustand stores, localStorage, VFS paths, and rate limiters.
 */

import type { TenantId, UserId } from './types';

// ─── Namespace Key ──────────────────────────────────────────────────────

/**
 * Create a namespace key: `tenantId:userId`
 */
export function createNamespace(tenantId: TenantId, userId: UserId): string {
    return `${tenantId}:${userId}`;
}

// ─── Scoped Keys ────────────────────────────────────────────────────────

/**
 * Prefix a storage key with namespace.
 * Example: scopedKey("acme:uid123", "theme") → "acme:uid123:theme"
 */
export function scopedKey(ns: string, key: string): string {
    return `${ns}:${key}`;
}

/**
 * Prefix a localStorage key for tenant isolation.
 */
export function scopedLocalStorageKey(ns: string, key: string): string {
    return `mt:${ns}:${key}`;
}

// ─── VFS Paths ──────────────────────────────────────────────────────────

/**
 * Get the VFS root path for a tenant/user.
 * Returns: `/tenants/{tenantId}/users/{userId}/home/`
 */
export function tenantVfsRoot(tenantId: TenantId, userId: UserId): string {
    assertNoPathTraversal(tenantId);
    assertNoPathTraversal(userId);
    return `/tenants/${tenantId}/users/${userId}/home/`;
}

/**
 * Get the tenant shared space path.
 * Returns: `/tenants/{tenantId}/shared/`
 */
export function tenantSharedRoot(tenantId: TenantId): string {
    assertNoPathTraversal(tenantId);
    return `/tenants/${tenantId}/shared/`;
}

// ─── Rate Limiter Key ───────────────────────────────────────────────────

/**
 * Create a rate limiter key scoped to tenant+user+capability+action.
 */
export function rateLimitKey(
    tenantId: TenantId,
    userId: UserId,
    capabilityId: string,
    action: string,
): string {
    return `rl:${tenantId}:${userId}:${capabilityId}:${action}`;
}

// ─── Security ───────────────────────────────────────────────────────────

/**
 * Assert no path traversal characters in a path segment.
 * Rejects: `..`, `/`, `\`, null bytes
 */
export function assertNoPathTraversal(segment: string): void {
    if (
        !segment ||
        segment.includes('..') ||
        segment.includes('/') ||
        segment.includes('\\') ||
        segment.includes('\0')
    ) {
        throw new Error(`[Phase 29] Path traversal rejected: "${segment}"`);
    }
}
