/**
 * ═══════════════════════════════════════════════════════════════════════════
 * USERS APP — Mock Data Source
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Mock implementation of UsersDataSource for Phase VII.
 * Will be replaced with real Firebase in Phase IX.
 * 
 * @module components/os-shell/apps/users/mock
 * @version 1.0.0
 */

import type { User, UserFormData, UsersDataSource } from './types';

// ═══════════════════════════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════════════════════════

const MOCK_USERS: User[] = [
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

let mockUsers = [...MOCK_USERS];

function generateId(): string {
    return `usr_${Date.now().toString(36)}`;
}

export const mockDataSource: UsersDataSource = {
    async listUsers(): Promise<User[]> {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 100));
        return [...mockUsers];
    },

    async getUser(id: string): Promise<User | null> {
        await new Promise(resolve => setTimeout(resolve, 50));
        return mockUsers.find(u => u.id === id) || null;
    },

    async createUser(data: UserFormData): Promise<User> {
        await new Promise(resolve => setTimeout(resolve, 150));
        const user: User = {
            id: generateId(),
            ...data,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
        mockUsers.push(user);
        return user;
    },

    async updateUser(id: string, data: Partial<UserFormData>): Promise<User> {
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

    async disableUser(id: string): Promise<void> {
        await new Promise(resolve => setTimeout(resolve, 100));
        const index = mockUsers.findIndex(u => u.id === id);
        if (index !== -1) {
            mockUsers[index].status = 'inactive';
            mockUsers[index].updatedAt = Date.now();
        }
    },
};

/**
 * Reset mock data (for testing)
 */
export function resetMockData(): void {
    mockUsers = [...MOCK_USERS];
}
