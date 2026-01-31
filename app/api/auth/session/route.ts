import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        let body;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
        }
        const { idToken } = body;

        if (!idToken) {
            return NextResponse.json({ success: false, error: 'Missing ID token' }, { status: 400 });
        }

        const { createSessionCookie } = await import('@/lib/firebase-admin');
        const sessionCookie = await createSessionCookie(idToken);

        const response = NextResponse.json({ success: true });

        // Set the session cookie
        response.cookies.set('__session', sessionCookie, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 5, // 5 days
        });

        return response;
    } catch (error) {
        console.error('[Session API] Failed to create session:', error);
        return NextResponse.json({
            success: false,
            error: (error as Error).message || 'Internal Server Error',
            details: String(error)
        }, { status: 500 });
    }
}

export async function GET(request: Request) {
    const { getAuthContext } = await import('@/lib/auth/server');
    // Import NextRequest to be safe or cast
    const auth = await getAuthContext(request as any);

    if (!auth) {
        return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
        authenticated: true,
        user: auth
    });
}
