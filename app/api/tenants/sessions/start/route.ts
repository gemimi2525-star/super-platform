/**
 * API Route — Start Session (Phase 29.2)
 * POST /api/tenants/sessions/start
 *
 * Creates a new Firestore session for the authenticated user.
 * Validates membership before creating session.
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
                errorCode: 'TENANT_ID_REQUIRED',
            }, { status: 400 });
        }

        // Get authenticated user
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

        // Validate membership
        const { validateMembership, createSession } = await import('@/coreos/tenant/firestore');
        const member = await validateMembership(body.tenantId, userId);

        if (!member) {
            return NextResponse.json({
                status: 'ERROR',
                error: 'Not a member of this tenant',
                errorCode: 'TENANT_MEMBER_REQUIRED',
            }, { status: 403 });
        }

        // Create session
        const { sessionId, session } = await createSession(
            body.tenantId,
            userId,
            member.role,
        );

        return NextResponse.json({
            status: 'OK',
            module: 'session-start',
            phase: 29.2,
            sessionId,
            tenantId: body.tenantId,
            role: member.role,
            createdAt: session.createdAt,
        });
    } catch (err) {
        return NextResponse.json({
            status: 'ERROR',
            error: err instanceof Error ? err.message : 'Session creation failed',
        }, { status: 500 });
    }
}
