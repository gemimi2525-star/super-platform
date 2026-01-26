/**
 * Authentication Types
 * 
 * Core types for platform authentication and authorization
 * Extracted from lib/auth/server.ts to enable reuse across packages
 */

// Platform-level role types
export type PlatformRole = 'owner' | 'admin' | 'user';

// Organization-level role types
export type OrgRole = 'owner' | 'admin' | 'member' | 'viewer';

// Role hierarchy for permission checks (higher index = more permissions)
export const ROLE_HIERARCHY: readonly OrgRole[] = ['viewer', 'member', 'admin', 'owner'] as const;

/**
 * Authentication context representing the current user
 */
export interface AuthContext {
    uid: string;
    email?: string;
    role: PlatformRole;
    orgRole?: OrgRole;
    orgId?: string;
}
