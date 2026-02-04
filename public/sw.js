/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NEXUS Shell — Service Worker (Phase 7.2 HARDENED)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Safe caching for offline shell resilience.
 * ALLOWLIST ONLY — no wildcard caching, no sensitive data.
 * 
 * ⚠️ CRITICAL SECURITY:
 * - NEVER cache navigation HTML for protected routes (/os, /login)
 * - NEVER cache auth/session/governance APIs
 * - Offline fallback is read-only informational only
 * 
 * Cache Policy:
 * - Static assets: /_next/static/** (cache-first)
 * - Health API: /api/platform/health (stale-while-revalidate)
 * - Navigation: network-only, offline fallback on failure
 * 
 * @version 1.1.0 (Phase 7.2 Hardened)
 */

const CACHE_VERSION = 'nexus-shell-v1.1.0';
const CACHE_NAME = `${CACHE_VERSION}`;

// ═══════════════════════════════════════════════════════════════════════════
// CACHE ALLOWLIST (EXPLICIT ONLY)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Assets to precache on install
 * ⚠️ NO NAVIGATION HTML — only static assets and offline fallback
 */
const PRECACHE_ASSETS = [
    '/offline.html',
    // NO /os — protected route, must go through auth
];

/**
 * URL patterns safe for runtime caching (stale-while-revalidate)
 */
const RUNTIME_CACHE_ALLOWLIST = [
    '/api/platform/health',
];

/**
 * URL patterns that must NEVER be cached
 * These bypass cache completely
 */
const NEVER_CACHE_PATTERNS = [
    // Auth & Session
    '/api/auth',
    '/api/platform/me',
    '/api/platform/session',
    '/api/platform/session-debug',

    // Business Data
    '/api/platform/users',
    '/api/platform/orgs',
    '/api/platform/audit',

    // Governance & Trust
    '/api/trust',
    '/api/governance',

    // Auth Pages (navigation)
    '/login',
    '/logout',
    '/auth',
];

/**
 * Protected navigation routes — NEVER cache HTML
 * Always network-only, fallback to offline.html
 */
const PROTECTED_NAVIGATION_ROUTES = [
    '/os',
    '/login',
    '/auth',
];

// ═══════════════════════════════════════════════════════════════════════════
// INSTALL EVENT
// ═══════════════════════════════════════════════════════════════════════════

self.addEventListener('install', (event) => {
    console.log('[NEXUS SW] Installing v1.1.0 (Hardened)');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[NEXUS SW] Precaching offline fallback');
                return cache.addAll(PRECACHE_ASSETS);
            })
            .then(() => {
                return self.skipWaiting();
            })
            .catch((err) => {
                console.error('[NEXUS SW] Precache failed:', err);
            })
    );
});

// ═══════════════════════════════════════════════════════════════════════════
// ACTIVATE EVENT
// ═══════════════════════════════════════════════════════════════════════════

self.addEventListener('activate', (event) => {
    console.log('[NEXUS SW] Activating');

    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name !== CACHE_NAME)
                        .map((name) => {
                            console.log('[NEXUS SW] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => {
                return self.clients.claim();
            })
    );
});

