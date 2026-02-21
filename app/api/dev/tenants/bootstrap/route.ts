/**
 * API Route — Dev Tenant Bootstrap (Phase 29, Dev-only)
 * POST /api/dev/tenants/bootstrap
 *
 * Creates a tenant + owner membership for development.
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

        // TODO Phase 29.1: Write to Firestore
        // For now, return scaffolding response
        return NextResponse.json({
            status: 'OK',
            module: 'dev-tenant-bootstrap',
            phase: 29,
            tenant: {
                tenantId,
                name: body.tenantName,
                ownerUserId: body.ownerUserId,
                role: 'owner',
                createdAt: new Date().toISOString(),
            },
        });
    } catch (err) {
        return NextResponse.json({
            status: 'ERROR',
            error: err instanceof Error ? err.message : 'Invalid request',
        }, { status: 400 });
    }
}
