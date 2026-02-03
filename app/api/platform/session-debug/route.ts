/**
 * Session Debug API — Phase 5.4
 * 
 * Protected endpoint for admins to debug auth state.
 * Returns session info WITHOUT exposing secrets.
 * 
 * @route GET /api/platform/session-debug
 * @access Protected (requires auth)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth/server';
import { ApiSuccessResponse, ApiErrorResponse } from '@/lib/api';

export async function GET(request: NextRequest) {
    try {
        // Check auth first
        const auth = await getAuthContext();

        // Cookie checks (before auth requirement for diagnostic purposes)
        const hasSessionCookie = request.cookies.has('__session');
        const hasLocaleCookie = request.cookies.has('NEXT_LOCALE');

        // Must be authenticated to see debug info
        if (!auth) {
            return ApiErrorResponse.unauthorized();
        }

        // Environment flags (SAFE - no secrets)
        const envInfo = {
            nodeEnv: process.env.NODE_ENV || 'unknown',
            vercelEnv: process.env.VERCEL_ENV || 'unknown',
            // Only show if bypass is configured, not the actual value
            devBypassConfigured: !!process.env.AUTH_DEV_BYPASS,
            // Show if bypass would be ACTIVE (considering production lock)
            devBypassActive: isDevBypassActive(),
        };

        // Request info
        const requestInfo = {
            host: request.headers.get('host') || 'unknown',
            userAgent: request.headers.get('user-agent')?.substring(0, 100) || 'unknown',
            ip: request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown',
        };

        // Session info
        const sessionInfo = {
            isAuth: true,
            userId: auth.uid,
            email: auth.email || null,
            hasSessionCookie,
            hasLocaleCookie,
        };

        return ApiSuccessResponse.ok({
            session: sessionInfo,
            environment: envInfo,
            request: requestInfo,
            timestamp: new Date().toISOString(),
            note: 'This endpoint is for debugging auth issues. Do not share this information publicly.',
        });

    } catch (error) {
        console.error('[session-debug] Error:', error);
        return ApiErrorResponse.internalError();
    }
}

/**
 * Check if dev bypass is actually active
 * CRITICAL: Returns false in production regardless of config
 */
function isDevBypassActive(): boolean {
    const isProduction =
        process.env.NODE_ENV === 'production' ||
        process.env.VERCEL_ENV === 'production';

    // LOCKED: Never active in production
    if (isProduction) {
        return false;
    }

    return process.env.AUTH_DEV_BYPASS === 'true';
}
