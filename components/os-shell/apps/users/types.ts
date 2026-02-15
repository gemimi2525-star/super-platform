/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Users Types — Re-export from Shared Core (Phase 27C.2)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Legacy compatibility module. All types now sourced from shared layer.
 * Existing imports from './types' continue to work unchanged.
 *
 * @module components/os-shell/apps/users/types
 * @version 2.0.0
 */

// Re-export shared types with legacy aliases
export type { UserRecord as User, UserFormData, UserRole, UserStatus } from '@/coreos/system/shared/types/user';
export type { UsersDataSource } from '@/coreos/system/shared/datasources/users-datasource';
