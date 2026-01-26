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

        // 1. Priority: Verify with Firebase Admin (if configured)
        if (IS_ADMIN_CONFIGURED) {
            try {
                const { verifyIdToken } = await import('@/lib/firebase-admin');
                await verifyIdToken(idToken);
            } catch (error) {
                console.error('[Session API] Invalid token:', error);
                return ApiErrorResponse.unauthorized('Invalid token');
            }

            // 2. Fallback: Dev Mode Bypass (only if explicitly enabled)
            // Note: Removed NODE_ENV check to allow AUTH_DEV_BYPASS to work in local production builds
        } else if (process.env.AUTH_DEV_BYPASS === 'true') {
            console.warn('[Session API] ⚠️ DEV MODE: Skipping token verification (AUTH_DEV_BYPASS=true)');

            // 3. Error: No verification method available
        } else {
            console.error('[Session API] ❌ Setup Error: Firebase Admin not configured and AUTH_DEV_BYPASS not enabled.');
            return ApiErrorResponse.internalError();
        }

        // สร้าง session cookie
        const response = ApiSuccessResponse.ok({ message: 'Session created' });

        response.cookies.set(COOKIE_NAME, idToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: COOKIE_MAX_AGE,
            path: '/',
        });

        // console.log('[Session API] Session cookie created successfully');
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
