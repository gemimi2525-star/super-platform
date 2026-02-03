/**
 * Platform Me API
 * 
 * GET - Returns current user context (uid, email, role, orgs)
 */

import { getAuthContext } from '@/lib/auth/server';
import { ApiSuccessResponse, ApiErrorResponse } from '@/lib/api';
import { handleError } from '@super-platform/core';

export const runtime = 'nodejs';

// Inline collection constant to avoid webpack path resolution issues
const COLLECTION_PLATFORM_USERS = 'platform_users';

export async function GET() {
    try {
        const auth = await getAuthContext();

        if (!auth) {
            return ApiErrorResponse.unauthorized();
        }

        // Check Firestore for platform_users collection
        const { getAdminFirestore } = await import('@/lib/firebase-admin');
        const db = getAdminFirestore();

        const platformUserDoc = await db.collection(COLLECTION_PLATFORM_USERS).doc(auth.uid).get();

        if (platformUserDoc.exists) {
            const data = platformUserDoc.data();
            return ApiSuccessResponse.ok({
                uid: auth.uid,
                email: auth.email,
                isPlatformUser: true,
                role: data?.role || 'user',
                displayName: data?.displayName || null,
                permissions: data?.permissions || [],
                enabled: data?.enabled !== false,
                createdAt: data?.createdAt?.toDate?.()?.toISOString() || null,
                lastLogin: data?.lastLogin?.toDate?.()?.toISOString() || null,
            });
        }

        // User exists in Firebase Auth but not in platform_users
        return ApiSuccessResponse.ok({
            uid: auth.uid,
            email: auth.email,
            isPlatformUser: false,
            role: null,
            displayName: null,
            permissions: [],
            enabled: false,
        });

    } catch (error) {
        const appError = handleError(error as Error);
        console.error(`[API] Failed to check platform user [${appError.errorId}]:`, appError.message);
        return ApiErrorResponse.internalError();
    }
}
