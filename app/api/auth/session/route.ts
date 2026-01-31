import { NextResponse } from 'next/server';

export async function POST() {
    const response = NextResponse.json({ success: true });

    // Set the session cookie
    response.cookies.set('__session', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    return response;
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
