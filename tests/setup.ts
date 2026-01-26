/**
 * Test Setup
 * 
 * Global setup and utilities for API route testing.
 * Provides mock helpers for Next.js Request/Response objects.
 */

import { NextRequest } from 'next/server';

/**
 * สร้าง mock NextRequest สำหรับ testing
 * 
 * @example
 * ```ts
 * const req = createMockRequest({
 *   url: 'http://localhost:3000/api/roles',
 *   method: 'GET',
 * });
 * ```
 */
export function createMockRequest(options: {
    url: string;
    method?: string;
    headers?: Record<string, string>;
    body?: any;
}): NextRequest {
    const { url, method = 'GET', headers = {}, body } = options;

    const init: any = {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...headers,
        },
    };

    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        init.body = JSON.stringify(body);
    }

    return new NextRequest(url, init);
}

/**
 * สร้าง mock params object สำหรับ dynamic routes
 * 
 * @example
 * ```ts
 * const params = createMockParams({ id: 'role-123' });
 * ```
 */
export function createMockParams<T extends Record<string, string>>(
    params: T
): Promise<T> {
    return Promise.resolve(params);
}

/**
 * Parse response เป็น JSON และตรวจสอบ status
 */
export async function parseResponse(response: Response) {
    const data = await response.json();
    return {
        status: response.status,
        data,
    };
}
