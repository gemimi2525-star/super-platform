/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Firestore Collection Helpers (Phase 29)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Typed Firestore path constructors for tenant-scoped collections.
 * Every path requires tenantId — compile-time enforcement.
 */

import type { TenantId, UserId, SessionId } from './types';
import { assertNoPathTraversal } from './namespace';

// ─── Collection Paths ───────────────────────────────────────────────────

/** Root tenant document path */
export function tenantDocPath(tenantId: TenantId): string {
    assertNoPathTraversal(tenantId);
    return `tenants/${tenantId}`;
}

/** Tenant members collection */
export function membersColPath(tenantId: TenantId): string {
    return `${tenantDocPath(tenantId)}/members`;
}

/** Specific member document */
export function memberDocPath(tenantId: TenantId, userId: UserId): string {
    assertNoPathTraversal(userId);
    return `${membersColPath(tenantId)}/${userId}`;
}

/** Sessions collection */
export function sessionsColPath(tenantId: TenantId): string {
    return `${tenantDocPath(tenantId)}/sessions`;
}

/** Specific session document */
export function sessionDocPath(tenantId: TenantId, sessionId: SessionId): string {
    assertNoPathTraversal(sessionId);
    return `${sessionsColPath(tenantId)}/${sessionId}`;
}

/** Tenant capabilities collection */
export function capabilitiesColPath(tenantId: TenantId): string {
    return `${tenantDocPath(tenantId)}/capabilities`;
}

/** Tenant audit collection */
export function auditColPath(tenantId: TenantId): string {
    return `${tenantDocPath(tenantId)}/audit`;
}

/** Tenant integrity ledger collection */
export function integrityLedgerPath(tenantId: TenantId): string {
    return `${tenantDocPath(tenantId)}/integrity/ledger`;
}

/** Tenant integrity state document */
export function integrityStatePath(tenantId: TenantId): string {
    return `${tenantDocPath(tenantId)}/integrity/state`;
}

// ─── Validation ─────────────────────────────────────────────────────────

/**
 * Validate that a Firestore path is within the expected tenant scope.
 */
export function assertTenantScope(path: string, expectedTenantId: TenantId): void {
    if (!path.startsWith(`tenants/${expectedTenantId}`)) {
        throw new Error(
            `[Phase 29] Firestore path "${path}" is outside tenant scope "${expectedTenantId}"`
        );
    }
}