// ═══════════════════════════════════════════════════════════════════════════
// FETCH EVENT
// ═══════════════════════════════════════════════════════════════════════════

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    const request = event.request;

    // Only handle same-origin requests
    if (url.origin !== location.origin) {
        return;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIORITY 1: NAVIGATION REQUESTS — Special handling
    // ─────────────────────────────────────────────────────────────────────────
    if (request.mode === 'navigate') {
        // Check for callbackUrl (OAuth redirects) — NEVER cache
        if (url.searchParams.has('callbackUrl')) {
            return; // Let browser handle
        }

        // Protected routes — network-only with offline fallback
        if (isProtectedNavigation(url.pathname)) {
            event.respondWith(navigationNetworkOnly(request));
            return;
        }

        // Other navigation — network-only (no caching HTML at all)
        event.respondWith(navigationNetworkOnly(request));
        return;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIORITY 2: NEVER CACHE — Sensitive endpoints
    // ─────────────────────────────────────────────────────────────────────────
    if (shouldNeverCache(url.pathname)) {
        return; // Network only — bypass SW completely
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIORITY 3: RUNTIME CACHE — Health API (stale-while-revalidate)
    // ─────────────────────────────────────────────────────────────────────────
    if (isRuntimeCacheable(url.pathname)) {
        event.respondWith(staleWhileRevalidate(request));
        return;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIORITY 4: STATIC ASSETS — Cache first
    // ─────────────────────────────────────────────────────────────────────────
    if (isStaticAsset(url.pathname)) {
        event.respondWith(cacheFirst(request));
        return;
    }

    // Default: network only (no caching)
});

// ═══════════════════════════════════════════════════════════════════════════
// CACHING STRATEGIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Navigation: Network ONLY — Never cache HTML
 * On failure, serve offline fallback
 */
async function navigationNetworkOnly(request) {
    try {
        const response = await fetch(request);
        // ⚠️ DO NOT CACHE — return directly
        return response;
    } catch {
        // Network failed — serve offline fallback
        console.log('[NEXUS SW] Navigation offline, serving fallback');
        const cache = await caches.open(CACHE_NAME);
        const offlinePage = await cache.match('/offline.html');

        if (offlinePage) {
            return offlinePage;
        }

        // Fallback of fallback
        return new Response(
            '<!DOCTYPE html><html><head><title>Offline</title></head><body style="font-family:system-ui;text-align:center;padding:50px;"><h1>Offline</h1><p>NEXUS Shell requires network connection.</p><button onclick="location.reload()">Retry</button></body></html>',
            {
                status: 503,
                headers: { 'Content-Type': 'text/html' }
            }
        );
    }
}

/**
 * Cache first, fallback to network
 * For static assets (JS/CSS/fonts)
 */
async function cacheFirst(request) {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);

    if (cached) {
        return cached;
    }

    try {
        const response = await fetch(request);

        if (response.ok && isSafeToCache(response)) {
            cache.put(request, response.clone());
        }

        return response;
    } catch {
        return new Response('Offline', { status: 503 });
    }
}

/**
 * Stale-while-revalidate
 * Return cache immediately, update in background
 */
async function staleWhileRevalidate(request) {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);

    const fetchPromise = fetch(request)
        .then((response) => {
            if (response.ok && isSafeToCache(response)) {
                cache.put(request, response.clone());
            }
            return response;
        })
        .catch(() => null);

    return cached || fetchPromise || new Response('Offline', { status: 503 });
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function isProtectedNavigation(pathname) {
    return PROTECTED_NAVIGATION_ROUTES.some(route =>
        pathname === route || pathname.startsWith(route + '/')
    );
}

function shouldNeverCache(pathname) {
    return NEVER_CACHE_PATTERNS.some(pattern => pathname.startsWith(pattern));
}

function isRuntimeCacheable(pathname) {
    return RUNTIME_CACHE_ALLOWLIST.some(pattern => pathname.startsWith(pattern));
}

function isStaticAsset(pathname) {
    return pathname.startsWith('/_next/static/') ||
        (pathname.endsWith('.js') && pathname.includes('/_next/')) ||
        (pathname.endsWith('.css') && pathname.includes('/_next/')) ||
        pathname.endsWith('.woff2') ||
        pathname.endsWith('.woff') ||
        pathname.endsWith('.ttf');
}

/**
 * Check if response is safe to cache
 * Rejects responses with Set-Cookie headers
 */
function isSafeToCache(response) {
    // Never cache responses with cookies
    if (response.headers.has('Set-Cookie')) {
        return false;
    }

    // Never cache HTML (navigation should use navigationNetworkOnly)
    const contentType = response.headers.get('Content-Type') || '';
    if (contentType.includes('text/html')) {
        return false;
    }

    return response.status === 200;
}
