/**
 * RBAC Permission Service
 * 
 * Role-Based Access Control engine
 */

import {
    db,
    doc,
    getDoc,
    collection,
    getDocs,
    query,
    where,
    COLLECTION_USERS,
    COLLECTION_ROLES,
    COLLECTION_PERMISSIONS
} from '@/lib/firebase';
import type { User, Permission, Role } from '@/lib/types';

/**
 * Check if user has a specific permission
 * 
 * @param userId - User ID
 * @param organizationId - Organization ID
 * @param permission - Permission string (e.g., "seo.sites.read")
 * @returns Promise<boolean>
 */
export async function hasPermission(
    userId: string,
    organizationId: string,
    permission: string
): Promise<boolean> {
    // Get user document
    const userDoc = await getDoc(doc(db, COLLECTION_USERS, userId));

    if (!userDoc.exists()) {
        return false;
    }

    const user = userDoc.data() as User;
    const userOrg = user.organizations[organizationId];

    if (!userOrg) {
        return false;
    }

    // Owner has all permissions
    if (userOrg.role === 'owner') {
        return true;
    }

    // Check if user has the specific permission
    return userOrg.permissions.includes(permission);
}

/**
 * Check if user has ANY of the given permissions
 */
export async function hasAnyPermission(
    userId: string,
    organizationId: string,
    permissions: string[]
): Promise<boolean> {
    const userDoc = await getDoc(doc(db, COLLECTION_USERS, userId));

    if (!userDoc.exists()) {
        return false;
    }

    const user = userDoc.data() as User;
    const userOrg = user.organizations[organizationId];

    if (!userOrg) {
        return false;
    }

    if (userOrg.role === 'owner') {
        return true;
    }

    return permissions.some(p => userOrg.permissions.includes(p));
}

/**
 * Check if user has ALL of the given permissions
 */
export async function hasAllPermissions(
    userId: string,
    organizationId: string,
    permissions: string[]
): Promise<boolean> {
    const userDoc = await getDoc(doc(db, COLLECTION_USERS, userId));

    if (!userDoc.exists()) {
        return false;
    }

    const user = userDoc.data() as User;
    const userOrg = user.organizations[organizationId];

    if (!userOrg) {
        return false;
    }

    if (userOrg.role === 'owner') {
        return true;
    }

    return permissions.every(p => userOrg.permissions.includes(p));
}

/**
 * Get all permissions for a role
 */
export async function getRolePermissions(roleId: string): Promise<string[]> {
    const roleDoc = await getDoc(doc(db, COLLECTION_ROLES, roleId));

    if (!roleDoc.exists()) {
        return [];
    }

    const role = roleDoc.data() as Role;
    return role.permissions;
}

/**
 * Get all available permissions
 */
export async function getAllPermissions(): Promise<Permission[]> {
    const snapshot = await getDocs(collection(db, COLLECTION_PERMISSIONS));
    return snapshot.docs.map(doc => doc.data() as Permission);
}

/**
 * Get permissions for a module
 */
export async function getModulePermissions(module: string): Promise<Permission[]> {
    const q = query(
        collection(db, COLLECTION_PERMISSIONS),
        where('module', '==', module)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Permission);
}

/**
 * Parse permission string
 * 
 * @param permission - "module.resource.action"
 * @returns { module, resource, action }
 */
export function parsePermission(permission: string) {
    const [module, resource, action] = permission.split('.');
    return { module, resource, action };
}

/**
 * Build permission string
 */
export function buildPermission(
    module: string,
    resource: string,
    action: string
): string {
    return `${module}.${resource}.${action}`;
}

/**
 * System Permissions (built-in)
 */
export const SYSTEM_PERMISSIONS = {
    // Organization management
    ORG_READ: 'platform.organization.read',
    ORG_WRITE: 'platform.organization.write',
    ORG_DELETE: 'platform.organization.delete',

    // User management
    USERS_READ: 'platform.users.read',
    USERS_WRITE: 'platform.users.write',
    USERS_DELETE: 'platform.users.delete',
    USERS_INVITE: 'platform.users.invite',

    // Role management
    ROLES_READ: 'platform.roles.read',
    ROLES_WRITE: 'platform.roles.write',
    ROLES_DELETE: 'platform.roles.delete',

    // Audit logs
    AUDIT_READ: 'platform.audit.read',

    // System admin
    SYSTEM_ADMIN: 'platform.system.admin',
} as const;
