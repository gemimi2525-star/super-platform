/**
 * Middleware - Route Guards & Locale Handling
 * 
 * Handles:
 * 1. Locale detection and redirection
 * 2. Authentication check and redirect to login
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { checkRateLimit, RateLimitType, logger } from '@super-platform/core';

const locales = ['en', 'th', 'zh'];
const defaultLocale = 'en';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 1. API routes, static files pass through
    if (pathname.startsWith('/api/') || pathname.startsWith('/_next/') || pathname.includes('.')) {
        return NextResponse.next();
    }

    // 2. Check if pathname has locale
    const pathnameHasLocale = locales.some(
        (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
    );

    // 3. If no locale in pathname, redirect to defaultLocale
    if (!pathnameHasLocale) {
        const locale = defaultLocale;
        const url = request.nextUrl.clone();
        url.pathname = `/${locale}${pathname}`;

        const response = NextResponse.redirect(url);
        response.cookies.set('NEXT_LOCALE', locale, {
            path: '/',
            maxAge: 60 * 60 * 24 * 365, // 1 year
            sameSite: 'lax',
        });
        return response;
    }

    // 4. Extract locale from pathname
    const localeMatch = pathname.match(/^\/([^/]+)/);
    const locale = localeMatch ? localeMatch[1] : defaultLocale;

    // 5. Auth Check - remove locale prefix to check path
    const pathWithoutLocale = pathname.replace(new RegExp(`^/${locale}`), '') || '/';
    const publicPaths = ['/auth/login', '/auth/register', '/auth/forgot-password', '/'];
    const isPublic = publicPaths.some(p => pathWithoutLocale === p || pathWithoutLocale.startsWith(p + '/'));

    // Rate Limiting Logic
    const ip = (request as any).ip || request.headers.get('x-forwarded-for') || '127.0.0.1';

    let limitType: 'auth' | 'write' | 'read' | null = null;
    if (pathWithoutLocale.startsWith('/auth') || pathWithoutLocale.startsWith('/api/auth')) {
        limitType = 'auth';
    } else if (request.method !== 'GET' && request.method !== 'HEAD' && request.method !== 'OPTIONS') {
        limitType = 'write';
    } else if (pathname.startsWith('/api/')) {
        limitType = 'read';
    }

    if (limitType) {
        const res = checkRateLimit(ip, limitType);
        if (!res.success) {
            const retryAfter = res.retryAfter || 60;
            return new NextResponse(
                JSON.stringify({
                    error: 'Too many requests',
                    message: 'Please wait before trying again.',
                    retryAfter
                }),
                {
                    status: 429,
                    headers: {
                        'Content-Type': 'application/json',
                        'Retry-After': String(retryAfter),
                        'X-RateLimit-Limit': String(res.limit),
                        'X-RateLimit-Remaining': String(res.remaining),
                    }
                }
            );
        }
    }

    const hasSession = request.cookies.has('__session');

    // DEBUG LOGGING
    console.log('[Middleware] Request:', {
        pathname,
        locale,
        pathWithoutLocale,
        isPublic,
        hasSession,
        cookieNames: request.cookies.getAll().map(c => c.name)
    });

    if (!isPublic && !hasSession) {
        logger.info('Protected route access without session', {
            action: 'redirect_login',
            context: {
                ip,
                path: pathname,
            }
        });
        const url = request.nextUrl.clone();
        url.pathname = `/${locale}/auth/login`;
        return NextResponse.redirect(url);
    }

    // 6. All checks passed, proceed
    // Response creation deferred to include headers

    // 7. Apply Security Headers
    // CSP: Strict in Prod, Relaxed in Dev
    const isDev = process.env.NODE_ENV === 'development';

    // Generate Nonce for CSP
    const nonce = Buffer.from(crypto.randomUUID()).toString('base64');

    // In production, we remove unsafe-inline and unsafe-eval
    // But we add 'nonce-...' to allow Next.js inline scripts
    const scriptSrc = isDev
        ? "'self' 'unsafe-eval' 'unsafe-inline' https://apis.google.com https://*.firebaseapp.com"
        : `'self' 'nonce-${nonce}' 'strict-dynamic' https://apis.google.com https://*.firebaseapp.com`;

    const styleSrc = isDev
        ? "'self' 'unsafe-inline' https://fonts.googleapis.com"
        : `'self' 'nonce-${nonce}' https://fonts.googleapis.com`;

    const cspHeader = `
        default-src 'self';
        script-src ${scriptSrc};
        style-src ${styleSrc};
        font-src 'self' https://fonts.gstatic.com;
        img-src 'self' blob: data: https:;
        connect-src 'self' https://apis.google.com https://*.firebaseapp.com https://*.googleapis.com; 
        object-src 'none';
        base-uri 'self';
        form-action 'self';
        frame-ancestors 'none';
        upgrade-insecure-requests;
    `.replace(/\s{2,}/g, ' ').trim();

    // Set nonce request header for Next.js to use
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-nonce', nonce);
    requestHeaders.set('Content-Security-Policy', cspHeader);

    const response = NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });

    response.headers.set('Content-Security-Policy', cspHeader);

    // HSTS (Strict-Transport-Security) - PROD ONLY
    if (!isDev) {
        response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    }

    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

    return response;
}

export const config = {
    matcher: ['/((?!api|_next|.*\\..*).*)']
};
