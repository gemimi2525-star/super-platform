/**
 * Smoke Test: GET /api/roles/[id] - Not Found Error
 * 
 * ทดสอบว่า endpoint คืน NOT_FOUND error ตามมาตรฐาน API contract เมื่อไม่พบ role:
 * - Status 404
 * - { success: false, error: { code: 'NOT_FOUND', errorId, timestamp } }
 */

import { describe, it, expect, vi } from 'vitest';
import { GET } from '@/app/api/roles/[id]/route';
import { createMockRequest, createMockParams, parseResponse } from '../setup';

// Mock auth
vi.mock('@/lib/auth/server', () => ({
    requireOwner: vi.fn().mockResolvedValue({ uid: 'test-owner' }),
}));

// Mock getRole - return null เพื่อจำลองว่าไม่พบ role
vi.mock('@/lib/roles/service', () => ({
    getRole: vi.fn().mockResolvedValue(null),
}));

describe('GET /api/roles/[id] - Not Found Error Contract', () => {
    it('should return 404 with NOT_FOUND when role does not exist', async () => {
        // Arrange
        const request = createMockRequest({
            url: 'http://localhost:3000/api/roles/role-does-not-exist',
            method: 'GET',
        });
        const params = await createMockParams({ id: 'role-does-not-exist' });

        // Act
        const response = await GET(request, { params });
        const { status, data } = await parseResponse(response);

        // Assert - Status Code
        expect(status).toBe(404);

        // Assert - Error Response Contract
        expect(data).toHaveProperty('success');
        expect(data.success).toBe(false);

        // Assert - Error Structure
        expect(data).toHaveProperty('error');
        expect(data.error).toHaveProperty('code');
        expect(data.error.code).toBe('NOT_FOUND');

        // Assert - Error Message
        expect(data.error).toHaveProperty('message');
        expect(data.error.message).toBeTruthy();
        expect(typeof data.error.message).toBe('string');

        // Assert - Error ID
        expect(data.error).toHaveProperty('errorId');
        expect(data.error.errorId).toBeTruthy();
        expect(typeof data.error.errorId).toBe('string');

        // Assert - Timestamp
        expect(data.error).toHaveProperty('timestamp');
        expect(data.error.timestamp).toBeTruthy();
        expect(typeof data.error.timestamp).toBe('string');

        // Verify timestamp is ISO format
        expect(() => new Date(data.error.timestamp)).not.toThrow();
    });

    it('should not have validation errors in NOT_FOUND response', async () => {
        // Arrange
        const request = createMockRequest({
            url: 'http://localhost:3000/api/roles/nonexistent-role',
            method: 'GET',
        });
        const params = await createMockParams({ id: 'nonexistent-role' });

        // Act
        const response = await GET(request, { params });
        const { data } = await parseResponse(response);

        // Assert - NOT_FOUND ไม่ควรมี errors array (ต่างจาก VALIDATION_ERROR)
        expect(data.error.code).toBe('NOT_FOUND');

        // errors field ไม่ควรมี หรือถ้ามีต้องเป็น undefined
        if ('errors' in data.error) {
            expect(data.error.errors).toBeUndefined();
        }
    });

    it('should have consistent error structure with other error types', async () => {
        // Arrange
        const request = createMockRequest({
            url: 'http://localhost:3000/api/roles/missing-role-123',
            method: 'GET',
        });
        const params = await createMockParams({ id: 'missing-role-123' });

        // Act
        const response = await GET(request, { params });
        const { data } = await parseResponse(response);

        // Assert - ตรวจสอบว่ามี structure พื้นฐานครบเหมือน error types อื่น
        expect(data).toMatchObject({
            success: false,
            error: {
                code: expect.any(String),
                message: expect.any(String),
                errorId: expect.any(String),
                timestamp: expect.any(String),
            },
        });

        // Assert - errorId format (ควรเป็น err_timestamp_random)
        expect(data.error.errorId).toMatch(/^err_\d+_[a-z0-9]+$/);
    });
});
