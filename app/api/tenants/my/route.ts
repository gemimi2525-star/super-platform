/**
 * API Route — My Tenants (Phase 29)
 * GET /api/tenants/my
 *
 * Returns list of tenant memberships for the authenticated user.
 * When multi-tenant is disabled, returns single default tenant.
 */
import { NextResponse } from 'next/server';

export async function GET() {
    const { isMultiTenantEnabled } = await import('@/coreos/tenant/featureFlag');
    const { DEFAULT_TENANT_ID } = await import('@/coreos/tenant/types');

    // When multi-tenant is disabled, return default tenant
    if (!isMultiTenantEnabled()) {
        return NextResponse.json({
            status: 'OK',
            module: 'tenants-my',
            phase: 29,
            multiTenantEnabled: false,
            memberships: [{
                tenantId: DEFAULT_TENANT_ID,
                tenantName: 'Default',
                role: 'owner',
                status: 'active',
            }],
        });
    }

    // TODO Phase 29.1: Query Firestore for user's memberships
    // For now, return empty when enabled but not wired
    return NextResponse.json({
        status: 'OK',
        module: 'tenants-my',
        phase: 29,
        multiTenantEnabled: true,
        memberships: [],
    });
}
