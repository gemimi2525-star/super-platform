/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Organizations API DataSource — Phase 27C.2
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Concrete API implementation using canonical /api/platform/orgs.
 * Migrated from components/os-shell/apps/orgs/datasources/api.ts.
 *
 * @module coreos/system/shared/datasources/orgs-api
 * @version 1.0.0
 */

import type { OrgRecord, OrgFormData } from '../types';
import type { OrgsDataSource } from './orgs-datasource';
import { ORGS_ENDPOINT } from './endpoints';

// ═══════════════════════════════════════════════════════════════════════════
// API DATA SOURCE
// ═══════════════════════════════════════════════════════════════════════════

export const orgsApiDataSource: OrgsDataSource = {
    async list(): Promise<OrgRecord[]> {
        const res = await fetch(ORGS_ENDPOINT, {
            method: 'GET',
            credentials: 'include',
        });
        if (!res.ok) {
            throw new Error(`Failed to fetch organizations: ${res.statusText}`);
        }
        const json = await res.json();
        return json.data?.organizations || json.organizations || [];
    },

    async create(data: OrgFormData): Promise<OrgRecord> {
        const res = await fetch(ORGS_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                name: data.name,
                slug: data.slug || data.name.toLowerCase().replace(/\s+/g, '-'),
                plan: data.plan || 'free',
                domain: data.domain || null,
            }),
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || `Failed to create organization: ${res.statusText}`);
        }
        const result = await res.json();
        return result.organization;
    },

    async update(id: string, data: Partial<OrgFormData>): Promise<OrgRecord> {
        const res = await fetch(`${ORGS_ENDPOINT}/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(data),
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || `Failed to update organization: ${res.statusText}`);
        }
        const result = await res.json();
        return result.organization;
    },

    async remove(id: string): Promise<void> {
        const res = await fetch(`${ORGS_ENDPOINT}/${id}`, {
            method: 'DELETE',
            credentials: 'include',
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || `Failed to disable organization: ${res.statusText}`);
        }
    },
};
