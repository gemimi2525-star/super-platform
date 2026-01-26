/**
 * Roles Module
 * 
 * Role and permission management for Super Platform
 * 
 * @module roles
 */

// Components
export { RoleList } from './components/RoleList';
export { RoleEditor } from './components/RoleEditor';

// Hooks
export { useRoles } from './hooks/useRoles';

// Types
export type {
    PlatformRole,
    PlatformRoleDefinition,
    PlatformPermission
} from './types';

// Constants
export { PLATFORM_PERMISSIONS, DEFAULT_ROLE_PERMISSIONS } from './types';
