/**
 * API Route — My Tenants (Phase 29.2)
 * GET /api/tenants/my
 *
 * Returns list of tenant memberships for the authenticated user.
 * When multi-tenant disabled: returns single default tenant.
 * When enabled: queries Firestore for real memberships.
 */
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
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

    // Multi-tenant enabled: get real memberships from Firestore
    try {
        // Try to get authenticated user
        let userId = 'dev-user';
        try {
            const cookie = request.headers.get('cookie') || '';
            const sessionMatch = cookie.match(/__session=([^;]+)/);
            if (sessionMatch) {
                const { verifySessionCookie } = await import('@/lib/firebase-admin');
                const claims = await verifySessionCookie(sessionMatch[1]);
                userId = claims.uid;
            }
        } catch {
            // Dev mode: use fallback userId
        }

        const { getMemberships } = await import('@/coreos/tenant/firestore');
        const memberships = await getMemberships(userId);

        return NextResponse.json({
            status: 'OK',
            module: 'tenants-my',
            phase: 29.2,
            multiTenantEnabled: true,
            userId,
            memberships,
        });
    } catch (err) {
        return NextResponse.json({
            status: 'ERROR',
            module: 'tenants-my',
            error: err instanceof Error ? err.message : 'Failed to fetch memberships',
        }, { status: 500 });
    }
}
