/**
 * Smoke Test: GET /api/roles
 * 
 * ทดสอบว่า endpoint คืน response ตามมาตรฐาน API contract:
 * - Status 200
 * - { success: true, data: [...] }
 * - data เป็น array
 */

import { describe, it, expect, vi } from 'vitest';
import { GET } from '@/app/api/roles/route';
import { createMockRequest, parseResponse } from '../setup';

// Mock auth/Firebase dependencies
vi.mock('@/lib/auth/server', () => ({
    requireOwner: vi.fn().mockResolvedValue({ uid: 'test-owner' }),
}));

vi.mock('@/lib/roles/service', () => ({
    getRoles: vi.fn().mockResolvedValue([
        {
            id: 'role-1',
            name: 'Admin',
            description: 'Administrator role',
            permissions: ['*'],
            isSystem: true,
        },
        {
            id: 'role-2',
            name: 'Editor',
            description: 'Content editor',
            permissions: ['content:read', 'content:write'],
            isSystem: false,
        },
    ]),
}));

describe('GET /api/roles - Success Contract', () => {
    it('should return 200 with standardized success response', async () => {
        // Arrange
        const request = createMockRequest({
            url: 'http://localhost:3000/api/roles',
            method: 'GET',
        });

        // Act
        const response = await GET(request);
        const { status, data } = await parseResponse(response);

        // Assert - Status Code
        expect(status).toBe(200);

        // Assert - Response Contract
        expect(data).toHaveProperty('success');
        expect(data.success).toBe(true);

        // Assert - Data Shape
        expect(data).toHaveProperty('data');
        expect(Array.isArray(data.data)).toBe(true);

        // Assert - Data Content (optional, for completeness)
        expect(data.data.length).toBeGreaterThan(0);
        expect(data.data[0]).toHaveProperty('id');
        expect(data.data[0]).toHaveProperty('name');
    });

    it('should return roles array with correct structure', async () => {
        // Arrange
        const request = createMockRequest({
            url: 'http://localhost:3000/api/roles',
            method: 'GET',
        });

        // Act
        const response = await GET(request);
        const { data } = await parseResponse(response);

        // Assert - Each role has required fields
        data.data.forEach((role: any) => {
            expect(role).toHaveProperty('id');
            expect(role).toHaveProperty('name');
            expect(role).toHaveProperty('description');
            expect(role).toHaveProperty('permissions');
            expect(role).toHaveProperty('isSystem');

            // Type checks
            expect(typeof role.id).toBe('string');
            expect(typeof role.name).toBe('string');
            expect(Array.isArray(role.permissions)).toBe(true);
            expect(typeof role.isSystem).toBe('boolean');
        });
    });
});
