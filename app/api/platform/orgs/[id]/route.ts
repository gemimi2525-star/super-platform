import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
    ApiSuccessResponse,
    ApiErrorResponse,
    validateRequest // Added helper
} from '@/lib/api';
import { handleError } from '@super-platform/core';
import {
    getAuthContext
} from '@/lib/auth/server';
import { hasPermission, PlatformUser, PlatformRole } from '@/lib/platform/types';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { Organization } from '@/lib/types';

// =============================================================================
// GET - Get organization details
// =============================================================================

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const auth = await getAuthContext();
        if (!auth) return ApiErrorResponse.unauthorized();

        const db = getAdminFirestore();

        // Fetch full platform user to check permissions
        const userDoc = await db.collection('platform_users').doc(auth.uid).get();
        if (!userDoc.exists) return ApiErrorResponse.forbidden('Not a platform user');

        const currentUser = userDoc.data() as PlatformUser;

        // 1. Check permission
        if (!hasPermission(currentUser, 'platform:orgs:read')) {
            console.warn(`[API] Unauthorized org access attempt by ${auth.uid}`);
            return ApiErrorResponse.forbidden('Insufficient permissions');
        }

        // 2. Fetch organization
        const orgDoc = await db.collection('organizations').doc(id).get();
        if (!orgDoc.exists) {
            return ApiErrorResponse.notFound('Organization not found');
        }

        const orgData = orgDoc.data();
        if (orgData?.deleted) {
            return ApiErrorResponse.notFound('Organization not found');
        }

        const organization: Organization = {
            id: orgDoc.id,
            ...orgData,
            createdAt: orgData?.createdAt?.toDate ? orgData.createdAt.toDate().toISOString() : new Date().toISOString(),
            updatedAt: orgData?.updatedAt?.toDate ? orgData.updatedAt.toDate().toISOString() : new Date().toISOString()
        } as Organization;

        return ApiSuccessResponse.ok({
            organization
        });

    } catch (error) {
        const appError = handleError(error as Error);
        console.error(`[API] Failed to get organization [${appError.errorId}]:`, appError.message);
        return ApiErrorResponse.internalError();
    }
}

// =============================================================================
// PATCH - Update organization
// =============================================================================

// Validation schema for PATCH
const updateOrgSchema = z.object({
    name: z.string().min(2).optional(),
    slug: z.string().min(2).regex(/^[a-z0-9-]+$/).optional(),
    logoUrl: z.string().url().optional(),
});

export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const body = await request.json();

        const auth = await getAuthContext();
        if (!auth) return ApiErrorResponse.unauthorized();

        const db = getAdminFirestore();
        const userDoc = await db.collection('platform_users').doc(auth.uid).get();
        if (!userDoc.exists) return ApiErrorResponse.forbidden('Not a platform user');

        const currentUser = userDoc.data() as PlatformUser;

        // 1. Check permission
        if (!hasPermission(currentUser, 'platform:orgs:write')) {
            return ApiErrorResponse.forbidden('Insufficient permissions');
        }

        // 2. Validate input using validateRequest helper for type safety
        const validation = validateRequest(updateOrgSchema, body);
        if (!validation.success) {
            return ApiErrorResponse.validationError(validation.errors);
        }

        const updates = validation.data;

        // 3. Check slug uniqueness if changing
        if (updates.slug) {
            const slugCheck = await db.collection('organizations')
                .where('slug', '==', updates.slug)
                .get();

            if (!slugCheck.empty && slugCheck.docs[0].id !== id) {
                return ApiErrorResponse.badRequest('Slug already taken');
            }
        }

        // 4. Update
        await db.collection('organizations').doc(id).update({
            ...updates,
            updatedAt: new Date()
        });

        // 5. Audit Log matches B3 pattern
        console.log(`[Audit] Org updated: ${id} by ${auth.uid}`);

        return ApiSuccessResponse.ok({
            message: 'Organization updated successfully'
        });

    } catch (error) {
        const appError = handleError(error as Error);
        console.error(`[API] Failed to update organization [${appError.errorId}]:`, appError.message);
        return ApiErrorResponse.internalError();
    }
}

// =============================================================================
// DELETE - Delete (Disable) organization
// =============================================================================

export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;

        const auth = await getAuthContext();
        if (!auth) return ApiErrorResponse.unauthorized();

        const db = getAdminFirestore();
        const userDoc = await db.collection('platform_users').doc(auth.uid).get();
        if (!userDoc.exists) return ApiErrorResponse.forbidden('Not a platform user');

        const currentUser = userDoc.data() as PlatformUser;

        // 1. Check permission
        if (!hasPermission(currentUser, 'platform:orgs:delete')) {
            return ApiErrorResponse.forbidden('Insufficient permissions');
        }

        // 2. Soft delete
        await db.collection('organizations').doc(id).update({
            disabled: true,
            updatedAt: new Date()
        });

        // 3. Audit Log
        console.log(`[Audit] Org disabled: ${id} by ${auth.uid}`);

        return ApiSuccessResponse.ok({
            message: 'Organization disabled successfully'
        });

    } catch (error) {
        const appError = handleError(error as Error);
        console.error(`[API] Failed to disable organization [${appError.errorId}]:`, appError.message);
        return ApiErrorResponse.internalError();
    }
}
