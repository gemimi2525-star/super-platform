/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Users Mock DataSource — Phase 27C.2
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Mock implementation for development/testing.
 * Migrated from components/os-shell/apps/users/mock.ts.
 *
 * @module coreos/system/shared/datasources/users-mock
 * @version 1.0.0
 */

import type { UserRecord, UserFormData } from '../types';
import type { UsersDataSource } from './users-datasource';

// ═══════════════════════════════════════════════════════════════════════════
// SEED DATA
// ═══════════════════════════════════════════════════════════════════════════

const SEED_USERS: UserRecord[] = [
    {
        id: 'usr_001',
        name: 'Somchai Admin',
        email: 'somchai@apicoredata.com',
        role: 'owner',
        status: 'active',
        createdAt: Date.now() - 90 * 24 * 60 * 60 * 1000,
        updatedAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
    },
    {
        id: 'usr_002',
        name: 'Nattapong Dev',
        email: 'nattapong@apicoredata.com',
        role: 'admin',
        status: 'active',
        createdAt: Date.now() - 60 * 24 * 60 * 60 * 1000,
        updatedAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
    },
    {
        id: 'usr_003',
        name: 'Siriporn Finance',
        email: 'siriporn@apicoredata.com',
        role: 'user',
        status: 'active',
        createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
        updatedAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
    },
    {
        id: 'usr_004',
        name: 'Prayut Viewer',
        email: 'prayut@apicoredata.com',
        role: 'viewer',
        status: 'inactive',
        createdAt: Date.now() - 120 * 24 * 60 * 60 * 1000,
        updatedAt: Date.now() - 60 * 24 * 60 * 60 * 1000,
    },
    {
        id: 'usr_005',
        name: 'Apinya Support',
        email: 'apinya@apicoredata.com',
        role: 'user',
        status: 'pending',
        createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
        updatedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
    },
];

// ═══════════════════════════════════════════════════════════════════════════
// MOCK DATA SOURCE
// ═══════════════════════════════════════════════════════════════════════════

let mockUsers = [...SEED_USERS];

function generateId(): string {
    return `usr_${Date.now().toString(36)}`;
}

export const usersMockDataSource: UsersDataSource = {
    async list(): Promise<UserRecord[]> {
        await new Promise(resolve => setTimeout(resolve, 100));
        return [...mockUsers];
    },

    async get(id: string): Promise<UserRecord | null> {
        await new Promise(resolve => setTimeout(resolve, 50));
        return mockUsers.find(u => u.id === id) || null;
    },

    async create(data: UserFormData): Promise<UserRecord> {
        await new Promise(resolve => setTimeout(resolve, 150));
        const user: UserRecord = {
            id: generateId(),
            ...data,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
        mockUsers.push(user);
        return user;
    },

    async update(id: string, data: Partial<UserFormData>): Promise<UserRecord> {
        await new Promise(resolve => setTimeout(resolve, 150));
        const index = mockUsers.findIndex(u => u.id === id);
        if (index === -1) throw new Error('User not found');

        mockUsers[index] = {
            ...mockUsers[index],
            ...data,
            updatedAt: Date.now(),
        };
        return mockUsers[index];
    },

    async remove(id: string): Promise<void> {
        await new Promise(resolve => setTimeout(resolve, 100));
        const index = mockUsers.findIndex(u => u.id === id);
        if (index !== -1) {
            mockUsers[index].status = 'inactive';
            mockUsers[index].updatedAt = Date.now();
        }
    },
};

/** Reset mock data (for testing) */
export function resetMockUsers(): void {
    mockUsers = [...SEED_USERS];
}
