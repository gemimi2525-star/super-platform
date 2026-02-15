/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Shared Core — Central Barrel Export — Phase 27C.2
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Single import point for all shared types, datasources, hooks, and UI.
 *
 * @module coreos/system/shared
 * @version 1.0.0
 */

// Types
export type {
    UserRecord, UserFormData, UserRole, UserStatus,
    OrgRecord, OrgFormData, OrgPlan, OrgStatus,
} from './types';

// DataSource interfaces
export type { UsersDataSource } from './datasources/users-datasource';
export type { OrgsDataSource } from './datasources/orgs-datasource';

// DataSource implementations
export { usersApiDataSource } from './datasources/users-api';
export { usersMockDataSource } from './datasources/users-mock';
export { orgsApiDataSource } from './datasources/orgs-api';
export { orgsMockDataSource } from './datasources/orgs-mock';
export { USERS_ENDPOINT, ORGS_ENDPOINT } from './datasources/endpoints';

// Hooks
export { useGovernedMutation } from './hooks/useGovernedMutation';
export { useDecisionLogger } from './hooks/useDecisionLogger';
export { useStepUpGate } from './hooks/useStepUpGate';

// UI Components
export { PermissionBanner } from './ui/PermissionBanner';
export { StatusBadge } from './ui/StatusBadge';
export { RoleBadge } from './ui/RoleBadge';
export { PlanBadge } from './ui/PlanBadge';
export { SearchInput } from './ui/SearchInput';
export { UserModal } from './ui/users/UserModal';
export { OrgModal } from './ui/orgs/OrgModal';

// Panels (full-parity)
export { UsersPanel } from './ui/users/UsersPanel';
export { OrganizationsPanel } from './ui/orgs/OrganizationsPanel';
