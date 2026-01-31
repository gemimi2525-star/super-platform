/**
 * ═══════════════════════════════════════════════════════════════════════════
 * API Users Data Source
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Real data source connecting to /api/platform/users
 * 
 * @module components/os-shell/apps/users/datasources/api
 * @version 1.0.0
 */

import type { User, UserFormData, UsersDataSource } from '../types';

// ═══════════════════════════════════════════════════════════════════════════
// TYPE MAPPING
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

function mapPlatformUserToUser(pu: PlatformUser): User {
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

export const apiDataSource: UsersDataSource = {
    async listUsers(): Promise<User[]> {
        try {
            const res = await fetch('/api/platform/users', {
                credentials: 'include',
            });

            if (!res.ok) {
                console.error('[ApiDataSource] Failed to fetch users:', res.status);
                return [];
            }

            const data = await res.json();
            const users: PlatformUser[] = data.users || [];

            return users.map(mapPlatformUserToUser);
        } catch (error) {
            console.error('[ApiDataSource] Error fetching users:', error);
            return [];
        }
    },

    async getUser(id: string): Promise<User | null> {
        try {
            const res = await fetch(`/api/platform/users/${id}`, {
                credentials: 'include',
            });

            if (!res.ok) return null;

            const data = await res.json();
            return data.user ? mapPlatformUserToUser(data.user) : null;
        } catch (error) {
            console.error('[ApiDataSource] Error fetching user:', error);
            return null;
        }
    },

    async createUser(data: UserFormData): Promise<User> {
        const res = await fetch('/api/platform/users', {
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
        return mapPlatformUserToUser(result.user);
    },

    async updateUser(id: string, data: Partial<UserFormData>): Promise<User> {
        const updateData: Record<string, unknown> = {};
        if (data.name) updateData.displayName = data.name;
        if (data.email) updateData.email = data.email;
        if (data.role) updateData.role = data.role;
        if (data.status) updateData.enabled = data.status === 'active';

        const res = await fetch(`/api/platform/users/${id}`, {
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
        return mapPlatformUserToUser(result.user);
    },

    async disableUser(id: string): Promise<void> {
        const res = await fetch(`/api/platform/users/${id}`, {
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
