/**
 * Platform Modules
 * 
 * Central export for all feature modules
 * Import from '@/modules/...' in your code
 * 
 * Example:
 *   import { UserList, useUsers } from '@/modules/users';
 *   import { DashboardStats } from '@/modules/dashboard';
 */

// Re-export all modules for convenience
export * as dashboard from './dashboard';
export * as users from './users';
export * as roles from './roles';
export * as audit from './audit';
export * as orgs from './orgs';
