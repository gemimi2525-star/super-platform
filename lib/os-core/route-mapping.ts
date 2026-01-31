/**
 * ═══════════════════════════════════════════════════════════════════════════
 * APICOREDATA OS — Route Mapping (Single Source of Truth)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * PHASE 8.0: OS Single-Desktop Restructure
 * 
 * This file defines THE ONLY canonical route mapping for the entire OS.
 * All redirects, links, and navigation MUST reference this file.
 * 
 * RULES:
 * 1. `/desktop` is the ONLY canonical route after login
 * 2. All apps open via `?app=` query params
 * 3. No direct app routes (e.g., /users, /orgs) — they must redirect
 * 
 * @version 1.0.0
 * @date 2026-01-29
 */

// ═══════════════════════════════════════════════════════════════════════════
// CANONICAL ROUTE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * The ONE AND ONLY canonical route for the OS Desktop.
 * All authenticated users land here after login.
 */
export const OS_CANONICAL_ROUTE = '/desktop';

// ═══════════════════════════════════════════════════════════════════════════
// APP ID DEFINITION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Valid app IDs for the OS.
 * Used in `?app=...` query param.
 */
export type OSAppId =
    | 'os-home'     // Default desktop (no app open)
    | 'users'       // User Management
    | 'orgs'        // Organization Management
    | 'audit'       // Audit Logs
    | 'settings';   // System Settings

/**
 * Default app when no `?app=` is specified.
 */
export const OS_DEFAULT_APP: OSAppId = 'os-home';

// ═══════════════════════════════════════════════════════════════════════════
// LEGACY ROUTE MAPPING (For Redirects)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Maps legacy routes to the new canonical format.
 * Used by middleware and redirects.
 * 
 * Example:
 * - Input: '/home' → Output: '/desktop'
 * - Input: '/v2/users' → Output: '/desktop?app=users'
 */
export const LEGACY_ROUTE_MAP: Record<string, string> = {
    // Root routes
    '/': '/desktop',
    '/home': '/desktop',
    '/v2': '/desktop',
    '/platform': '/desktop',

    // App routes
    '/users': '/desktop?app=users',
    '/v2/users': '/desktop?app=users',
    '/organizations': '/desktop?app=orgs',
    '/orgs': '/desktop?app=orgs',
    '/v2/orgs': '/desktop?app=orgs',
    '/audit-logs': '/desktop?app=audit',
    '/v2/audit-logs': '/desktop?app=audit',
    '/settings': '/desktop?app=settings',
    '/v2/settings': '/desktop?app=settings',
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Resolves a legacy route to the new canonical format.
 * Preserves locale prefix.
 * 
 * @param path - Full path including locale (e.g., '/en/home')
 * @returns Canonical path (e.g., '/en/desktop')
 */
export function resolveCanonicalRoute(path: string): string {
    // Extract locale
    const localeMatch = path.match(/^\/([a-z]{2})(\/.*)?$/);
    if (!localeMatch) {
        // No locale, use path directly
        const mapped = LEGACY_ROUTE_MAP[path];
        return mapped || path;
    }

    const locale = localeMatch[1];
    const pathWithoutLocale = localeMatch[2] || '/';

    // Check if path is already canonical
    if (pathWithoutLocale === '/desktop' || pathWithoutLocale.startsWith('/desktop?')) {
        return path;
    }

    // Look up mapping
    const mapped = LEGACY_ROUTE_MAP[pathWithoutLocale];
    if (mapped) {
        return `/${locale}${mapped}`;
    }

    return path;
}

/**
 * Builds a desktop URL with optional app query param.
 * 
 * @param locale - Current locale (e.g., 'en')
 * @param appId - Optional app ID to open
 * @returns Full URL (e.g., '/en/desktop?app=users')
 */
export function buildDesktopUrl(locale: string, appId?: OSAppId): string {
    if (!appId || appId === 'os-home') {
        return `/${locale}${OS_CANONICAL_ROUTE}`;
    }
    return `/${locale}${OS_CANONICAL_ROUTE}?app=${appId}`;
}

/**
 * Checks if a path is the canonical desktop route.
 */
export function isCanonicalDesktop(path: string): boolean {
    // Remove locale prefix
    const pathWithoutLocale = path.replace(/^\/[a-z]{2}/, '');
    return pathWithoutLocale === '/desktop' || pathWithoutLocale.startsWith('/desktop?');
}

/**
 * Checks if a path needs to be redirected to desktop.
 */
export function needsDesktopRedirect(path: string): boolean {
    if (isCanonicalDesktop(path)) return false;

    // Remove locale prefix
    const pathWithoutLocale = path.replace(/^\/[a-z]{2}/, '') || '/';

    return Object.keys(LEGACY_ROUTE_MAP).includes(pathWithoutLocale);
}
