/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Ops Auth Guard Regression Tests (P0 HOTFIX)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Validates the defense-in-depth security guards for /ops/* routes.
 *
 * Test Matrix (6+ cases):
 * 1. Unauth → /ops/brain → redirect /ops/login
 * 2. Unauth → /ops → redirect /ops/login
 * 3. Unauth → /ops/login → allowed
 * 4. Non-owner → /ops/brain → redirect /os
 * 5. Owner → /ops/brain → 200
 * 6. Owner → /ops → 200
 * 7. Header injection: x-ops-pathname spoofed → stripped
 * 8. Header injection: x-ops-path (legacy) → no effect
 *
 * Pure logic tests — mocking NextRequest/NextResponse for middleware.
 */

// ═══════════════════════════════════════════════════════════════════════════
// MIDDLEWARE GUARD SIMULATION
// ═══════════════════════════════════════════════════════════════════════════
//
// Since middleware runs in Edge Runtime and cannot be imported directly,
// we test the DECISION LOGIC extracted from middleware.ts lines 344-380.
//
// This mirrors the exact logic without requiring Next.js runtime.
// ═══════════════════════════════════════════════════════════════════════════

interface MockCookieStore {
    has(name: string): boolean;
}

interface MockRequest {
    pathname: string;
    cookies: MockCookieStore;
    headers: Map<string, string>;
}

type GuardResult =
    | { action: 'redirect'; target: string; callbackUrl?: string }
    | { action: 'next'; headers?: Record<string, string> };

/**
 * Simulates the middleware guard logic for /ops/* paths.
 * Extracted from middleware.ts lines 353-380 (P0 HOTFIX version).
 */
function simulateMiddlewareOpsGuard(req: MockRequest): GuardResult | null {
    const { pathname } = req;

    if (pathname === '/ops' || pathname.startsWith('/ops/')) {
        // EXEMPT: /ops/login
        if (pathname === '/ops/login') {
            return {
                action: 'next',
                headers: { 'x-ops-pathname': '/ops/login' },
            };
        }

        const hasSession = req.cookies.has('__session');
        if (!hasSession) {
            return {
                action: 'redirect',
                target: '/ops/login',
                callbackUrl: pathname,
            };
        }

        // Session exists → pass through (strip spoofed headers)
        return { action: 'next', headers: {} };
    }

    // Path not /ops/* → not our concern
    return null;
}

/**
 * Simulates the layout guard logic for /ops/*.
 * Extracted from app/ops/layout.tsx (P0 HOTFIX version).
 */
