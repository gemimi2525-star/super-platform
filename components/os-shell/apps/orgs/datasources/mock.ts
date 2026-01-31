/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ORGANIZATIONS APP — Mock DataSource
 * ═══════════════════════════════════════════════════════════════════════════
 */

import type { Organization, OrganizationFormData, OrganizationsDataSource } from '../types';

let mockOrgs: Organization[] = [
    {
        id: 'org-001',
        name: 'Acme Corporation',
        slug: 'acme-corp',
        plan: 'pro',
        domain: 'acme.com',
        status: 'active',
        createdAt: '2025-12-01T10:00:00.000Z',
    },
    {
        id: 'org-002',
        name: 'Tech Startup Inc.',
        slug: 'tech-startup',
        plan: 'free',
        domain: null,
        status: 'active',
        createdAt: '2025-12-15T14:30:00.000Z',
    },
    {
        id: 'org-003',
        name: 'Global Media Group',
        slug: 'global-media',
        plan: 'enterprise',
        domain: 'globalmedia.com',
        status: 'active',
        createdAt: '2026-01-05T09:15:00.000Z',
    },
];

export const mockDataSource: OrganizationsDataSource = {
    async listOrganizations(): Promise<Organization[]> {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 300));
        return [...mockOrgs];
    },

    async createOrganization(data: OrganizationFormData): Promise<Organization> {
        await new Promise(resolve => setTimeout(resolve, 500));

        const newOrg: Organization = {
            id: `org-${Date.now()}`,
            name: data.name,
            slug: data.slug || data.name.toLowerCase().replace(/\s+/g, '-'),
            plan: data.plan || 'free',
            domain: data.domain || null,
            status: data.status || 'active',
            createdAt: new Date().toISOString(),
        };

        mockOrgs = [...mockOrgs, newOrg];
        return newOrg;
    },

    async updateOrganization(id: string, updates: Partial<OrganizationFormData>): Promise<Organization> {
        await new Promise(resolve => setTimeout(resolve, 500));

        const index = mockOrgs.findIndex(o => o.id === id);
        if (index === -1) {
            throw new Error('Organization not found');
        }

        const updatedOrg = {
            ...mockOrgs[index],
            ...updates,
            updatedAt: new Date().toISOString(),
        };

        mockOrgs = [
            ...mockOrgs.slice(0, index),
            updatedOrg,
            ...mockOrgs.slice(index + 1),
        ];

        return updatedOrg;
    },

    async disableOrganization(id: string): Promise<void> {
        await new Promise(resolve => setTimeout(resolve, 500));

        const index = mockOrgs.findIndex(o => o.id === id);
        if (index === -1) {
            throw new Error('Organization not found');
        }

        mockOrgs = [
            ...mockOrgs.slice(0, index),
            { ...mockOrgs[index], status: 'disabled' as const },
            ...mockOrgs.slice(index + 1),
        ];
    },
};
