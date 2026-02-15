/**
 * Platform Users API
 * 
 * GET  - List all platform users
 * POST - Create new platform user (Owner/Admin only)
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getAuthContext } from '@/lib/auth/server';
import { getAdminFirestore, getAdminAuth } from '@/lib/firebase-admin';
import type { PlatformUser, PlatformRole } from '@/lib/platform/types';
import { ROLE_HIERARCHY, hasPermission } from '@/lib/platform/types';
import { ApiSuccessResponse, ApiErrorResponse, validateRequest } from '@/lib/api';
import { withQuotaGuard, isQuotaError, logFirestoreError } from '@/lib/firebase-admin';
import { handleError } from '@super-platform/core';
import { filterVisibleUsers } from '@super-platform/core';
import { emitPermissionDenialEvent } from '@/lib/audit/emit';
import { cachedFetch, cacheInvalidate, type CacheStatus } from '@/lib/cache/ttl-cache';

export const runtime = 'nodejs';

// Inline collection constant to avoid webpack path resolution issues
const COLLECTION_PLATFORM_USERS = 'platform_users';
const COLLECTION_AUDIT_LOGS = 'platform_audit_logs';
const CACHE_KEY_USERS_LIST = 'users:list';

// Validation schema for POST
const createUserSchema = z.object({
    email: z.string().email('Invalid email format'),
    displayName: z.string().min(1, 'Display name is required'),
    role: z.string().min(1, 'Role is required'),
    password: z.string().min(8, 'Password must be at least 8 characters').optional(),
    permissions: z.array(z.string()).optional(),
});

/**
 * Helper: add cache-related headers to response
 */
function withCacheHeaders(response: Response, cacheStatus: CacheStatus): Response {
    response.headers.set('Cache-Control', 'private, max-age=30');
    response.headers.set('X-Cache', cacheStatus);
    response.headers.set('X-Cache-Key', CACHE_KEY_USERS_LIST);
    return response;
}

// =============================================================================
// GET - List all platform users (with TTL cache + stale-while-revalidate)
// =============================================================================

