/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Organizations Types — Re-export from Shared Core (Phase 27C.2)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Legacy compatibility module. All types now sourced from shared layer.
 * Existing imports from './types' continue to work unchanged.
 *
 * @module components/os-shell/apps/orgs/types
 * @version 2.0.0
 */

// Re-export shared types with legacy aliases
export type {
    OrgRecord as Organization,
    OrgFormData as OrganizationFormData,
    OrgPlan as OrganizationPlan,
    OrgStatus as OrganizationStatus,
} from '@/coreos/system/shared/types/org';

export type { OrgsDataSource as OrganizationsDataSource } from '@/coreos/system/shared/datasources/orgs-datasource';
