/**
 * Platform Roles API
 * 
 * GET   - List roles with their permissions
 * PATCH - Update role permissions (Owner only)
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getAuthContext } from '@/lib/auth/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import type { PlatformUser, PlatformRoleDefinition, PlatformRole } from '@/lib/platform/types';
import { DEFAULT_ROLE_PERMISSIONS, PLATFORM_PERMISSIONS, hasPermission } from '@/lib/platform/types';
import { ApiSuccessResponse, ApiErrorResponse, validateRequest } from '@/lib/api';
import { handleError } from '@super-platform/core';
import { emitPermissionDenialEvent, emitSuccessEvent } from '@/lib/audit/emit';

// Validation schema for PATCH
const updateRoleSchema = z.object({
    roleId: z.string().refine(
        (val) => ['admin', 'user'].includes(val),
        { message: 'Role ID must be admin or user' }
    ),
    permissions: z.array(z.string()).min(1, 'At least one permission is required'),
});

// =============================================================================
// GET - List roles with permissions
// =============================================================================

export async function GET(request: NextRequest) {
    try {
        const auth = await getAuthContext();
        if (!auth) {
            return ApiErrorResponse.unauthorized();
        }

        const db = getAdminFirestore();

        // Check if platform user
        const userDoc = await db.collection('platform_users').doc(auth.uid).get();
        if (!userDoc.exists) {
            return ApiErrorResponse.forbidden('Not a platform user');
        }

        // Get custom role definitions from Firestore, or use defaults
        const rolesSnap = await db.collection('platform_roles').get();

        const roles: PlatformRoleDefinition[] = [];
        const storedRoles = new Map<string, PlatformRoleDefinition>();

        rolesSnap.docs.forEach(doc => {
            storedRoles.set(doc.id, {
                roleId: doc.id as PlatformRole,
                ...doc.data(),
                updatedAt: doc.data().updatedAt?.toDate(),
            } as PlatformRoleDefinition);
        });

        // Return all roles with defaults for any not customized
        const allRoles: PlatformRole[] = ['owner', 'admin', 'user'];

        for (const roleId of allRoles) {
            if (storedRoles.has(roleId)) {
                roles.push(storedRoles.get(roleId)!);
            } else {
                roles.push({
                    roleId,
                    displayName: roleId.charAt(0).toUpperCase() + roleId.slice(1),
                    description: getDefaultDescription(roleId),
                    permissions: DEFAULT_ROLE_PERMISSIONS[roleId],
                    updatedAt: new Date(),
                    updatedBy: 'system',
                });
            }
        }

        // Also return available permissions
        const availablePermissions = Object.entries(PLATFORM_PERMISSIONS).map(([key, desc]) => ({
            key,
            description: desc,
            category: key.split(':')[1], // e.g., 'users', 'orgs', 'audit'
        }));

        return ApiSuccessResponse.ok({ roles, availablePermissions });

    } catch (error) {
        const appError = handleError(error as Error);
        console.error(`[API] Error fetching roles [${appError.errorId}]:`, appError.message);
        return ApiErrorResponse.internalError();
    }
}

// =============================================================================
// PATCH - Update role permissions
// =============================================================================

export async function PATCH(request: NextRequest) {
    try {
        const auth = await getAuthContext();
        if (!auth) {
            return ApiErrorResponse.unauthorized();
        }

        const db = getAdminFirestore();
        const body = await request.json();

        // Check permission - only owners can modify role permissions
        const userDoc = await db.collection('platform_users').doc(auth.uid).get();
        if (!userDoc.exists) {
            emitPermissionDenialEvent(
                { uid: auth.uid, email: auth.email || '', role: 'user' },
                'platform:roles:manage',
                { method: 'PATCH', path: '/api/platform/roles' },
                { reason: 'not_platform_user' }
            );
            return ApiErrorResponse.forbidden('Not a platform user');
        }

        const currentUser = userDoc.data() as PlatformUser;

        if (currentUser.role !== 'owner') {
            emitPermissionDenialEvent(
                { uid: auth.uid, email: auth.email || '', role: currentUser.role },
                'platform:roles:manage',
                { method: 'PATCH', path: '/api/platform/roles' },
                { reason: 'owner_only' }
            );
            return ApiErrorResponse.forbidden('Only owners can modify role permissions');
        }

        // Validate request
        const validation = validateRequest(updateRoleSchema, body);
        if (!validation.success) {
            return ApiErrorResponse.validationError(validation.errors);
        }

        const { roleId, permissions } = validation.data;

        // Validate permissions are valid
        const validPermissions = Object.keys(PLATFORM_PERMISSIONS);
        const invalidPermissions = permissions.filter((p: string) => !validPermissions.includes(p));

        if (invalidPermissions.length > 0) {
            return ApiErrorResponse.badRequest(`Invalid permissions: ${invalidPermissions.join(', ')}`);
        }

        // Update role
        await db.collection('platform_roles').doc(roleId).set({
            roleId,
            displayName: roleId.charAt(0).toUpperCase() + roleId.slice(1),
            description: getDefaultDescription(roleId as PlatformRole),
            permissions,
            updatedAt: new Date(),
            updatedBy: auth.uid,
        }, { merge: true });

        // Log audit
        await emitSuccessEvent(
            'role',
            'permissions_assigned',
            { uid: auth.uid, email: auth.email || '', role: auth.role },
            { id: roleId, name: roleId, type: 'role' },
            { permissionsCount: permissions.length, permissions },
            { method: 'PATCH', path: '/api/platform/roles' }
        );

        return ApiSuccessResponse.ok({
            message: 'Role permissions updated successfully'
        });

    } catch (error) {
        const appError = handleError(error as Error);
        console.error(`[API] Error updating role [${appError.errorId}]:`, appError.message);
        return ApiErrorResponse.internalError();
    }
}

// =============================================================================
// Helper Functions
// =============================================================================

function getDefaultDescription(role: PlatformRole): string {
    switch (role) {
        case 'owner':
            return 'Full platform control. Can manage all users, roles, and settings.';
        case 'admin':
            return 'Operational management. Can manage users and view all data.';
        case 'user':
            return 'Limited access. Can view assigned data only.';
    }
}
