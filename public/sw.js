/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NEXUS Shell — Service Worker (Phase 36 — Offline Kernel Layer)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Full offline capability for CORE OS.
 * Supports app shell caching, safe API caching, and navigation caching.
 * 
 * ⚠️ CRITICAL SECURITY:
 * - NEVER cache auth/session/governance APIs
 * - Navigation HTML cached ONLY after successful auth (200 + no redirect)
 * - No secrets, tokens, or PII in cache
 * - Offline fallback is read-only
 * 
 * Cache Strategy:
 * - Precache: offline.html, manifest.json
 * - Navigation (/os, /ops): network-first, cache fallback
 * - Static assets (/_next/static/**): cache-first
 * - ALL API routes: NEVER cache (network-only)
 * - Sensitive endpoints: NEVER cache (bypass SW)
 * 
 * @version 36.1.0
 */

// ═══════════════════════════════════════════════════════════════════════════
// DETERMINISTIC VERSIONING
// ═══════════════════════════════════════════════════════════════════════════

const SW_VERSION = '36.1.0';
const PRECACHE_NAME = 'coreos-precache-' + SW_VERSION;
const STATIC_CACHE = 'coreos-static-' + SW_VERSION;
const NAV_CACHE = 'coreos-nav-' + SW_VERSION;

/** All valid cache names for this version — used during activate purge */
const VALID_CACHES = [PRECACHE_NAME, STATIC_CACHE, NAV_CACHE];

// ═══════════════════════════════════════════════════════════════════════════
// CACHE ALLOWLIST (EXPLICIT ONLY)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Assets to precache on install
 */
const PRECACHE_ASSETS = [
    '/offline.html',
    '/manifest.json',
];

/**
 * Navigation routes eligible for caching (network-first)
 * Only cached AFTER successful auth response
 */
const CACHEABLE_NAVIGATION = [
    '/os',
    '/ops',
];

/**
 * URL prefix patterns that must NEVER be cached.
 * Uses startsWith matching — covers all sub-routes.
 */
const NEVER_CACHE_PATTERNS = [
    // ALL API routes — owner-only, redacted, or sensitive
    '/api/ops',
    '/api/os',       // Phase 18: Notification audit routes
    '/api/platform',
    '/api/auth',
    '/api/build-info',
    '/api/trust',
    '/api/governance',
    '/api/brain',

    // Auth Pages
    '/login',
    '/logout',
    '/auth',
];

// ═══════════════════════════════════════════════════════════════════════════
// INSTALL EVENT
// ═══════════════════════════════════════════════════════════════════════════

self.addEventListener('install', (event) => {
    console.log('[NEXUS SW] Installing v' + SW_VERSION);

    event.waitUntil(
        caches.open(PRECACHE_NAME)
            .then((cache) => {
                console.log('[NEXUS SW] Precaching core assets');
                return cache.addAll(PRECACHE_ASSETS);
            })
            .then(() => {
                console.log('[NEXUS SW] Precache complete, skip waiting');
                return self.skipWaiting();
            })
            .catch((err) => {
                console.error('[NEXUS SW] Precache failed:', err);
            })
    );
});

// ═══════════════════════════════════════════════════════════════════════════
// ACTIVATE EVENT — Purge old caches + claim clients
// ═══════════════════════════════════════════════════════════════════════════

self.addEventListener('activate', (event) => {
    console.log('[NEXUS SW] Activating v' + SW_VERSION);

    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => !VALID_CACHES.includes(name))
                        .map((name) => {
                            console.log('[NEXUS SW] Purging old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => {
                console.log('[NEXUS SW] All old caches purged. Claiming clients.');
                return self.clients.claim();
            })
    );
});

// ═══════════════════════════════════════════════════════════════════════════
// MESSAGE EVENT — SW Control
// ═══════════════════════════════════════════════════════════════════════════

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        console.log('[NEXUS SW] Received SKIP_WAITING, activating v' + SW_VERSION);
        self.skipWaiting();
    }
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

    // ─────────────────────────────────────────────────────────────────────
    // PRIORITY 1: NAVIGATION REQUESTS
    // ─────────────────────────────────────────────────────────────────────
    if (request.mode === 'navigate') {
        // OAuth redirects — NEVER cache
        if (url.searchParams.has('callbackUrl')) {
            return;
        }

        // Cacheable navigation (/os, /ops) — network-first with cache fallback
        if (isCacheableNavigation(url.pathname)) {
            event.respondWith(navigationNetworkFirst(request, url.pathname));
            return;
        }

        // Other navigation — network-only with offline fallback
        event.respondWith(navigationNetworkOnly(request));
        return;
    }

    // ─────────────────────────────────────────────────────────────────────
    // PRIORITY 2: NEVER CACHE — Sensitive endpoints (ALL APIs)
    // ─────────────────────────────────────────────────────────────────────
    if (shouldNeverCache(url.pathname)) {
        return; // Bypass SW completely — network only
    }

    // ─────────────────────────────────────────────────────────────────────
    // PRIORITY 3: STATIC ASSETS — Cache first
    // ─────────────────────────────────────────────────────────────────────
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
 * Navigation: Network-First with Cache Fallback
 * Used for /os and /ops — cache the HTML only after successful auth load
 * On failure, serve cached version or offline fallback
 */
