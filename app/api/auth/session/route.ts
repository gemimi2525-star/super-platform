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
        // PATCH A: Dev-Only Test Harness with Production Guards
        // ============================================================
        // CRITICAL: Production Guard - FORCE real verification in production
        if (process.env.NODE_ENV === 'production' && process.env.AUTH_DEV_BYPASS === 'true') {
            console.error('[Session API] 🚨 SECURITY: AUTH_DEV_BYPASS blocked in production!');
            return ApiErrorResponse.unauthorized('Invalid configuration');
        }

        // Dev-Only Test Harness: Accept test identity from headers
        if (process.env.NODE_ENV === 'development' && process.env.AUTH_DEV_BYPASS === 'true') {
            console.warn('[Session API] ⚠️ DEV MODE: Test harness enabled (AUTH_DEV_BYPASS=true)');

            // Check for dev test headers
            const devTestEmail = request.headers.get('x-dev-test-email');
            const devTestRole = request.headers.get('x-dev-test-role');

            if (devTestEmail || devTestRole) {
                // Sanitize and validate role
                const allowedRoles = ['owner', 'admin', 'user'];
                const sanitizedRole = devTestRole?.toLowerCase() || 'user';

                if (!allowedRoles.includes(sanitizedRole)) {
                    console.warn(`[Session API] Invalid dev role: ${devTestRole}, defaulting to 'user'`);
                }

                const finalRole = allowedRoles.includes(sanitizedRole) ? sanitizedRole : 'user';

                console.warn(`[Session API] 🧪 Test Identity: ${devTestEmail || 'test@example.com'} (${finalRole})`);

                // Create a test token that will be recognized by lib/auth/server.ts
                // Format: base64(header).base64(payload).signature
                const testPayload = {
                    sub: `dev_${Date.now()}`,
                    email: devTestEmail || `${finalRole}@test.com`,
                    user_id: `dev_${Date.now()}`,
                    // Store role hint in email for server.ts pattern matching
                };

                const encodedPayload = Buffer.from(JSON.stringify(testPayload)).toString('base64');
                const testToken = `eyJhbGciOiJub25lIn0.${encodedPayload}.`;

                // Create session with test token
                const response = ApiSuccessResponse.ok({
                    message: 'Test session created',
                    testMode: true,
                    testIdentity: { email: testPayload.email, role: finalRole }
                });

                response.cookies.set(COOKIE_NAME, testToken, {
                    httpOnly: true,
                    secure: false, // Dev only
                    sameSite: 'lax',
                    maxAge: COOKIE_MAX_AGE,
                    path: '/',
                });

                return response;
            }

            // No test headers, proceed with bypass mode (existing behavior)
            console.warn('[Session API] ⚠️ DEV MODE: Skipping token verification (no test headers)');

            // Verify with Firebase Admin (if configured)
        } else if (IS_ADMIN_CONFIGURED) {
            try {
                const { verifyIdToken } = await import('@/lib/firebase-admin');
                await verifyIdToken(idToken);
            } catch (error) {
                console.error('[Session API] Invalid token:', error);
                return ApiErrorResponse.unauthorized('Invalid token');
            }

            // Error: No verification method available
        } else {
            console.error('[Session API] ❌ Setup Error: Firebase Admin not configured and AUTH_DEV_BYPASS not enabled.');
            return ApiErrorResponse.internalError();
        }

        // สร้าง session cookie (normal flow)
        const response = ApiSuccessResponse.ok({ message: 'Session created' });

        response.cookies.set(COOKIE_NAME, idToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: COOKIE_MAX_AGE,
            path: '/',
        });

        return response;

    } catch (error) {
        console.error('[Session API] Error:', error);
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