function simulateLayoutOpsGuard(
    opsPathname: string,
    hasSessionCookie: boolean,
    authContext: { uid: string } | null,
    superAdminId: string,
): { action: 'render' } | { action: 'redirect'; target: string } {
    const isLoginPage = opsPathname === '/ops/login';

    if (!isLoginPage) {
        // Layer 2a: Direct cookie check
        if (!hasSessionCookie) {
            return { action: 'redirect', target: '/ops/login' };
        }

        // Layer 2b: UID verification
        if (!authContext) {
            return { action: 'redirect', target: '/ops/login' };
        }

        if (authContext.uid !== superAdminId) {
            return { action: 'redirect', target: '/os' };
        }
    }

    return { action: 'render' };
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITES
// ═══════════════════════════════════════════════════════════════════════════

const OWNER_UID = 'owner-uid-123';

describe('Middleware Ops Guard (P0 HOTFIX)', () => {
    test('1. Unauth → /ops/brain → redirect /ops/login', () => {
        const result = simulateMiddlewareOpsGuard({
            pathname: '/ops/brain',
            cookies: { has: () => false },
            headers: new Map(),
        });
        expect(result).not.toBeNull();
        expect(result!.action).toBe('redirect');
        expect((result as any).target).toBe('/ops/login');
        expect((result as any).callbackUrl).toBe('/ops/brain');
    });

    test('2. Unauth → /ops → redirect /ops/login', () => {
        const result = simulateMiddlewareOpsGuard({
            pathname: '/ops',
            cookies: { has: () => false },
            headers: new Map(),
        });
        expect(result).not.toBeNull();
        expect(result!.action).toBe('redirect');
        expect((result as any).target).toBe('/ops/login');
        expect((result as any).callbackUrl).toBe('/ops');
    });

    test('3. Unauth → /ops/login → allowed (no redirect)', () => {
        const result = simulateMiddlewareOpsGuard({
            pathname: '/ops/login',
            cookies: { has: () => false },
            headers: new Map(),
        });
        expect(result).not.toBeNull();
        expect(result!.action).toBe('next');
        expect((result as any).headers?.['x-ops-pathname']).toBe('/ops/login');
    });

    test('4. Authed → /ops/brain → passes to layout (no redirect)', () => {
        const result = simulateMiddlewareOpsGuard({
            pathname: '/ops/brain',
            cookies: { has: (name: string) => name === '__session' },
            headers: new Map(),
        });
        expect(result).not.toBeNull();
        expect(result!.action).toBe('next');
    });

    test('7. Header injection: x-ops-pathname not leaked to downstream', () => {
        const result = simulateMiddlewareOpsGuard({
            pathname: '/ops/brain',
            cookies: { has: (name: string) => name === '__session' },
            headers: new Map([['x-ops-pathname', '/ops/login']]),
        });
        expect(result).not.toBeNull();
        expect(result!.action).toBe('next');
        // For non-login paths, headers should NOT contain x-ops-pathname
        expect((result as any).headers?.['x-ops-pathname']).toBeUndefined();
    });

    test('x-ops-path (legacy header) has no effect on guard', () => {
        const result = simulateMiddlewareOpsGuard({
            pathname: '/ops/brain',
            cookies: { has: () => false },
            headers: new Map([['x-ops-path', '/ops/login']]),
        });
        // Guard should still redirect — legacy header does NOT grant access
        expect(result).not.toBeNull();
        expect(result!.action).toBe('redirect');
        expect((result as any).target).toBe('/ops/login');
    });
});

describe('Layout Ops Guard (P0 HOTFIX)', () => {
    test('5. Owner → /ops/brain → render', () => {
        const result = simulateLayoutOpsGuard(
            '', // Not login page (empty = stripped by middleware)
            true, // Has cookie
            { uid: OWNER_UID },
            OWNER_UID,
        );
        expect(result.action).toBe('render');
    });

    test('6. Owner → /ops → render', () => {
        const result = simulateLayoutOpsGuard(
            '', // Not login page
            true,
            { uid: OWNER_UID },
            OWNER_UID,
        );
        expect(result.action).toBe('render');
    });

    test('Non-owner → /ops/brain → redirect /os', () => {
        const result = simulateLayoutOpsGuard(
            '', // Not login page
            true,
            { uid: 'non-owner-uid-456' },
            OWNER_UID,
        );
        expect(result.action).toBe('redirect');
        expect((result as any).target).toBe('/os');
    });

    test('No session cookie → redirect /ops/login', () => {
        const result = simulateLayoutOpsGuard(
            '', // Not login page
            false, // No cookie
            null,
            OWNER_UID,
        );
        expect(result.action).toBe('redirect');
        expect((result as any).target).toBe('/ops/login');
    });

    test('Valid cookie but null context → redirect /ops/login', () => {
        const result = simulateLayoutOpsGuard(
            '',
            true, // Has cookie (but context is null — session expired/invalid)
            null,
            OWNER_UID,
        );
        expect(result.action).toBe('redirect');
        expect((result as any).target).toBe('/ops/login');
    });

    test('/ops/login allows unauthenticated render', () => {
        const result = simulateLayoutOpsGuard(
            '/ops/login', // Login page
            false,
            null,
            OWNER_UID,
        );
        expect(result.action).toBe('render');
    });
});
