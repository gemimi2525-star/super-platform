/**
 * API Route — Dev Tenant Bootstrap (Phase 29.2, Dev-only)
 * POST /api/dev/tenants/bootstrap
 *
 * Creates a tenant + owner membership in Firestore.
 * 404 in production.
 */
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    try {
        const body = (await request.json()) as {
            tenantName?: string;
            ownerUserId?: string;
        };

        if (!body.tenantName || !body.ownerUserId) {
            return NextResponse.json({
                status: 'ERROR',
                error: 'Missing tenantName or ownerUserId',
            }, { status: 400 });
        }

        // Generate deterministic tenant ID from name
        const tenantId = body.tenantName
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .slice(0, 32);

        const { isMultiTenantEnabled } = await import('@/coreos/tenant/featureFlag');

        if (!isMultiTenantEnabled()) {
            // Scaffolding response when flag OFF
            return NextResponse.json({
                status: 'OK',
                module: 'dev-tenant-bootstrap',
                phase: 29.2,
                multiTenantEnabled: false,
                tenant: {
                    tenantId,
                    name: body.tenantName,
                    ownerUserId: body.ownerUserId,
                    role: 'owner',
                    createdAt: new Date().toISOString(),
                    note: 'Scaffolding only — enable MULTI_TENANT_ENABLED=true for real Firestore write',
                },
            });
        }

        // Real Firestore write when flag ON
        const { createTenant } = await import('@/coreos/tenant/firestore');
        const doc = await createTenant(tenantId, body.tenantName, body.ownerUserId);

        return NextResponse.json({
            status: 'OK',
            module: 'dev-tenant-bootstrap',
            phase: 29.2,
            multiTenantEnabled: true,
            tenant: {
                tenantId,
                name: doc.name,
                ownerUserId: doc.ownerUserId,
                role: 'owner',
                createdAt: doc.createdAt,
            },
        });
    } catch (err) {
        return NextResponse.json({
            status: 'ERROR',
            error: err instanceof Error ? err.message : 'Invalid request',
        }, { status: 400 });
    }
}
