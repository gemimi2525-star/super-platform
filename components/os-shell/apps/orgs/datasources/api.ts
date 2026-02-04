/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ORGANIZATIONS APP — API DataSource
 * ═══════════════════════════════════════════════════════════════════════════
 */

import type { Organization, OrganizationFormData, OrganizationsDataSource } from '../types';

export const apiDataSource: OrganizationsDataSource = {
    async listOrganizations(): Promise<Organization[]> {
        const response = await fetch('/api/platform/orgs', {
            method: 'GET',
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch organizations: ${response.statusText}`);
        }

        const json = await response.json();
        // Phase 9.9: Handle nested API response { success: true, data: { organizations: [...] } }
        return json.data?.organizations || json.organizations || [];
    },

    async createOrganization(formData: OrganizationFormData): Promise<Organization> {
        const response = await fetch('/api/platform/orgs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                name: formData.name,
                slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-'),
                plan: formData.plan || 'free',
                domain: formData.domain || null,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || `Failed to create organization: ${response.statusText}`);
        }

        const data = await response.json();
        return data.organization;
    },

    async updateOrganization(id: string, updates: Partial<OrganizationFormData>): Promise<Organization> {
        const response = await fetch(`/api/platform/orgs/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(updates),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || `Failed to update organization: ${response.statusText}`);
        }

        const data = await response.json();
        return data.organization;
    },

    async disableOrganization(id: string): Promise<void> {
        const response = await fetch(`/api/platform/orgs/${id}`, {
            method: 'DELETE',
            credentials: 'include',
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || `Failed to disable organization: ${response.statusText}`);
        }
    },
};
