/**
 * Middleware - Route Guards & Locale Handling
 * 
 * Handles:
 * 1. Domain-based routing (Synapse Governance -> Trust Center)
 * 2. Locale detection and redirection
 * 3. Authentication check and redirect to login
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { checkRateLimit, RateLimitType, logger } from '@super-platform/core';

const TRUST_DOMAIN = 'synapsegovernance.com';
const SUPPORTED_LOCALES = ['en', 'th'] as const;
const DEFAULT_LOCALE = 'en';

function getLocale(req: NextRequest) {
    const cookie = req.cookies.get('NEXT_LOCALE')?.value;
    if (cookie && SUPPORTED_LOCALES.includes(cookie as any)) return cookie;
    return DEFAULT_LOCALE;
}

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const isDev = process.env.NODE_ENV === 'development';
    const host = (request.headers.get('host') || '').toLowerCase();

    // 0. GLOBAL EXCLUSIONS
    // Always skip internal/static/api to prevent unnecessary processing
    if (
        pathname.startsWith('/api') ||
        pathname.startsWith('/_next') ||
        pathname === '/favicon.ico' ||
        pathname === '/robots.txt' ||
        pathname === '/sitemap.xml' ||
        pathname.startsWith('/images') ||
        pathname.startsWith('/assets') ||
        pathname.includes('.') // General file extension check
    ) {
        return NextResponse.next();
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // [PROJECT SPLIT] SYNAPSE GOVERNANCE (Trust Center Only)
    // ─────────────────────────────────────────────────────────────────────────────
    // Configured via ENV: NEXT_PUBLIC_SERVER_URL=https://www.synapsegovernance.com
    const isSynapseProject = process.env.NEXT_PUBLIC_SERVER_URL?.includes('synapsegovernance.com');

    if (isSynapseProject) {
        // 1. Root '/' -> Rewrite to Trust Center Home (Default EN)
        if (pathname === '/') {
            const url = request.nextUrl.clone();
            const locale = getLocale(request);
            url.pathname = `/${locale}/trust`;
            return NextResponse.rewrite(url);
        }

        // 2. Locale Root '/en' or '/th' -> Rewrite to '/{locale}/trust'
        const localeMatch = pathname.match(/^\/(en|th)\/?$/);
        if (localeMatch) {
            const locale = localeMatch[1];
            const url = request.nextUrl.clone();
            url.pathname = `/${locale}/trust`;
            return NextResponse.rewrite(url);
        }

        // 3. Trust Center Paths -> ALLOW
        // Must start with /en/trust or /th/trust
        if (pathname.startsWith('/en/trust') || pathname.startsWith('/th/trust')) {
            return NextResponse.next();
        }

        // 4. BLOCK EVERYTHING ELSE (OS, Apps, etc.) -> Redirect to Trust Home
        // This ensures the Trust Center domain NEVER shows the OS.
        const url = request.nextUrl.clone();
        url.pathname = '/en/trust';
        return NextResponse.redirect(url);
    }
    // ─────────────────────────────────────────────────────────────────────────────

    // 1. TRUST DOMAIN ROUTING (Host-based Rewrite)
    // synapsegovernance.com -> Trust Center content
    const isTrustDomain = host === TRUST_DOMAIN || host === `www.${TRUST_DOMAIN}` || host.endsWith(`.${TRUST_DOMAIN}`);

    if (isTrustDomain) {
        // 1.1 Root '/' -> Rewrite to Trust Center Home
        if (pathname === '/') {
            const locale = getLocale(request);
            const url = request.nextUrl.clone();
            url.pathname = `/${locale}/trust`;
            return NextResponse.rewrite(url);
        }

        // 1.2 Locale Root '/en' or '/th' -> Rewrite to '/{locale}/trust'
        const localeMatch = pathname.match(/^\/(en|th)\/?$/);
        if (localeMatch) {
            const locale = localeMatch[1];
            const url = request.nextUrl.clone();
            url.pathname = `/${locale}/trust`;
            return NextResponse.rewrite(url);
        }

        // 1.3 Other paths pass through (e.g., /en/trust/news)
        // No strict handling needed here, let Next.js router handle it via rewrites or pages
    }

    // 2. CANONICAL HOST (Production Only) for Main App
    // Enforce www.apicoredata.com if NOT trust domain
    if (process.env.NODE_ENV === 'production' && !isTrustDomain) {
        if (host === 'apicoredata.com') {
            const url = request.nextUrl.clone();
            url.host = 'www.apicoredata.com';
            url.protocol = 'https'; // Enforce HTTPS
            return NextResponse.redirect(url, 301);
        }
    }

    // 3. SPECIAL HANDLING: /os (Single Entry Point)
    // 1. If accessing /os directly -> Check Auth -> Allow or Login
    if (pathname === '/os') {
        const hasSession = request.cookies.has('__session');

        // ═══════════════════════════════════════════════════════════════════════════
        // PHASE 5.4: PRODUCTION BYPASS LOCK
        // Dev bypass is NEVER active in production, regardless of ENV config
        // ═══════════════════════════════════════════════════════════════════════════
        const isProduction = process.env.NODE_ENV === 'production' ||
            process.env.VERCEL_ENV === 'production';

        // Dev bypass only works in non-production AND when explicitly enabled
        const bypassEnabled = !isProduction &&
            isDev &&
            process.env.AUTH_DEV_BYPASS === 'true';

        const hasBypassHeaders = bypassEnabled && request.headers.has('x-dev-test-email');

        // Log bypass attempt in production (for security audit)
        if (isProduction && process.env.AUTH_DEV_BYPASS === 'true') {
            console.warn('[SECURITY] AUTH_DEV_BYPASS is configured but LOCKED in production');
        }

        if (!hasSession && !hasBypassHeaders) {
            const url = request.nextUrl.clone();
            // Redirect to root public login (no locale prefix)
            url.pathname = '/login';
            url.searchParams.set('callbackUrl', '/os');
            return NextResponse.redirect(url);
        }
        return NextResponse.next();
    }

    // 2. If accessing /{locale}/os -> Redirect to /os (Canonicalize)
    const localeOsMatch = pathname.match(/^\/(en|th)\/os/);
    if (localeOsMatch) {
        const url = request.nextUrl.clone();
        url.pathname = '/os';
        return NextResponse.redirect(url, 301);
    }

    // 4. PUBLIC ROOT → REDIRECT TO LOCALE
    // Root "/" should redirect to /{locale} based on cookie
    if (pathname === '/') {
        const locale = getLocale(request);
        const url = request.nextUrl.clone();
        url.pathname = `/${locale}`;

        const response = NextResponse.redirect(url);
        response.cookies.set('NEXT_LOCALE', locale, {
            path: '/',
            maxAge: 60 * 60 * 24 * 365, // 1 year
            sameSite: 'lax',
        });
        return response;
    }

    // 4b. PUBLIC LOGIN BYPASS
    if (pathname === '/login') {
        return NextResponse.next();
    }

    // 5. STANDARD LOCALE HANDLING (Legacy / localized pages)
    // Check if pathname has locale
    const pathnameHasLocale = SUPPORTED_LOCALES.some(
        (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
    );

    // If no locale in pathname (and not bypassed above), redirect to defaultLocale
    if (!pathnameHasLocale) {
        // Special Case: /core-os-demo -> /os (Legacy redirect)
        if (pathname === '/core-os-demo') {
            const url = request.nextUrl.clone();
            url.pathname = '/os';
            return NextResponse.redirect(url, 301);
        }

        // Use cookie locale (last selected language) instead of hardcoded default
        const locale = getLocale(request);
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

    // Extract locale from pathname for Rate Limiting / Auth checks below
    const localeMatch = pathname.match(/^\/([^/]+)/);
    const locale = localeMatch ? localeMatch[1] : DEFAULT_LOCALE;
    const pathWithoutLocale = pathname.replace(new RegExp(`^/${locale}`), '') || '/';

    // Legacy Auth Redirects
    if (pathWithoutLocale.startsWith('/auth/')) {
        const url = request.nextUrl.clone();
        url.pathname = `/${locale}/login`;
        return NextResponse.redirect(url, 301);
    }

    // 6. RATE LIMITING
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

    // DEBUG LOGGING
    if (process.env.NODE_ENV === 'development') {
        console.log('[Middleware] Request:', {
            pathname,
            pathWithoutLocale,
            // isPublic, // Removed as publicPaths logic is simplified
            // isProtectedRoute, // Removed as /os is handled explicitly
            hasSession: request.cookies.has('__session') // Re-evaluate hasSession here if needed
        });
    }

    // 7. SECURITY HEADERS (CSP, HSTS)
    const nonce = Buffer.from(crypto.randomUUID()).toString('base64');

    const scriptSrc = isDev
        ? "'self' 'unsafe-eval' 'unsafe-inline' https://apis.google.com https://*.firebaseapp.com"
        : `'self' 'nonce-${nonce}' 'strict-dynamic' https://apis.google.com https://*.firebaseapp.com`;

    const styleSrc = isDev
        ? "'self' 'unsafe-inline' https://fonts.googleapis.com"
        : "'self' 'unsafe-inline' https://fonts.googleapis.com";

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

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-nonce', nonce);
    requestHeaders.set('Content-Security-Policy', cspHeader);

    const response = NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });

    response.headers.set('Content-Security-Policy', cspHeader);

    // HSTS - PROD ONLY
    if (!isDev) {
        response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    }

    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

    // CRITICAL: Sync cookie FROM URL locale (URL is source of truth)
    // This prevents redirect back to old locale when navigating
    if (pathnameHasLocale && locale && SUPPORTED_LOCALES.includes(locale as any)) {
        const currentCookie = request.cookies.get('NEXT_LOCALE')?.value;
        if (currentCookie !== locale) {
            response.cookies.set('NEXT_LOCALE', locale, {
                path: '/',
                maxAge: 60 * 60 * 24 * 365, // 1 year
                sameSite: 'lax',
            });
        }
    }

    return response;
}

export const config = {
    matcher: [
        // Match all paths except static files, api, _next
        "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
    ]
};
