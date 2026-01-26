/**
 * Platform Users API
 * 
 * Check if user is a platform user and their role
 */

import { getAuthContext } from '@/lib/auth/server';
import { ApiSuccessResponse, ApiErrorResponse } from '@/lib/api';
import { handleError } from '@super-platform/core';

export async function GET() {
    try {
        const auth = await getAuthContext();

        if (!auth) {
            return ApiErrorResponse.unauthorized();
        }

        // Check Firestore for platform_users collection
        const { getAdminFirestore } = await import('@/lib/firebase-admin');
        const db = getAdminFirestore();

        const platformUserDoc = await db.collection('platform_users').doc(auth.uid).get();

        if (platformUserDoc.exists) {
            const data = platformUserDoc.data();
            return ApiSuccessResponse.ok({
                isPlatformUser: true,
                role: data?.role || 'platform_admin',
                enabled: data?.enabled !== false, // default true if not set
            });
        }

        return ApiSuccessResponse.ok({
            isPlatformUser: false,
            role: null,
            enabled: false,
        });

    } catch (error) {
        const appError = handleError(error as Error);
        console.error(`[API] Failed to check platform user [${appError.errorId}]:`, appError.message);
        return ApiErrorResponse.internalError();
    }
}
