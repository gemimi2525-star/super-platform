/**
 * Session Management API
 * 
 * Bridge ระหว่าง Firebase Client SDK (localStorage) กับ Server-side Auth (cookie)
 * 
 * POST: รับ ID token แล้วสร้าง session cookie
 * DELETE: ลบ session cookie (logout)
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ApiSuccessResponse, ApiErrorResponse, validateRequest } from '@/lib/api';

// Cookie settings
const COOKIE_NAME = '__session';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 5; // 5 days in seconds

// Check if Firebase Admin is configured
const IS_ADMIN_CONFIGURED = !!(
    process.env.FIREBASE_PROJECT_ID ||
    process.env.FIREBASE_SERVICE_ACCOUNT
);

// Validation schema
const createSessionSchema = z.object({
    idToken: z.string().min(1, 'ID token is required'),
});

/**
 * POST /api/auth/session
 * สร้าง session cookie จาก ID token
 * 
 * NORMALIZED: Always uses createSessionCookie() for both DEV and PROD
 * This ensures verifySessionCookie() works correctly without fallback
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate request body
        const validation = validateRequest(createSessionSchema, body);
        if (!validation.success) {
            return ApiErrorResponse.validationError(validation.errors);
        }

        const { idToken } = validation.data;

        // ============================================================
        // SECURITY: Block AUTH_DEV_BYPASS in production
        // ============================================================
        if (process.env.NODE_ENV === 'production' && process.env.AUTH_DEV_BYPASS === 'true') {
            console.error('[Session API] 🚨 SECURITY: AUTH_DEV_BYPASS blocked in production!');
            return ApiErrorResponse.unauthorized('Invalid configuration');
        }

        // ============================================================
        // Dev-Only Test Harness (with test headers only)
        // ============================================================
        if (process.env.NODE_ENV === 'development' && process.env.AUTH_DEV_BYPASS === 'true') {
            const devTestEmail = request.headers.get('x-dev-test-email');
            const devTestRole = request.headers.get('x-dev-test-role');

            // Only use test harness if explicit test headers are provided
            if (devTestEmail || devTestRole) {
                console.info('[Session API] 🧪 Test harness: Creating mock session');

                const allowedRoles = ['owner', 'admin', 'user'];
                const sanitizedRole = devTestRole?.toLowerCase() || 'user';
                const finalRole = allowedRoles.includes(sanitizedRole) ? sanitizedRole : 'user';

                const testPayload = {
                    sub: `dev_${Date.now()}`,
                    email: devTestEmail || `${finalRole}@test.com`,
                    user_id: `dev_${Date.now()}`,
                };

                const encodedPayload = Buffer.from(JSON.stringify(testPayload)).toString('base64');
                const testToken = `eyJhbGciOiJub25lIn0.${encodedPayload}.`;

                const response = ApiSuccessResponse.ok({
                    message: 'Test session created',
                    testMode: true,
                    testIdentity: { email: testPayload.email, role: finalRole }
                });

                response.cookies.set(COOKIE_NAME, testToken, {
                    httpOnly: true,
                    secure: false,
                    sameSite: 'lax',
                    maxAge: COOKIE_MAX_AGE,
                    path: '/',
                });

                return response;
            }
            // No test headers → fall through to normal Firebase flow
        }

        // ============================================================
        // NORMAL FLOW: Create proper Firebase Session Cookie
        // Works for BOTH dev and prod (no more storing raw ID tokens)
        // ============================================================
        if (!IS_ADMIN_CONFIGURED) {
            console.error('[Session API] ❌ Firebase Admin not configured');
            return ApiErrorResponse.internalError();
        }

        try {
            const { getAdminAuth } = await import('@/lib/firebase-admin');
            const auth = getAdminAuth();

            // Verify the ID token first
            const decodedToken = await auth.verifyIdToken(idToken);

            // Create a proper session cookie (valid for 5 days)
            const expiresIn = COOKIE_MAX_AGE * 1000; // Convert to milliseconds
            const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });

            console.info(`[Session API] ✅ Session created for: ${decodedToken.email}`);

            // Set the session cookie
            const response = ApiSuccessResponse.ok({ message: 'Session created' });
            response.cookies.set(COOKIE_NAME, sessionCookie, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: COOKIE_MAX_AGE,
                path: '/',
            });

            return response;

        } catch (error: any) {
            const errorCode = error?.code || error?.errorInfo?.code || 'unknown';
            console.error(`[Session API] Session creation failed (${errorCode}):`, error?.message || error);
            return ApiErrorResponse.unauthorized('Invalid token or session creation failed');
        }

    } catch (error) {
        console.error('[Session API] Unexpected error:', error);
        return ApiErrorResponse.internalError();
    }
}

/**
 * DELETE /api/auth/session
 * ลบ session cookie (logout)
 */
export async function DELETE() {
    const response = ApiSuccessResponse.ok({ message: 'Session deleted' });

    response.cookies.set(COOKIE_NAME, '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0, // ลบทันที
        path: '/',
    });

    // console.log('[Session API] Session cookie deleted');
    return response;
}