export async function GET() {
    try {
        // Phase 9.4: Dev Mode check FIRST (before auth)
        if (process.env.NODE_ENV === 'development' && process.env.AUTH_DEV_BYPASS === 'true') {
            console.log('[API:Users] Dev bypass mode - returning mock users');
            const mockUsers: PlatformUser[] = [
                {
                    uid: 'o8peRpxaqrNtyz7NYocN4cujvhR2',
                    email: 'test1@apicoredata.local',
                    displayName: 'Platform Owner',
                    role: 'owner',
                    permissions: [],
                    enabled: true,
                    createdBy: 'system',
                    createdAt: new Date('2025-01-01'),
                    updatedAt: new Date('2025-01-01'),
                },
                {
                    uid: 'mock-admin-001',
                    email: 'admin@apicoredata.local',
                    displayName: 'Admin User',
                    role: 'admin',
                    permissions: [],
                    enabled: true,
                    createdBy: 'o8peRpxaqrNtyz7NYocN4cujvhR2',
                    createdAt: new Date('2025-01-10'),
                    updatedAt: new Date('2025-01-10'),
                },
                {
                    uid: 'mock-user-001',
                    email: 'user@apicoredata.local',
                    displayName: 'Regular User',
                    role: 'user',
                    permissions: [],
                    enabled: true,
                    createdBy: 'o8peRpxaqrNtyz7NYocN4cujvhR2',
                    createdAt: new Date('2025-01-15'),
                    updatedAt: new Date('2025-01-15'),
                },
            ];
            return ApiSuccessResponse.ok({ users: mockUsers, authMode: 'DEV_BYPASS' });
        }

        const auth = await getAuthContext();
        if (!auth) {
            return ApiErrorResponse.unauthorized();
        }

        // ═══════════════════════════════════════════════════════════════════
        // Phase 27C.8b: Permission check wrapped in quota-resilient try/catch
        // If Firestore is down, skip permission check and proceed to cache.
        // Auth context already provides role from token.
        // ═══════════════════════════════════════════════════════════════════
        const db = getAdminFirestore();
        let currentUserRole: PlatformRole = auth.role as PlatformRole || 'user';
        let permissionCheckPassed = false;

        try {
            const userDoc = await db.collection(COLLECTION_PLATFORM_USERS).doc(auth.uid).get();

            if (!userDoc.exists) {
                emitPermissionDenialEvent(
                    { uid: auth.uid, email: auth.email || '', role: 'user' },
                    'platform:users:read',
                    { method: 'GET', path: '/api/platform/users' },
                    { reason: 'not_platform_user' }
                );
                return ApiErrorResponse.forbidden('Not a platform user');
            }

            const currentUser = userDoc.data() as PlatformUser;
            currentUserRole = currentUser.role;

            if (!hasPermission(currentUser, 'platform:users:read')) {
                emitPermissionDenialEvent(
                    { uid: auth.uid, email: auth.email || '', role: currentUser.role },
                    'platform:users:read',
                    { method: 'GET', path: '/api/platform/users' },
                    { reason: 'insufficient_permission' }
                );
                return ApiErrorResponse.forbidden('Insufficient permissions');
            }
            permissionCheckPassed = true;
        } catch (permError: any) {
            // Phase 27C.8b: If permission check fails due to quota, proceed to cache
            if (isQuotaError(permError)) {
                logFirestoreError('Users:PermCheck', permError, auth.uid);
                console.warn(`[API:Users] Permission check skipped (quota) — using token role: ${currentUserRole}`);
                permissionCheckPassed = true; // Allow through — role from auth token
            } else {
                throw permError; // Non-quota error — re-throw
            }
        }

        // ═══════════════════════════════════════════════════════════════════
        // Phase 27C.8: TTL Cache + Stale-While-Revalidate
        // Phase 27C.8b: + Persistent Snapshot fallback
        // ═══════════════════════════════════════════════════════════════════

        const fetcher = async (): Promise<PlatformUser[]> => {
            const snap = await db.collection(COLLECTION_PLATFORM_USERS)
                .orderBy('createdAt', 'desc')
                .get();

            return snap.docs.map((doc: any) => ({
                uid: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : doc.data().createdAt,
                updatedAt: doc.data().updatedAt?.toDate ? doc.data().updatedAt.toDate() : doc.data().updatedAt,
                lastLogin: doc.data().lastLogin?.toDate ? doc.data().lastLogin.toDate() : doc.data().lastLogin,
            })) as PlatformUser[];
        };

        let allUsers: PlatformUser[];
        let cacheStatus: CacheStatus;

        try {
            const result = await cachedFetch<PlatformUser[]>(CACHE_KEY_USERS_LIST, fetcher);
            allUsers = result.value;
            cacheStatus = result.status;
            console.log(`[API:Users] Cache ${cacheStatus} — ${allUsers.length} users`);
        } catch (cacheError: any) {
            // cachedFetch threw = MISS + fetch failed + no stale + no persistent snapshot
            logFirestoreError('Users:CacheFetch', cacheError, auth.uid);
            const errResp = ApiErrorResponse.serviceUnavailable(
                'System is temporarily unavailable due to high traffic (Quota). Please try again later.',
                60
            );
            errResp.headers.set('X-Cache', 'MISS');
            errResp.headers.set('X-Cache-Key', CACHE_KEY_USERS_LIST);
            return errResp;
        }

        // Apply visibility scope filtering
        const visibleUsers = filterVisibleUsers(allUsers, currentUserRole);
        console.log(`[API:Users] Visible: ${visibleUsers.length} (role: ${currentUserRole})`);

        const response = ApiSuccessResponse.ok({ users: visibleUsers, authMode: 'REAL' });
        return withCacheHeaders(response, cacheStatus);

    } catch (error: any) {
        if (isQuotaError(error)) {
            logFirestoreError('Users:Outer', error, 'no-auth');
            return ApiErrorResponse.serviceUnavailable(
                'System is temporarily unavailable due to high traffic (Quota). Please try again later.',
                60
            );
        }

        const appError = handleError(error as Error);
        console.error(`[API] Error fetching platform users [${appError.errorId}]:`, appError.message);
        return ApiErrorResponse.internalError();
    }
}

