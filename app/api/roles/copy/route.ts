import { NextRequest } from 'next/server';
import { z } from 'zod';
import { copyRole } from '@/lib/roles/service';
import { requireOwner } from '@/lib/auth/server';
import { ApiSuccessResponse, ApiErrorResponse, validateRequest } from '@/lib/api';
import { handleError } from '@super-platform/core';
import { emitSuccessEvent } from '@/lib/audit/emit';

// Validation schema for POST
const copyRoleSchema = z.object({
    sourceRoleId: z.string().min(1, 'Source role ID is required'),
    newName: z.string().min(1, 'New name is required'),
});

export async function POST(req: NextRequest) {
    try {
        const auth = await requireOwner();
        const body = await req.json();

        // Validate request body
        const validation = validateRequest(copyRoleSchema, body);
        if (!validation.success) {
            return ApiErrorResponse.validationError(validation.errors);
        }

        const { sourceRoleId, newName } = validation.data;

        const id = await copyRole(sourceRoleId, newName);

        // Log audit
        await emitSuccessEvent(
            'role',
            'copied',
            { uid: auth.uid, email: auth.email || '', role: auth.role },
            { id, name: newName, type: 'role' },
            { sourceRoleId },
            { method: 'POST', path: '/api/roles/copy' }
        );

        return ApiSuccessResponse.created({ id });
    } catch (error: any) {
        const appError = handleError(error as Error);
        console.error(`[API] Failed to copy role [${appError.errorId}]:`, (error as Error).message || String(error));

        // Check if it's a business logic error
        const errorMessage = (error as Error).message || String(error);
        if (errorMessage.includes('not found') || errorMessage.includes('does not exist')) {
            return ApiErrorResponse.notFound('Role');
        }
        if (errorMessage.includes('system role') || errorMessage.includes('cannot copy')) {
            return ApiErrorResponse.badRequest(errorMessage);
        }

        return ApiErrorResponse.internalError();
    }
}
