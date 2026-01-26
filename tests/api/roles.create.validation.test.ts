/**
 * Smoke Test: POST /api/roles - Validation Error
 * 
 * ทดสอบว่า endpoint คืน validation error ตามมาตรฐาน API contract เมื่อ input ไม่ถูกต้อง:
 * - Status 400
 * - { success: false, error: { code: 'VALIDATION_ERROR', errors: [...], errorId, timestamp } }
 */

import { describe, it, expect, vi } from 'vitest';
import { POST } from '@/app/api/roles/route';
import { createMockRequest, parseResponse } from '../setup';

// Mock auth
vi.mock('@/lib/auth/server', () => ({
    requireOwner: vi.fn().mockResolvedValue({ uid: 'test-owner' }),
}));

// Mock createRole - ไม่ควรถูกเรียกเพราะ validation จะ fail ก่อน
vi.mock('@/lib/roles/service', () => ({
    createRole: vi.fn().mockRejectedValue(new Error('Should not be called')),
}));

describe('POST /api/roles - Validation Error Contract', () => {
    it('should return 400 with VALIDATION_ERROR when name is missing', async () => {
        // Arrange - สร้าง request ที่ไม่มี name (ผิดเงื่อนไข)
        const request = createMockRequest({
            url: 'http://localhost:3000/api/roles',
            method: 'POST',
            body: {
                description: 'Test role without name',
                permissions: [],
            },
        });

        // Act
        const response = await POST(request);
        const { status, data } = await parseResponse(response);

        // Assert - Status Code
        expect(status).toBe(400);

        // Assert - Error Response Contract
        expect(data).toHaveProperty('success');
        expect(data.success).toBe(false);

        // Assert - Error Structure
        expect(data).toHaveProperty('error');
        expect(data.error).toHaveProperty('code');
        expect(data.error.code).toBe('VALIDATION_ERROR');

        // Assert - Error ID และ Timestamp
        expect(data.error).toHaveProperty('errorId');
        expect(data.error.errorId).toBeTruthy();
        expect(typeof data.error.errorId).toBe('string');

        expect(data.error).toHaveProperty('timestamp');
        expect(data.error.timestamp).toBeTruthy();
        expect(typeof data.error.timestamp).toBe('string');

        // Assert - Field-Level Errors
        expect(data.error).toHaveProperty('errors');
        expect(Array.isArray(data.error.errors)).toBe(true);
        expect(data.error.errors.length).toBeGreaterThan(0);

        // Assert - Name field error
        const nameError = data.error.errors.find((err: any) => err.field === 'name');
        expect(nameError).toBeDefined();
        expect(nameError).toHaveProperty('message');
        expect(nameError).toHaveProperty('code');
    });

    it('should return VALIDATION_ERROR when name is empty string', async () => {
        // Arrange - ส่ง name เป็น empty string
        const request = createMockRequest({
            url: 'http://localhost:3000/api/roles',
            method: 'POST',
            body: {
                name: '',
                description: 'Test role',
                permissions: [],
            },
        });

        // Act
        const response = await POST(request);
        const { status, data } = await parseResponse(response);

        // Assert
        expect(status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('VALIDATION_ERROR');

        // ต้องมี error สำหรับ name field
        const nameError = data.error.errors.find((err: any) => err.field === 'name');
        expect(nameError).toBeDefined();
        expect(nameError?.message).toContain('required');
    });

    it('should have all required error response fields', async () => {
        // Arrange
        const request = createMockRequest({
            url: 'http://localhost:3000/api/roles',
            method: 'POST',
            body: {}, // Empty body
        });

        // Act
        const response = await POST(request);
        const { data } = await parseResponse(response);

        // Assert - ตรวจสอบว่ามีทุก field ที่ต้องการ
        expect(data.error).toMatchObject({
            code: expect.any(String),
            message: expect.any(String),
            errorId: expect.any(String),
            timestamp: expect.any(String),
            errors: expect.any(Array),
        });

        // Assert - แต่ละ field error ต้องมี structure ครบ
        data.error.errors.forEach((err: any) => {
            expect(err).toHaveProperty('field');
            expect(err).toHaveProperty('message');
            expect(err).toHaveProperty('code');
            expect(typeof err.field).toBe('string');
            expect(typeof err.message).toBe('string');
        });
    });
});
