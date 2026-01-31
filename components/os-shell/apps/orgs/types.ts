/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ORGANIZATIONS APP — Types
 * ═══════════════════════════════════════════════════════════════════════════
 */

export type OrganizationPlan = 'free' | 'starter' | 'pro' | 'enterprise';
export type OrganizationStatus = 'active' | 'suspended' | 'disabled';

export interface Organization {
    id: string;
    name: string;
    slug?: string;
    plan?: OrganizationPlan;
    domain?: string | null;
    status?: OrganizationStatus;
    modules?: string[];
    createdAt?: string;
    updatedAt?: string;
    createdBy?: string;
}

export interface OrganizationFormData {
    name: string;
    slug?: string;
    plan?: OrganizationPlan;
    domain?: string;
    status?: OrganizationStatus;
}

export interface OrganizationsDataSource {
    listOrganizations(): Promise<Organization[]>;
    createOrganization(data: OrganizationFormData): Promise<Organization>;
    updateOrganization(id: string, data: Partial<OrganizationFormData>): Promise<Organization>;
    disableOrganization(id: string): Promise<void>;
}
