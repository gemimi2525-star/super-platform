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
        // ═══════════════════════════════════════════════════════════════════════════
        // PHASE 9.9: DEV BYPASS — Check FIRST before auth (same pattern as Users API)
        // ═══════════════════════════════════════════════════════════════════════════
        if (process.env.NODE_ENV === 'development' && process.env.AUTH_DEV_BYPASS === 'true') {
            console.log('[API:Me] Dev bypass mode - returning mock user profile');
            return ApiSuccessResponse.ok({
                uid: 'o8peRpxaqrNtyz7NYocN4cujvhR2',
                email: 'test1@apicoredata.local',
                isPlatformUser: true,
                role: 'owner',
                displayName: 'Platform Owner (Dev Bypass)',
                permissions: ['platform:audit:read', 'org.manage', 'orgs.view', 'ops.center.view'],
                enabled: true,
                createdAt: '2025-01-01T00:00:00.000Z',
                lastLogin: new Date().toISOString(),
                // Phase 10.0: Auth mode indicator
                authMode: 'DEV_BYPASS',
            });
        }

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
                // Phase 10.0: Auth mode indicator
                authMode: 'REAL',
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
            // Phase 10.0: Auth mode indicator
            authMode: 'REAL',
        });

    } catch (error) {
        const appError = handleError(error as Error);
        console.error(`[API] Failed to check platform user [${appError.errorId}]:`, appError.message);
        return ApiErrorResponse.internalError();
    }
}
