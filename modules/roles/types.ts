/**
 * Roles Module Types
 */

export type PlatformRole = 'owner' | 'admin' | 'user';

export const ROLE_HIERARCHY: Record<PlatformRole, number> = {
    owner: 100,
    admin: 50,
    user: 10,
};

export interface PlatformRoleDefinition {
    roleId: PlatformRole;
    displayName: string;
    description: string;
    permissions: string[];
    isSystem: boolean;
    updatedAt: Date;
    updatedBy: string;
}

// Permission definitions
export const PLATFORM_PERMISSIONS = {
    // User Management
    'platform:users:read': 'View user list',
    'platform:users:write': 'Create and edit users',
    'platform:users:delete': 'Delete or disable users',
    'platform:roles:manage': 'Assign roles to users',

    // Organization Management
    'platform:orgs:read': 'View all organizations',
    'platform:orgs:write': 'Create and edit organizations',
    'platform:orgs:delete': 'Delete organizations',

    // Audit & Logs
    'platform:audit:read': 'View audit logs',

    // Settings
    'platform:settings:read': 'View platform settings',
    'platform:settings:write': 'Modify platform settings',
} as const;

export type PlatformPermission = keyof typeof PLATFORM_PERMISSIONS;

// Default permissions for each role
export const DEFAULT_ROLE_PERMISSIONS: Record<PlatformRole, PlatformPermission[]> = {
    owner: Object.keys(PLATFORM_PERMISSIONS) as PlatformPermission[],
    admin: [
        'platform:users:read',
        'platform:users:write',
        'platform:roles:manage',
        'platform:orgs:read',
        'platform:orgs:write',
        'platform:audit:read',
        'platform:settings:read',
    ],
    user: [
        'platform:orgs:read',
    ],
};

/**
 * Check if a role can manage another role
 */
export function canManageRole(actorRole: PlatformRole, targetRole: PlatformRole): boolean {
    return ROLE_HIERARCHY[actorRole] > ROLE_HIERARCHY[targetRole];
}