// =============================================================================
// POST - Create new platform user
// =============================================================================

export async function POST(request: NextRequest) {
    try {
        const auth = await getAuthContext();
        if (!auth) {
            return ApiErrorResponse.unauthorized();
        }

        const db = getAdminFirestore();
        const adminAuth = getAdminAuth();

        // Check permission
        const userDoc = await db.collection(COLLECTION_PLATFORM_USERS).doc(auth.uid).get();

        if (!userDoc.exists) {
            emitPermissionDenialEvent(
                { uid: auth.uid, email: auth.email || '', role: 'user' },
                'platform:users:write',
                { method: 'POST', path: '/api/platform/users' },
                { reason: 'not_platform_user' }
            );
            return ApiErrorResponse.forbidden('Not a platform user');
        }

        const currentUser = userDoc.data() as PlatformUser;

        if (!hasPermission(currentUser, 'platform:users:write')) {
            emitPermissionDenialEvent(
                { uid: auth.uid, email: auth.email || '', role: currentUser.role },
                'platform:users:write',
                { method: 'POST', path: '/api/platform/users' },
                { reason: 'insufficient_permission' }
            );
            return ApiErrorResponse.forbidden('Insufficient permissions');
        }

        // Parse and validate request body
        const body = await request.json();
        const validation = validateRequest(createUserSchema, body);

        if (!validation.success) {
            return ApiErrorResponse.validationError(validation.errors);
        }

        const { email, displayName, role, password, permissions } = validation.data;

        // Check role hierarchy - can't create user with higher/equal role
        if (ROLE_HIERARCHY[role as PlatformRole] >= ROLE_HIERARCHY[currentUser.role]) {
            emitPermissionDenialEvent(
                { uid: auth.uid, email: auth.email || '', role: currentUser.role },
                'platform:users:write',
                { method: 'POST', path: '/api/platform/users' },
                { reason: 'hierarchy_violation', targetRole: role }
            );
            return ApiErrorResponse.forbidden('Cannot create user with equal or higher role');
        }

        // Generate password if not provided
        const finalPassword = password || generateSecurePassword();

        // Create Firebase Auth user
        const firebaseUser = await adminAuth.createUser({
            email: email,
            password: finalPassword,
            displayName: displayName,
            emailVerified: false,
        });

        // Create Firestore document
        const newUser: Omit<PlatformUser, 'uid'> = {
            email: email,
            displayName: displayName,
            role: role as PlatformRole,
            permissions: permissions || [],
            enabled: true,
            createdBy: auth.uid,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        await db.collection(COLLECTION_PLATFORM_USERS).doc(firebaseUser.uid).set(newUser);

        // Phase 27C.8: Invalidate users list cache after mutation
        cacheInvalidate(CACHE_KEY_USERS_LIST);

        // Log audit
        await db.collection(COLLECTION_AUDIT_LOGS).add({
            action: 'user.created',
            actorUid: auth.uid,
            actorEmail: auth.email,
            targetUid: firebaseUser.uid,
            targetEmail: email,
            details: { role: role },
            timestamp: new Date(),
        });

        return ApiSuccessResponse.created({
            user: { uid: firebaseUser.uid, ...newUser },
            temporaryPassword: finalPassword,
            message: 'User created successfully'
        });

    } catch (error: unknown) {
        const appError = handleError(error as Error);
        console.error(`[API] Error creating platform user [${appError.errorId}]:`, appError.message);

        // Handle Firebase Auth errors
        if ((error as { code?: string }).code === 'auth/email-already-exists') {
            return ApiErrorResponse.conflict('Email already in use');
        }

        return ApiErrorResponse.internalError();
    }
}

// =============================================================================
// Helper Functions
// =============================================================================

function generateSecurePassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    let password = '';
    for (let i = 0; i < 16; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}
