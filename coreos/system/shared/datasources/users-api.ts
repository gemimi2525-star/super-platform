/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Users API DataSource — Phase 27C.2
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Concrete API implementation using canonical /api/platform/users.
 * Migrated from components/os-shell/apps/users/datasources/api.ts.
 *
 * @module coreos/system/shared/datasources/users-api
 * @version 1.0.0
 */

import type { UserRecord, UserFormData } from '../types';
import type { UsersDataSource } from './users-datasource';
import { USERS_ENDPOINT } from './endpoints';

// ═══════════════════════════════════════════════════════════════════════════
// PLATFORM USER → SHARED USER MAPPING
// ═══════════════════════════════════════════════════════════════════════════

interface PlatformUser {
    uid: string;
    email: string;
    displayName: string;
    role: 'owner' | 'admin' | 'user' | 'viewer';
    enabled: boolean;
    createdAt: string | Date;
    updatedAt: string | Date;
}

function mapPlatformUser(pu: PlatformUser): UserRecord {
    return {
        id: pu.uid,
        name: pu.displayName,
        email: pu.email,
        role: pu.role,
        status: pu.enabled ? 'active' : 'inactive',
        createdAt: new Date(pu.createdAt).getTime(),
        updatedAt: new Date(pu.updatedAt).getTime(),
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// API DATA SOURCE
// ═══════════════════════════════════════════════════════════════════════════

// Phase 27C.8: Track last X-Cache header from API response
let _lastUsersCacheStatus: string | null = null;
export function getLastUsersCacheStatus() { return _lastUsersCacheStatus; }

export const usersApiDataSource: UsersDataSource = {
    async list(): Promise<UserRecord[]> {
        try {
            const res = await fetch(USERS_ENDPOINT, { credentials: 'include' });
            _lastUsersCacheStatus = res.headers.get('X-Cache');
            if (!res.ok) {
                const error = await res.json().catch(() => ({}));
                throw new Error(error.message || `Failed to fetch: ${res.status} ${res.statusText}`);
            }
            const json = await res.json();
            const users: PlatformUser[] = json.data?.users || json.users || [];
            return users.map(mapPlatformUser);
        } catch (error) {
            console.error('[UsersAPI] Error:', error);
            throw error; // Re-throw to let UI handle it
        }
    },

    async get(id: string): Promise<UserRecord | null> {
        try {
            const res = await fetch(`${USERS_ENDPOINT}/${id}`, { credentials: 'include' });
            if (!res.ok) return null;
            const data = await res.json();
            return data.user ? mapPlatformUser(data.user) : null;
        } catch (error) {
            console.error('[UsersAPI] Error fetching user:', error);
            return null;
        }
    },

    async create(data: UserFormData): Promise<UserRecord> {
        const res = await fetch(USERS_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                email: data.email,
                displayName: data.name,
                role: data.role,
            }),
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || 'Failed to create user');
        }
        const result = await res.json();
        return mapPlatformUser(result.user);
    },

    async update(id: string, data: Partial<UserFormData>): Promise<UserRecord> {
        const updateData: Record<string, unknown> = {};
        if (data.name) updateData.displayName = data.name;
        if (data.email) updateData.email = data.email;
        if (data.role) updateData.role = data.role;
        if (data.status) updateData.enabled = data.status === 'active';

        const res = await fetch(`${USERS_ENDPOINT}/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(updateData),
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || 'Failed to update user');
        }
        const result = await res.json();
        return mapPlatformUser(result.user);
    },

    async remove(id: string): Promise<void> {
        const res = await fetch(`${USERS_ENDPOINT}/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ enabled: false }),
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || 'Failed to disable user');
        }
    },
};
