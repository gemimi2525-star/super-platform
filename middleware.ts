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

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 6.3.9: Rate Limit Guardrails + Observability
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if request is HTML document navigation (not asset/XHR)
 */
function isHtmlNavigation(request: NextRequest, pathname: string): boolean {
    if (request.method !== 'GET') return false;
    if (pathname.startsWith('/api/')) return false;
    if (pathname.startsWith('/_next/')) return false;
    if (pathname.startsWith('/trpc')) return false;
    if (/\.(json|xml|txt|ico|png|jpg|jpeg|gif|svg|css|js|woff|woff2|ttf|eot)$/i.test(pathname)) return false;

    const accept = request.headers.get('accept') || '';
    const secFetchDest = request.headers.get('sec-fetch-dest') || '';

    // Must have HTML accept OR document fetch destination
    return accept.includes('text/html') || secFetchDest === 'document';
}

/**
 * Check if request is from a real browser (not bot/curl)
 */
function isBrowserRequest(request: NextRequest): boolean {
    // Browser sends Sec-Fetch headers
    const secFetchSite = request.headers.get('sec-fetch-site');
    const secFetchMode = request.headers.get('sec-fetch-mode');
    const accept = request.headers.get('accept') || '';

    // Real browsers always send these headers
    if (secFetchSite && secFetchMode) return true;
    if (accept.includes('text/html')) return true;

    // Check user-agent for known bots
    const ua = (request.headers.get('user-agent') || '').toLowerCase();
    const botKeywords = ['bot', 'crawler', 'spider', 'curl', 'wget', 'python', 'axios', 'httpie', 'insomnia', 'postman'];
    return !botKeywords.some(k => ua.includes(k)) && ua.length > 0;
}

/**
 * Hash IP for privacy (only first 2 octets)
 */
function hashIp(ip: string): string {
    if (!ip || ip === '127.0.0.1') return '127.0.*.*';
    const parts = ip.split('.');
    if (parts.length >= 2) {
        return `${parts[0]}.${parts[1]}.*.*`;
    }
    return ip.slice(0, 8) + '...';
}

/**
 * Classify user-agent for logging (no PII)
 */
function classifyUserAgent(ua: string): string {
    const lower = ua.toLowerCase();
    if (lower.includes('bot') || lower.includes('crawler') || lower.includes('spider')) return 'bot';
    if (lower.includes('curl')) return 'curl';
    if (lower.includes('python')) return 'python';
    if (lower.includes('chrome')) return 'chrome';
    if (lower.includes('safari')) return 'safari';
    if (lower.includes('firefox')) return 'firefox';
    if (lower.includes('edge')) return 'edge';
    if (lower.length === 0) return 'empty';
    return 'unknown';
}

/**
 * Generate short request ID for tracing (Phase 6.5.1)
 */
function generateRequestId(): string {
    return crypto.randomUUID().slice(0, 8);
}

/**
 * Extract geo info from Vercel headers (Phase 6.5.1)
 */
function extractGeoInfo(request: NextRequest): { country: string; city: string; region: string } {
    return {
        country: request.headers.get('x-vercel-ip-country') || 'unknown',
        city: request.headers.get('x-vercel-ip-city') || 'unknown',
        region: request.headers.get('x-vercel-ip-country-region') || 'unknown',
    };
}

/**
 * Log 429 event for observability (Phase 6.5.1 Enhanced)
 * - No raw IP (hashed only)
 * - Request ID for tracing
 * - Geo info from Vercel Edge
 */
function log429Event(request: NextRequest, pathname: string, policy: string, retryAfter: number) {
    const ua = request.headers.get('user-agent') || '';
    const ip = (request as any).ip || request.headers.get('x-forwarded-for') || '0.0.0.0';
    const geo = extractGeoInfo(request);
    const requestId = generateRequestId();

    console.warn('[RateLimit:429]', JSON.stringify({
        // Core event info
        event: 'rate_limit_429',
        requestId,
        policy,
        pathname,
        method: request.method,
        retryAfter,

        // Client classification (no PII)
        uaClass: classifyUserAgent(ua),
        ipHash: hashIp(ip.split(',')[0].trim()),

        // Geo context (from Vercel Edge)
        geo: geo.country !== 'unknown' ? geo : undefined,

        // Metadata
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV || 'production',
    }));
}

