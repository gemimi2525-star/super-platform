/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Shared Organization Types — Phase 27C.2
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Source-of-truth for all organization-related types used by both
 * legacy OS Shell apps and the System Hub.
 *
 * @module coreos/system/shared/types/org
 * @version 1.0.0
 */

// ═══════════════════════════════════════════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════════════════════════════════════════

export type OrgPlan = 'free' | 'starter' | 'pro' | 'enterprise';
export type OrgStatus = 'active' | 'suspended' | 'disabled';

// ═══════════════════════════════════════════════════════════════════════════
// RECORD
// ═══════════════════════════════════════════════════════════════════════════

export interface OrgRecord {
    id: string;
    name: string;
    slug?: string;
    plan?: OrgPlan;
    domain?: string | null;
    status?: OrgStatus;
    modules?: string[];
    createdAt?: string;
    updatedAt?: string;
    createdBy?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// FORM DATA
// ═══════════════════════════════════════════════════════════════════════════

export interface OrgFormData {
    name: string;
    slug?: string;
    plan?: OrgPlan;
    domain?: string;
    status?: OrgStatus;
}
