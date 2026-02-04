import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSessionCookie, verifySessionCookie } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

// 5 days
const EXPIRES_IN = 60 * 60 * 24 * 5 * 1000;

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { idToken } = body;

        if (!idToken) {
            return NextResponse.json({ error: 'ID token required' }, { status: 400 });
        }

        // Create the session cookie
        const sessionCookie = await createSessionCookie(idToken, EXPIRES_IN);

        // Phase 10.1: Decode token to get uid for logging
        const { verifyIdToken } = await import('@/lib/firebase-admin');
        let uid = 'unknown';
        try {
            const decoded = await verifyIdToken(idToken);
            uid = decoded.uid;
        } catch {
            // Token already verified by createSessionCookie, continue
        }

        const expiryDate = new Date(Date.now() + EXPIRES_IN);
        console.log(`[AUTH] 🎫 Issued __session cookie: uid=${uid}, expires=${expiryDate.toISOString()}`);

        const response = NextResponse.json({ status: 'success' }, { status: 200 });

        // Set the cookie
        const cookieStore = await cookies();
        cookieStore.set('__session', sessionCookie, {
            maxAge: EXPIRES_IN / 1000,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            sameSite: 'lax',
        });

        console.log(`[AUTH] 🍪 Cookie flags: httpOnly=true, secure=${process.env.NODE_ENV === 'production'}, sameSite=lax, path=/`);

        return response;
    } catch (error) {
        console.error('[API] /auth/session POST error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE() {
    try {
        const cookieStore = await cookies();
        cookieStore.delete('__session');
        return NextResponse.json({ status: 'success' }, { status: 200 });
    } catch (error) {
        console.error('[API] /auth/session DELETE error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET() {
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('__session')?.value;

        if (!sessionCookie) {
            return NextResponse.json({ isAuth: false }, { status: 200 });
        }

        // Verify the session
        const claims = await verifySessionCookie(sessionCookie);

        return NextResponse.json({
            isAuth: true,
            uid: claims.uid,
            email: claims.email,
            role: claims.role || 'user'
        }, { status: 200 });

    } catch (error) {
        // Session invalid or expired
        return NextResponse.json({ isAuth: false }, { status: 200 });
    }
}
