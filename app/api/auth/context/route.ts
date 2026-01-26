/**
 * API: Get Auth Context
 * Returns current user's decoded token claims
 * Used by QA route for testing AND login session verification
 */

import { NextRequest } from 'next/server';
import { getAuthContext } from '@/lib/auth/server';
import { ApiSuccessResponse, ApiErrorResponse } from '@/lib/api';

export async function GET(request: NextRequest) {
    try {
        // Try to get auth context from session cookie (most common during login)
        const context = await getAuthContext();

        if (context) {
            return ApiSuccessResponse.ok({
                uid: context.uid,
                email: context.email,
                role: context.role,
                orgId: context.orgId
            });
        }

        // Fallback: Try Authorization header (for API testing)
        const authHeader = request.headers.get('authorization');
        if (authHeader?.startsWith('Bearer ')) {
            const { verifyIdToken } = await import('@/lib/firebase-admin');
            const token = authHeader.substring(7);
            const decoded = await verifyIdToken(token);

            return ApiSuccessResponse.ok({
                uid: decoded.uid,
                email: decoded.email,
                role: decoded.role || 'org_member',
                orgId: decoded.orgId
            });
        }

        // No valid auth method found
        return ApiErrorResponse.unauthorized('No authentication found');
    } catch (error: any) {
        console.error('[Auth Context API] Error:', error);
        return ApiErrorResponse.unauthorized();
    }
}
