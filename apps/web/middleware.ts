/**
 * Middleware - Lightweight Route Guards
 * 
 * IMPORTANT: Real auth enforcement happens in Server Component layouts
 * This middleware only handles basic routing (public vs protected)
 * 
 * Why: Edge runtime doesn't support Firebase Admin SDK
 * Solution: Use requirePlatformOwner() / requireTenantMember() in layouts
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Public paths (no auth required)
    const publicPaths = ['/', '/login', '/register', '/forgot-password', '/auth'];
    const isPublicPath = publicPaths.some(path => pathname === path || pathname.startsWith(path + '/'));

    if (isPublicPath) {
        return NextResponse.next();
    }

    // Check if user has session cookie
    const hasSession = request.cookies.has('__session');

    // If no session, redirect to login (except for static assets)
    if (!hasSession && pathname !== '/auth/login') {
        return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    // Let request through - real auth happens in server layouts
    // - (platform) layout calls requirePlatformOwner()
    // - (tenant) layout calls requireTenantMember()
    return NextResponse.next();
}

// Configure which routes run middleware
export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
