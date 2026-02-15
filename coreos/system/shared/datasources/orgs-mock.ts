/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Organizations Mock DataSource — Phase 27C.2
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Mock implementation for development/testing.
 * Migrated from components/os-shell/apps/orgs/datasources/mock.ts.
 *
 * @module coreos/system/shared/datasources/orgs-mock
 * @version 1.0.0
 */

import type { OrgRecord, OrgFormData } from '../types';
import type { OrgsDataSource } from './orgs-datasource';

// ═══════════════════════════════════════════════════════════════════════════
// SEED DATA
// ═══════════════════════════════════════════════════════════════════════════

const SEED_ORGS: OrgRecord[] = [
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

// ═══════════════════════════════════════════════════════════════════════════
// MOCK DATA SOURCE
// ═══════════════════════════════════════════════════════════════════════════

let mockOrgs = [...SEED_ORGS];

export const orgsMockDataSource: OrgsDataSource = {
    async list(): Promise<OrgRecord[]> {
        await new Promise(resolve => setTimeout(resolve, 300));
        return [...mockOrgs];
    },

    async create(data: OrgFormData): Promise<OrgRecord> {
        await new Promise(resolve => setTimeout(resolve, 500));
        const newOrg: OrgRecord = {
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

    async update(id: string, data: Partial<OrgFormData>): Promise<OrgRecord> {
        await new Promise(resolve => setTimeout(resolve, 500));
        const index = mockOrgs.findIndex(o => o.id === id);
        if (index === -1) throw new Error('Organization not found');

        const updated = {
            ...mockOrgs[index],
            ...data,
            updatedAt: new Date().toISOString(),
        };
        mockOrgs = [...mockOrgs.slice(0, index), updated, ...mockOrgs.slice(index + 1)];
        return updated;
    },

    async remove(id: string): Promise<void> {
        await new Promise(resolve => setTimeout(resolve, 500));
        const index = mockOrgs.findIndex(o => o.id === id);
        if (index === -1) throw new Error('Organization not found');

        mockOrgs = [
            ...mockOrgs.slice(0, index),
            { ...mockOrgs[index], status: 'disabled' as const },
            ...mockOrgs.slice(index + 1),
        ];
    },
};

/** Reset mock data (for testing) */
export function resetMockOrgs(): void {
    mockOrgs = [...SEED_ORGS];
}
