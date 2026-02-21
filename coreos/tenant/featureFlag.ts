/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Multi-tenant Feature Flag (Phase 29)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Controls whether multi-tenant features are active.
 * Default: false (single-tenant legacy mode).
 * Set MULTI_TENANT_ENABLED=true to activate.
 */

/**
 * Check if multi-tenant mode is enabled.
 * Reads from environment variable. Default = false (safe for production).
 */
export function isMultiTenantEnabled(): boolean {
    return process.env.MULTI_TENANT_ENABLED === 'true';
}

/**
 * Guard: throws if multi-tenant is NOT enabled.
 * Use at the top of tenant-only code paths.
 */
export function requireMultiTenant(): void {
    if (!isMultiTenantEnabled()) {
        throw new Error('[Phase 29] Multi-tenant is not enabled. Set MULTI_TENANT_ENABLED=true');
    }
}
