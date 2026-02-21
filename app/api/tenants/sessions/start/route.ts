/**
 * API Route — Start Session (Phase 29)
 * POST /api/tenants/sessions/start
 *
 * Creates a new session for the authenticated user in a specific tenant.
 * Returns a sessionId for use in subsequent requests.
 */
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const { isMultiTenantEnabled } = await import('@/coreos/tenant/featureFlag');

    if (!isMultiTenantEnabled()) {
        return NextResponse.json({
            status: 'OK',
            module: 'session-start',
            phase: 29,
            multiTenantEnabled: false,
            sessionId: 'legacy-single',
            message: 'Multi-tenant disabled, using legacy session',
        });
    }

    try {
        const body = (await request.json()) as {
            tenantId?: string;
        };

        if (!body.tenantId) {
            return NextResponse.json({
                status: 'ERROR',
                error: 'Missing tenantId',
            }, { status: 400 });
        }

        // Generate session ID
        const sessionId = crypto.randomUUID();

        // TODO Phase 29.1: Validate membership + write session doc to Firestore
        return NextResponse.json({
            status: 'OK',
            module: 'session-start',
            phase: 29,
            sessionId,
            tenantId: body.tenantId,
            createdAt: new Date().toISOString(),
        });
    } catch (err) {
        return NextResponse.json({
            status: 'ERROR',
            error: err instanceof Error ? err.message : 'Invalid request',
        }, { status: 400 });
    }
}
