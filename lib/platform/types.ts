/**
 * Platform User Management Types
 * 
 * Based on patterns from AWS IAM, Google Cloud IAM, and Vercel
 */

// =============================================================================
// ROLES
// =============================================================================

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
    updatedAt: Date;
    updatedBy: string;
}

// =============================================================================
// PERMISSIONS
// =============================================================================

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

// =============================================================================
// USERS
// =============================================================================

export interface PlatformUser {
    uid: string;
    email: string;
    displayName: string;
    role: PlatformRole;
    permissions: string[];  // Custom permissions (override defaults)
    enabled: boolean;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    lastLogin?: Date;
}

export interface CreateUserRequest {
    email: string;
    displayName: string;
    password?: string;       // If not provided, generate random
    role: PlatformRole;
    permissions?: string[];
}

export interface UpdateUserRequest {
    displayName?: string;
    role?: PlatformRole;
    permissions?: string[];
    enabled?: boolean;
}

// =============================================================================
// AUDIT LOGS
// =============================================================================

export type AuditAction =
    | 'user.created'
    | 'user.updated'
    | 'user.deleted'
    | 'user.disabled'
    | 'user.enabled'
    | 'role.updated'
    | 'login.success'
    | 'login.failed';

export interface PlatformAuditLog {
    id: string;
    action: AuditAction;
    actorUid: string;
    actorEmail: string;
    targetUid?: string;
    targetEmail?: string;
    details: Record<string, unknown>;
    timestamp: Date;
    ipAddress?: string;
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Check if a role can manage another role
 */
export function canManageRole(actorRole: PlatformRole, targetRole: PlatformRole): boolean {
    return ROLE_HIERARCHY[actorRole] > ROLE_HIERARCHY[targetRole];
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(
    user: Pick<PlatformUser, 'role' | 'permissions'>,
    permission: PlatformPermission
): boolean {
    // Check custom permissions first
    if (user.permissions.includes(permission)) {
        return true;
    }

    // Check role default permissions
    return DEFAULT_ROLE_PERMISSIONS[user.role].includes(permission);
}

/**
 * Get all effective permissions for a user
 */
export function getEffectivePermissions(user: Pick<PlatformUser, 'role' | 'permissions'>): string[] {
    const rolePermissions = DEFAULT_ROLE_PERMISSIONS[user.role];
    const customPermissions = user.permissions.filter(p => !rolePermissions.includes(p as PlatformPermission));
    return [...rolePermissions, ...customPermissions];
}