async function navigationNetworkFirst(request, pathname) {
    const navCache = await caches.open(NAV_CACHE);

    try {
        const response = await fetch(request);

        // Cache ONLY if:
        // 1. Response is 200 OK
        // 2. No redirect (prevents caching login page as /os)
        // 3. Content-Type is HTML
        if (
            response.ok &&
            !response.redirected &&
            (response.headers.get('Content-Type') || '').includes('text/html')
        ) {
            console.log('[NEXUS SW] Caching navigation: ' + pathname);
            navCache.put(request, response.clone());
        }

        return response;
    } catch {
        // Network failed — try cached version
        console.log('[NEXUS SW] Network failed for ' + pathname + ', trying cache');
        const cached = await navCache.match(request);

        if (cached) {
            console.log('[NEXUS SW] Serving cached navigation: ' + pathname);
            return cached;
        }

        // No cache — serve offline fallback
        console.log('[NEXUS SW] No cache available, serving offline fallback');
        const cache = await caches.open(PRECACHE_NAME);
        const offlinePage = await cache.match('/offline.html');

        return offlinePage || new Response(
            '<!DOCTYPE html><html><head><title>Offline</title></head><body style="font-family:system-ui;text-align:center;padding:50px;background:#1a1a2e;color:#fff;"><h1>⚡ Offline</h1><p>CORE OS requires a network connection for first load.</p><button onclick="location.reload()" style="padding:12px 32px;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.2);color:#fff;border-radius:8px;cursor:pointer;font-size:14px;">Retry</button></body></html>',
            { status: 503, headers: { 'Content-Type': 'text/html' } }
        );
    }
}

/**
 * Navigation: Network ONLY — Never cache HTML
 * For non-OS routes, offline fallback on failure
 */
async function navigationNetworkOnly(request) {
    try {
        return await fetch(request);
    } catch {
        console.log('[NEXUS SW] Navigation offline, serving fallback');
        const cache = await caches.open(PRECACHE_NAME);
        const offlinePage = await cache.match('/offline.html');

        return offlinePage || new Response(
            '<!DOCTYPE html><html><head><title>Offline</title></head><body style="font-family:system-ui;text-align:center;padding:50px;background:#1a1a2e;color:#fff;"><h1>⚡ Offline</h1><p>Please check your connection.</p><button onclick="location.reload()" style="padding:12px 32px;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.2);color:#fff;border-radius:8px;cursor:pointer;font-size:14px;">Retry</button></body></html>',
            { status: 503, headers: { 'Content-Type': 'text/html' } }
        );
    }
}

/**
 * Cache first, fallback to network
 * For static assets (JS/CSS/fonts/images)
 */
async function cacheFirst(request) {
    const cache = await caches.open(STATIC_CACHE);
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

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function isCacheableNavigation(pathname) {
    return CACHEABLE_NAVIGATION.some(route =>
        pathname === route || pathname.startsWith(route + '/')
    );
}

function shouldNeverCache(pathname) {
    return NEVER_CACHE_PATTERNS.some(pattern => pathname.startsWith(pattern));
}

function isStaticAsset(pathname) {
    return pathname.startsWith('/_next/static/') ||
        (pathname.endsWith('.js') && pathname.includes('/_next/')) ||
        (pathname.endsWith('.css') && pathname.includes('/_next/')) ||
        pathname.endsWith('.woff2') ||
        pathname.endsWith('.woff') ||
        pathname.endsWith('.ttf') ||
        pathname.endsWith('.png') ||
        pathname.endsWith('.jpg') ||
        pathname.endsWith('.svg') ||
        pathname.endsWith('.ico');
}

/**
 * Check if response is safe to cache
 */
function isSafeToCache(response) {
    // Never cache responses with cookies
    if (response.headers.has('Set-Cookie')) {
        return false;
    }

    // For non-API responses, allow caching
    return response.status === 200;
}
