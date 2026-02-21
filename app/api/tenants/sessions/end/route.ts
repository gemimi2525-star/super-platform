/**
 * API Route — End Session (Phase 29.2)
 * POST /api/tenants/sessions/end
 *
 * Revokes an active session in Firestore.
 */
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const { isMultiTenantEnabled } = await import('@/coreos/tenant/featureFlag');

    if (!isMultiTenantEnabled()) {
        return NextResponse.json({
            status: 'OK',
            module: 'session-end',
            phase: 29,
            multiTenantEnabled: false,
            message: 'Multi-tenant disabled, no session to revoke',
        });
    }

    try {
        const body = (await request.json()) as {
            tenantId?: string;
            sessionId?: string;
        };

        if (!body.tenantId || !body.sessionId) {
            return NextResponse.json({
                status: 'ERROR',
                error: 'Missing tenantId or sessionId',
            }, { status: 400 });
        }

        const { revokeSession } = await import('@/coreos/tenant/firestore');
        await revokeSession(body.tenantId, body.sessionId);

        return NextResponse.json({
            status: 'OK',
            module: 'session-end',
            phase: 29.2,
            tenantId: body.tenantId,
            sessionId: body.sessionId,
            revokedAt: new Date().toISOString(),
        });
    } catch (err) {
        return NextResponse.json({
            status: 'ERROR',
            error: err instanceof Error ? err.message : 'Session revocation failed',
        }, { status: 500 });
    }
}
