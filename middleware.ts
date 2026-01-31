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

const locales = ['en', 'th'];
const defaultLocale = 'en';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // S0) Canonical Host Decision (Production Only)
    // Enforce www.apicoredata.com
    if (process.env.NODE_ENV === 'production') {
        const host = request.headers.get('host');
        if (host === 'apicoredata.com') {
            const url = request.nextUrl.clone();
            url.host = 'www.apicoredata.com';
            url.protocol = 'https'; // Enforce HTTPS
            return NextResponse.redirect(url, 301);
        }
    }

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
        // Special Case: root / -> /en/login (instead of /en/) if we want strict entry
        // User requirement: /os is main entry.
        // Let standard logic handle it mostly, but if /core-os-demo -> redirect to /os
        if (pathname === '/core-os-demo') {
            const url = request.nextUrl.clone();
            url.pathname = `/${defaultLocale}/os`;
            return NextResponse.redirect(url, 301);
        }

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

    // 5. Route Normalization & Redirects (Phase S2)
    const pathWithoutLocale = pathname.replace(new RegExp(`^/${locale}`), '') || '/';

    // S2) Replace/Deprecate Demo Routes
    if (pathWithoutLocale === '/core-os-demo' || pathWithoutLocale === '/core-os-demo/') {
        const url = request.nextUrl.clone();
        url.pathname = `/${locale}/os`;
        return NextResponse.redirect(url, 301);
    }

    // 6. Auth Check & Secure Gate (Phase S4)
    // Public whitelist: /login, /auth/*, /, /api/auth/*
    const publicPaths = ['/login', '/auth/login', '/auth/register', '/'];
    const isPublic = publicPaths.some(p => pathWithoutLocale === p || pathWithoutLocale.startsWith(p + '/'));

    // Protected Routes: /os, /v2, /desktop
    const protectedPrefixes = ['/os', '/v2', '/desktop', '/home'];
    const isProtectedRoute = protectedPrefixes.some(p => pathWithoutLocale === p || pathWithoutLocale.startsWith(p + '/'));

    // Rate Limiting Logic
    const ip = (request as any).ip || request.headers.get('x-forwarded-for') || '127.0.0.1';

    let limitType: 'auth' | 'write' | 'read' | null = null;
    if (pathWithoutLocale.startsWith('/auth') || pathWithoutLocale.startsWith('/api/auth') || pathWithoutLocale === '/login') {
        limitType = 'auth';
    } else if (request.method !== 'GET' && request.method !== 'HEAD' && request.method !== 'OPTIONS') {
        limitType = 'write';
    } else if (pathname.startsWith('/api/')) {
        limitType = 'read';
    }

    if (limitType) {
        const res = checkRateLimit(ip, limitType);
        if (!res.success) {
            // ... rate limit response ...
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
    if (process.env.NODE_ENV === 'development') {
        console.log('[Middleware] Request:', {
            pathname,
            pathWithoutLocale,
            isPublic,
            isProtectedRoute,
            hasSession
        });
    }

    // Secure Gate v1 Decision
    // BYPASS CHECK: Check for Dev Test Headers (Bypass Mode)
    const isDev = process.env.NODE_ENV === 'development';
    const bypassActive = isDev && process.env.AUTH_DEV_BYPASS === 'true';
    const hasBypassHeaders = bypassActive && request.headers.has('x-dev-test-email');

    if (isProtectedRoute) {
        // Must have either a session cookie OR be in a valid bypass state
        if (!hasSession && !hasBypassHeaders) {
            logger.info('Protected route access blocked (No Session)', {
                action: 'redirect_login',
                context: { ip, path: pathname }
            });
            const url = request.nextUrl.clone();
            url.pathname = `/${locale}/login`; // Redirect to dedicated login page
            // Add ?callbackUrl to be nice
            url.searchParams.set('callbackUrl', pathname);
            return NextResponse.redirect(url);
        }
    }

    // Fallback: If not public and not explicitly protected (but essentially private app territory)
    // We treat everything else as potentially needing auth if it's not in public list?
    // For now, strict protection on /os is the Main Goal. Other routes might be landing pages.
    // Ensure / is public (landing).

    // Legacy Check Removal: We now rely on explicit isProtectedRoute lists for the OS.
    // If strict security is needed for *everything*, we would flip logic to "block unless public".
    // User requested "Secure Gate" for /os. I will stick to explicit protection for now to avoid breaking landing pages.

    // 6. All checks passed, proceed
    // Response creation deferred to include headers

    // 7. Apply Security Headers
    // CSP: Strict in Prod, Relaxed in Dev
    // isDev is already declared above

    // Generate Nonce for CSP
    const nonce = Buffer.from(crypto.randomUUID()).toString('base64');

    // In production, we remove unsafe-inline and unsafe-eval
    // But we add 'nonce-...' to allow Next.js inline scripts
    const scriptSrc = isDev
        ? "'self' 'unsafe-eval' 'unsafe-inline' https://apis.google.com https://*.firebaseapp.com"
        : `'self' 'nonce-${nonce}' 'strict-dynamic' https://apis.google.com https://*.firebaseapp.com`;

    const styleSrc = isDev
        ? "'self' 'unsafe-inline' https://fonts.googleapis.com"
        : "'self' 'unsafe-inline' https://fonts.googleapis.com"; // Phase S: Allow inline styles for React components

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
