/**
 * TEST ROUTE: Success Response Patterns
 * 
 * This route tests all ApiSuccessResponse methods.
 * Used to verify infrastructure works correctly.
 * DELETE THIS FILE after migration is complete.
 */

import { NextRequest } from 'next/server';
import { ApiSuccessResponse } from '@/lib/api';

export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;
    const responseType = searchParams.get('type') || 'ok';

    switch (responseType) {
        case 'ok':
            return ApiSuccessResponse.ok({
                message: 'Success',
                data: { id: 1, name: 'Test User' },
            });

        case 'created':
            return ApiSuccessResponse.created({
                message: 'Resource created',
                data: { id: 2, name: 'New User' },
            });

        case 'no-content':
            return ApiSuccessResponse.noContent();

        default:
            return ApiSuccessResponse.ok({
                message: 'Specify type: ok, created, no-content',
            });
    }
}
