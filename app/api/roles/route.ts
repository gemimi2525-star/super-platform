import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getRoles, createRole } from '@/lib/roles/service';
import { requireOwner } from '@/lib/auth/server';
import { ApiSuccessResponse, ApiErrorResponse, validateRequest } from '@/lib/api';
import { handleError } from '@super-platform/core';
import { logApiError } from '@/lib/api/logging';
import { emitSuccessEvent } from '@/lib/audit/emit';

// Validation schema for POST
const createRoleSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    permissions: z.array(z.string()).optional(),
});

export async function GET(req: NextRequest) {
    try {
        // Only Platform Owner/Admin can view roles
        await requireOwner();

        // Extract locale from URL pathname (e.g., /th/api/roles -> th)
        const pathname = req.nextUrl.pathname;
        const localeMatch = pathname.match(/^\/(en|th)\//);
        const locale = (localeMatch?.[1] as 'en' | 'th') || 'en';

        const roles = await getRoles(locale);
        return ApiSuccessResponse.ok(roles);
    } catch (error) {
        const appError = handleError(error as Error);
        logApiError({
            method: 'GET',
            path: '/api/roles',
            errorId: appError.errorId,
            message: (error as Error).message || String(error),
        });
        return ApiErrorResponse.internalError();
    }
}

export async function POST(req: NextRequest) {
    try {
        const auth = await requireOwner();

        const body = await req.json();

        // Validate request body
        const validation = validateRequest(createRoleSchema, body);
        if (!validation.success) {
            return ApiErrorResponse.validationError(validation.errors);
        }

        const { name, description, permissions } = validation.data;

        const id = await createRole({
            name,
            description: description || '',
            permissions: permissions || [],
        });

        // Log audit
        await emitSuccessEvent(
            'role',
            'created',
            { uid: auth.uid, email: auth.email || '', role: auth.role },
            { id, name, type: 'role' },
            { description: description || '', permissionsCount: permissions?.length || 0 },
            { method: 'POST', path: '/api/roles' }
        );

        return ApiSuccessResponse.created({ id });
    } catch (error) {
        const appError = handleError(error as Error);
        logApiError({
            method: 'POST',
            path: '/api/roles',
            errorId: appError.errorId,
            message: (error as Error).message || String(error),
        });
        return ApiErrorResponse.internalError();
    }
}
