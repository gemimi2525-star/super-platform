/**
 * Platform User Detail API
 * 
 * GET    - Get user details
 * PATCH  - Update user (role, permissions, enabled)
 * DELETE - Delete/disable user
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getAuthContext } from '@/lib/auth/server';
import { getAdminFirestore, getAdminAuth } from '@/lib/firebase-admin';
import type { PlatformUser, PlatformRole } from '@/lib/platform/types';
import { ROLE_HIERARCHY, hasPermission } from '@/lib/platform/types';
import { ApiSuccessResponse, ApiErrorResponse, validateRequest } from '@/lib/api';
import { handleError } from '@super-platform/core';
import { assertCanAccessTargetUser, AccessDeniedError } from '@super-platform/core';
import { emitPermissionDenialEvent } from '@/lib/audit/emit';

export const runtime = 'nodejs';

// Inline collection constants to avoid webpack path resolution issues
const COLLECTION_PLATFORM_USERS = 'platform_users';
const COLLECTION_AUDIT_LOGS = 'platform_audit_logs';

interface RouteParams {
    params: Promise<{ uid: string }>;
}

// Validation schema for PATCH
const updateUserSchema = z.object({
    displayName: z.string().min(1, 'Display name is required').optional(),
    role: z.string().min(1, 'Role is required').optional(),
    permissions: z.array(z.string()).optional(),
    enabled: z.boolean().optional(),
});

// =============================================================================
// GET - Get user details
// =============================================================================

export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const auth = await getAuthContext();
        if (!auth) {
            return ApiErrorResponse.unauthorized();
        }

        const db = getAdminFirestore();
        const { uid } = await params;

        // Check permission
        const currentUserDoc = await db.collection(COLLECTION_PLATFORM_USERS).doc(auth.uid).get();
        if (!currentUserDoc.exists) {
            emitPermissionDenialEvent(
                { uid: auth.uid, email: auth.email || '', role: 'user' },
                'platform:users:read',
                { method: 'GET', path: `/api/platform/users/${uid}` },
                { reason: 'not_platform_user' }
            );
            return ApiErrorResponse.forbidden('Not a platform user');
        }

        const currentUser = currentUserDoc.data() as PlatformUser;
        if (!hasPermission(currentUser, 'platform:users:read')) {
            emitPermissionDenialEvent(
                { uid: auth.uid, email: auth.email || '', role: currentUser.role },
                'platform:users:read',
                { method: 'GET', path: `/api/platform/users/${uid}` },
                { reason: 'insufficient_permission' }
            );
            return ApiErrorResponse.forbidden('Insufficient permissions');
        }

        // Get target user
        const targetDoc = await db.collection(COLLECTION_PLATFORM_USERS).doc(uid).get();
        if (!targetDoc.exists) {
            return ApiErrorResponse.notFound('User');
        }

        const targetUser = {
            uid: targetDoc.id,
            ...targetDoc.data(),
            createdAt: targetDoc.data()?.createdAt?.toDate(),
            updatedAt: targetDoc.data()?.updatedAt?.toDate(),
            lastLogin: targetDoc.data()?.lastLogin?.toDate(),
        } as PlatformUser;

        // Apply visibility scope guard
        // Policy: non-owner cannot view owner users
        try {
            assertCanAccessTargetUser(currentUser.role, targetUser.role);
        } catch (error) {
            if (error instanceof AccessDeniedError) {
                // Return 404 for stealth (don't leak owner existence)
                return ApiErrorResponse.notFound('User');
            }
            throw error;
        }

        return ApiSuccessResponse.ok({ user: targetUser });

    } catch (error) {
        const appError = handleError(error as Error);
        console.error(`[API] Error fetching user [${appError.errorId}]:`, appError.message);
        return ApiErrorResponse.internalError();
    }
}

// =============================================================================
// PATCH - Update user
// =============================================================================

export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const auth = await getAuthContext();
        if (!auth) {
            return ApiErrorResponse.unauthorized();
        }

        const db = getAdminFirestore();
        const { uid } = await params;

        // Parse and validate request body
        const body = await request.json();
        const validation = validateRequest(updateUserSchema, body);

        if (!validation.success) {
            return ApiErrorResponse.validationError(validation.errors);
        }

        const validatedData = validation.data;

        // Check permission
        const currentUserDoc = await db.collection(COLLECTION_PLATFORM_USERS).doc(auth.uid).get();
        if (!currentUserDoc.exists) {
            emitPermissionDenialEvent(
                { uid: auth.uid, email: auth.email || '', role: 'user' },
                'platform:users:write',
                { method: 'PATCH', path: `/api/platform/users/${uid}` },
                { reason: 'not_platform_user' }
            );
            return ApiErrorResponse.forbidden('Not a platform user');
        }

        const currentUser = currentUserDoc.data() as PlatformUser;

        // Need write permission for most updates
        if (!hasPermission(currentUser, 'platform:users:write')) {
            emitPermissionDenialEvent(
                { uid: auth.uid, email: auth.email || '', role: currentUser.role },
                'platform:users:write',
                { method: 'PATCH', path: `/api/platform/users/${uid}` },
                { reason: 'insufficient_permission' }
            );
            return ApiErrorResponse.forbidden('Insufficient permissions');
        }

        // Get target user
        const targetDoc = await db.collection(COLLECTION_PLATFORM_USERS).doc(uid).get();
        if (!targetDoc.exists) {
            return ApiErrorResponse.notFound('User');
        }

        const targetUser = targetDoc.data() as PlatformUser;

        // GUARD: Block non-owner from updating owner users
        try {
            assertCanAccessTargetUser(currentUser.role, targetUser.role);
        } catch (error) {
            if (error instanceof AccessDeniedError) {
                emitPermissionDenialEvent(
                    { uid: auth.uid, email: auth.email || '', role: currentUser.role },
                    'platform:users:write',
                    { method: 'PATCH', path: `/api/platform/users/${uid}` },
                    { reason: 'owner_protection', targetRole: targetUser.role }
                );
                return ApiErrorResponse.forbidden('Cannot modify owner users');
            }
            throw error;
        }

        // Can't modify user with equal or higher role
        if (ROLE_HIERARCHY[targetUser.role] >= ROLE_HIERARCHY[currentUser.role]) {
            emitPermissionDenialEvent(
                { uid: auth.uid, email: auth.email || '', role: currentUser.role },
                'platform:users:write',
                { method: 'PATCH', path: `/api/platform/users/${uid}` },
                { reason: 'hierarchy_violation', targetRole: targetUser.role }
            );
            return ApiErrorResponse.forbidden('Cannot modify user with equal or higher role');
        }

        // If changing role, check roles:manage permission and hierarchy
        if (validatedData.role && validatedData.role !== targetUser.role) {
            if (!hasPermission(currentUser, 'platform:roles:manage')) {
                emitPermissionDenialEvent(
                    { uid: auth.uid, email: auth.email || '', role: currentUser.role },
                    'platform:roles:manage',
                    { method: 'PATCH', path: `/api/platform/users/${uid}` },
                    { reason: 'no_role_manage_permission' }
                );
                return ApiErrorResponse.forbidden('No permission to change roles');
            }

            // GUARD: Block non-owner from promoting anyone to owner role
            if (validatedData.role === 'owner' && currentUser.role !== 'owner') {
                emitPermissionDenialEvent(
                    { uid: auth.uid, email: auth.email || '', role: currentUser.role },
                    'platform:users:write',
                    { method: 'PATCH', path: `/api/platform/users/${uid}` },
                    { reason: 'owner_promotion_denied', attemptedRole: 'owner' }
                );
                return ApiErrorResponse.forbidden('Only owner can assign owner role');
            }

            // Can't promote to equal or higher role
            if (ROLE_HIERARCHY[validatedData.role as PlatformRole] >= ROLE_HIERARCHY[currentUser.role]) {
                emitPermissionDenialEvent(
                    { uid: auth.uid, email: auth.email || '', role: currentUser.role },
                    'platform:users:write',
                    { method: 'PATCH', path: `/api/platform/users/${uid}` },
                    { reason: 'promotion_hierarchy_violation', attemptedRole: validatedData.role }
                );
                return ApiErrorResponse.forbidden('Cannot promote to equal or higher role');
            }
        }

        // Build update object
        const updateData: Partial<PlatformUser> = {
            updatedAt: new Date(),
        };

        if (validatedData.displayName) updateData.displayName = validatedData.displayName;
        if (validatedData.role) updateData.role = validatedData.role as PlatformRole;
        if (validatedData.permissions) updateData.permissions = validatedData.permissions;
        if (typeof validatedData.enabled === 'boolean') updateData.enabled = validatedData.enabled;

        await db.collection(COLLECTION_PLATFORM_USERS).doc(uid).update(updateData);

        // Log audit
        await db.collection(COLLECTION_AUDIT_LOGS).add({
            action: validatedData.enabled === false ? 'user.disabled' :
                validatedData.enabled === true ? 'user.enabled' : 'user.updated',
            actorUid: auth.uid,
            actorEmail: auth.email,
            targetUid: uid,
            targetEmail: targetUser.email,
            details: validatedData,
            timestamp: new Date(),
        });

        return ApiSuccessResponse.ok({
            message: 'User updated successfully',
            user: { ...targetUser, ...updateData, uid }
        });

    } catch (error) {
        const appError = handleError(error as Error);
        console.error(`[API] Error updating user [${appError.errorId}]:`, appError.message);
        return ApiErrorResponse.internalError();
    }
}

// =============================================================================
// DELETE - Delete/disable user
// =============================================================================

export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const auth = await getAuthContext();
        if (!auth) {
            return ApiErrorResponse.unauthorized();
        }

        const db = getAdminFirestore();
        const adminAuth = getAdminAuth();
        const { uid } = await params;

        // Check permission
        const currentUserDoc = await db.collection(COLLECTION_PLATFORM_USERS).doc(auth.uid).get();
        if (!currentUserDoc.exists) {
            emitPermissionDenialEvent(
                { uid: auth.uid, email: auth.email || '', role: 'user' },
                'platform:users:delete',
                { method: 'DELETE', path: `/api/platform/users/${uid}` },
                { reason: 'not_platform_user' }
            );
            return ApiErrorResponse.forbidden('Not a platform user');
        }

        const currentUser = currentUserDoc.data() as PlatformUser;

        if (!hasPermission(currentUser, 'platform:users:delete')) {
            emitPermissionDenialEvent(
                { uid: auth.uid, email: auth.email || '', role: currentUser.role },
                'platform:users:delete',
                { method: 'DELETE', path: `/api/platform/users/${uid}` },
                { reason: 'insufficient_permission' }
            );
            return ApiErrorResponse.forbidden('Insufficient permissions');
        }

        // Get target user
        const targetDoc = await db.collection(COLLECTION_PLATFORM_USERS).doc(uid).get();
        if (!targetDoc.exists) {
            return ApiErrorResponse.notFound('User');
        }

        const targetUser = targetDoc.data() as PlatformUser;

        // GUARD: Block non-owner from deleting owner users
        try {
            assertCanAccessTargetUser(currentUser.role, targetUser.role);
        } catch (error) {
            if (error instanceof AccessDeniedError) {
                emitPermissionDenialEvent(
                    { uid: auth.uid, email: auth.email || '', role: currentUser.role },
                    'platform:users:delete',
                    { method: 'DELETE', path: `/api/platform/users/${uid}` },
                    { reason: 'owner_protection', targetRole: targetUser.role }
                );
                return ApiErrorResponse.forbidden('Cannot delete owner users');
            }
            throw error;
        }

        // Can't delete user with equal or higher role
        if (ROLE_HIERARCHY[targetUser.role] >= ROLE_HIERARCHY[currentUser.role]) {
            emitPermissionDenialEvent(
                { uid: auth.uid, email: auth.email || '', role: currentUser.role },
                'platform:users:delete',
                { method: 'DELETE', path: `/api/platform/users/${uid}` },
                { reason: 'hierarchy_violation', targetRole: targetUser.role }
            );
            return ApiErrorResponse.forbidden('Cannot delete user with equal or higher role');
        }

        // Can't delete self
        if (uid === auth.uid) {
            emitPermissionDenialEvent(
                { uid: auth.uid, email: auth.email || '', role: currentUser.role },
                'platform:users:delete',
                { method: 'DELETE', path: `/api/platform/users/${uid}` },
                { reason: 'self_delete_prevention' }
            );
            return ApiErrorResponse.forbidden('Cannot delete yourself');
        }

        // Soft delete: disable user instead of deleting
        await db.collection(COLLECTION_PLATFORM_USERS).doc(uid).update({
            enabled: false,
            updatedAt: new Date(),
        });

        // Disable Firebase Auth user
        await adminAuth.updateUser(uid, { disabled: true });

        // Log audit
        await db.collection(COLLECTION_AUDIT_LOGS).add({
            action: 'user.deleted',
            actorUid: auth.uid,
            actorEmail: auth.email,
            targetUid: uid,
            targetEmail: targetUser.email,
            details: {},
            timestamp: new Date(),
        });

        return ApiSuccessResponse.ok({ message: 'User disabled successfully' });

    } catch (error) {
        const appError = handleError(error as Error);
        console.error(`[API] Error deleting user [${appError.errorId}]:`, appError.message);
        return ApiErrorResponse.internalError();
    }
}