/**
 * Create 429 response with policy header
 */
function create429Response(policy: string, res: { limit: number; remaining: number; retryAfter: number }): NextResponse {
    return new NextResponse(
        JSON.stringify({
            error: 'Too many requests',
            message: 'Please wait before trying again.',
            retryAfter: res.retryAfter
        }),
        {
            status: 429,
            headers: {
                'Content-Type': 'application/json',
                'Retry-After': String(res.retryAfter),
                'X-RateLimit-Policy': policy,
                'X-RateLimit-Limit': String(res.limit),
                'X-RateLimit-Remaining': String(res.remaining),
            }
        }
    );
}

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const isDev = process.env.NODE_ENV === 'development';
    const host = (request.headers.get('host') || '').toLowerCase();

    // 0. GLOBAL EXCLUSIONS
    // ═══════════════════════════════════════════════════════════════════════════
    // PHASE 6.3.9: API routes are rate limited BEFORE returning
    // Static files and internal routes skip middleware entirely
    // ═══════════════════════════════════════════════════════════════════════════

    // 0.1 API Routes: Rate limit, then pass through
    if (pathname.startsWith('/api')) {
        const ip = ((request as any).ip || request.headers.get('x-forwarded-for') || '127.0.0.1').split(',')[0].trim();
        let apiLimitType: 'auth' | 'write' | 'read' | null = null;

        if (pathname.startsWith('/api/auth')) {
            // Auth API: strict limit (10/min)
            apiLimitType = 'auth';
        } else if (request.method !== 'GET' && request.method !== 'HEAD' && request.method !== 'OPTIONS') {
            // Write operations: moderate limit (60/min)
            apiLimitType = 'write';
        } else {
            // Read API: generous limit (300/min)
            apiLimitType = 'read';
        }

        if (apiLimitType) {
            const res = checkRateLimit(ip, apiLimitType);
            if (!res.success) {
                log429Event(request, pathname, apiLimitType, res.retryAfter || 60);
                return create429Response(apiLimitType, res);
            }
        }

        // API routes pass through without further processing
        return NextResponse.next();
    }

    // 0.2 Static/Internal: Skip entirely (no rate limit needed)
    if (
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
    // ═══════════════════════════════════════════════════════════════════════════
    // PHASE 9.8: Deterministic Redirect with Logging
    // ═══════════════════════════════════════════════════════════════════════════
    if (pathname === '/os') {
        const hasSession = request.cookies.has('__session');

        // PHASE 5.4: PRODUCTION BYPASS LOCK
        const isProduction = process.env.NODE_ENV === 'production' ||
            process.env.VERCEL_ENV === 'production';

        const bypassEnabled = !isProduction &&
            isDev &&
            process.env.AUTH_DEV_BYPASS === 'true';

        // Log bypass attempt in production
        if (isProduction && process.env.AUTH_DEV_BYPASS === 'true') {
            console.warn('[MW][SECURITY] AUTH_DEV_BYPASS is configured but LOCKED in production');
        }

        // Decision logging
        if (isDev) {
            console.log('[MW][/os] Auth check:', { hasSession, bypassEnabled });
        }

        // No session AND no bypass -> redirect to login (ONCE)
        if (!hasSession && !bypassEnabled) {
            console.log('[MW][/os] REDIRECT -> /login?callbackUrl=/os (no session, no bypass)');
            const url = request.nextUrl.clone();
            url.pathname = '/login';
            url.searchParams.set('callbackUrl', '/os');
            return NextResponse.redirect(url);
        }

        // Has session OR bypass -> allow access
        if (isDev) {
            console.log('[MW][/os] ALLOW (session or bypass)');
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

    // 3b. SPECIAL HANDLING: /ops (Owner-Only Ops Center)
    // ═══════════════════════════════════════════════════════════════════════════
    // P0 HOTFIX: Defense-in-depth guard for /ops/*
    //   Layer 1 (here, Edge): Check session cookie exists → redirect /ops/login if not
    //   Layer 2 (ops/layout.tsx, Node.js): Verify UID == SUPER_ADMIN_ID → redirect /os if not
    //   Layer 3 (page-level): Individual pages verify auth redundantly
    // EXEMPT: /ops/login is the ONLY path that skips auth
    // SECURITY: No header injection (x-ops-path removed — was exploitable)
    // ═══════════════════════════════════════════════════════════════════════════
    if (pathname === '/ops' || pathname.startsWith('/ops/')) {
        // EXEMPT: /ops/login is the login entry — no auth required
        if (pathname === '/ops/login') {
            // Inject VERIFIED pathname via requestHeaders (non-spoofable by client)
            // This replaces incoming headers — any user-injected x-ops-pathname is stripped
            const newHeaders = new Headers(request.headers);
            newHeaders.set('x-ops-pathname', '/ops/login');
            return NextResponse.next({
                request: { headers: newHeaders },
            });
        }
        const hasSession = request.cookies.has('__session');
        if (!hasSession) {
            console.warn(`[MW][/ops] REDIRECT -> /ops/login (no session) path=${pathname}`);
            const url = request.nextUrl.clone();
            url.pathname = '/ops/login';
            url.searchParams.set('callbackUrl', pathname);
            return NextResponse.redirect(url);
        }
        // Session exists → pass to server layout for UID verification
        // Strip any spoofed x-ops-pathname header from client
        const newHeaders = new Headers(request.headers);
        newHeaders.delete('x-ops-pathname');
        return NextResponse.next({
            request: { headers: newHeaders },
        });
    }

    // Canonicalize /{locale}/ops/* -> /ops/*
    const localeOpsMatch = pathname.match(/^\/(en|th)(\/ops(?:\/.*)?)/);
    if (localeOpsMatch) {
        const url = request.nextUrl.clone();
        url.pathname = localeOpsMatch[2]; // e.g. /ops or /ops/login
        return NextResponse.redirect(url, 301);
    }

    // 3c. SPECIAL HANDLING: /system (Owner/Admin System Hub)
    // ═══════════════════════════════════════════════════════════════════════════
    // Phase 27A: Defense-in-depth guard for /system/*
    //   Layer 1 (here, Edge): Check session cookie exists → redirect /login if not
    //   Layer 2 (system/layout.tsx, Node.js): Verify role == owner/admin → redirect /os if not
    // ═══════════════════════════════════════════════════════════════════════════
    if (pathname === '/system' || pathname.startsWith('/system/')) {
        const hasSession = request.cookies.has('__session');
        if (!hasSession) {
            console.warn(`[MW][/system] REDIRECT -> /login (no session) path=${pathname}`);
            const url = request.nextUrl.clone();
            url.pathname = '/login';
            url.searchParams.set('callbackUrl', pathname);
            return NextResponse.redirect(url);
        }
        // Session exists → pass to server layout for role verification
        return NextResponse.next();
    }

    // Canonicalize /{locale}/system/* -> /system/*
    const localeSystemMatch = pathname.match(/^\/(en|th)(\/system(?:\/.*)?)/);
    if (localeSystemMatch) {
        const url = request.nextUrl.clone();
        url.pathname = localeSystemMatch[2];
        return NextResponse.redirect(url, 301);
    }

    // 4. PUBLIC ROOT → REDIRECT TO LOCALE
    // Root "/" should redirect to /{locale} based on cookie
    // NOTE: Do NOT set cookie here - cookie is only set by LanguageDropdown
    if (pathname === '/') {
        const locale = getLocale(request);
        const url = request.nextUrl.clone();
        url.pathname = `/${locale}`;
        return NextResponse.redirect(url);
    }

    // 4b. PUBLIC LOGIN HANDLING
    // ═══════════════════════════════════════════════════════════════════════════
    // PHASE 9.8: Login page should check if user already has session
    // If user has session AND callbackUrl -> redirect to callbackUrl (ONCE)
    // ═══════════════════════════════════════════════════════════════════════════
    if (pathname === '/login') {
        const hasSession = request.cookies.has('__session');
        const callbackUrl = request.nextUrl.searchParams.get('callbackUrl');

        if (isDev) {
            console.log('[MW][/login] Session check:', { hasSession, callbackUrl });
        }

        // Already logged in with callbackUrl -> redirect to destination (ONCE)
        if (hasSession && callbackUrl) {
            console.log(`[MW][/login] REDIRECT -> ${callbackUrl} (already has session)`);
            const url = request.nextUrl.clone();
            url.pathname = callbackUrl;
            url.searchParams.delete('callbackUrl');
            return NextResponse.redirect(url);
        }

        // No session -> show login page (no redirect)
        if (isDev) {
            console.log('[MW][/login] ALLOW (show login page)');
        }
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
        // NOTE: Do NOT set cookie here - cookie is only set by LanguageDropdown
        const locale = getLocale(request);
        const url = request.nextUrl.clone();
        url.pathname = `/${locale}${pathname}`;
        return NextResponse.redirect(url);
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
    // ═══════════════════════════════════════════════════════════════════════════
    // PHASE 6.3.9: 3-Tier Rate Limit Policy
    //   - auth: /api/auth/* (10/min)
    //   - write: POST/PUT/DELETE /api/* (60/min)
    //   - read: GET /api/* (300/min)
    //   - page_nav: HTML page GET for browsers (600/min)
    //   - non_browser: HTML page GET for bots/curl (60/min)
    // ═══════════════════════════════════════════════════════════════════════════
    const ip = ((request as any).ip || request.headers.get('x-forwarded-for') || '127.0.0.1').split(',')[0].trim();

    let limitType: 'auth' | 'write' | 'read' | 'page_nav' | 'non_browser' | null = null;

    // API Routes: always rate limited
    if (pathname.startsWith('/api/')) {
        if (pathname.startsWith('/api/auth')) {
            // Auth API: strict limit (10/min default)
            limitType = 'auth';
        } else if (request.method !== 'GET' && request.method !== 'HEAD' && request.method !== 'OPTIONS') {
            // Write operations: moderate limit (60/min default)
            limitType = 'write';
        } else {
            // Read API: generous limit (300/min default)
            limitType = 'read';
        }
    }
    // Page Navigation: rate limited based on browser detection
    else if (isHtmlNavigation(request, pathname)) {
        // Browsers get generous limit, bots/curl get tighter limit
        limitType = isBrowserRequest(request) ? 'page_nav' : 'non_browser';
    }
    // Other GET requests (assets via matcher exclusion, but just in case): no limit

    if (limitType) {
        const res = checkRateLimit(ip, limitType);
        if (!res.success) {
            // Log 429 event for observability
            log429Event(request, pathname, limitType, res.retryAfter || 60);
            // Return 429 with policy header
            return create429Response(limitType, res);
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
    // Edge-safe nonce: crypto.randomUUID() is available in Edge Runtime
    // NOTE: Buffer is NOT available in Edge Runtime — do NOT use Buffer here
    const nonce = crypto.randomUUID();

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

    // PHASE 6.3.7: URL = Source of Truth for locale paths
    // Cookie is ONLY used for paths without locale prefix (/, /login)
    // LanguageDropdown sets cookie AND navigates with proper history

    return response;
}

export const config = {
    matcher: [
        // PHASE 6.3.9: Match ALL paths except static files and worker/job/ops APIs
        // API routes for jobs/worker/ops are excluded to prevent middleware interference
        "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|api/jobs|api/worker|api/ops|api/build-info|api/platform).*)",
    ]
};
