/**
 * Platform Organization Detail API
 * 
 * GET - Get organization details by ID
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requirePlatformAccess, requireOwner, requireAdmin } from '@/lib/auth/server';
import { ApiSuccessResponse, ApiErrorResponse, validateRequest } from '@/lib/api';
import { handleError } from '@super-platform/core';
import { COLLECTION_ORGANIZATIONS } from '@/lib/firebase/collections';
import { emitSuccessEvent } from '@/lib/audit/emit';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// =============================================================================
// GET - Get organization by ID
// =============================================================================

export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        // Enforce security: Only Platform Owner can view org details
        await requirePlatformAccess();

        // Get organization ID from route params
        const { id } = await params;

        if (!id) {
            return ApiErrorResponse.badRequest('Organization ID is required');
        }

        // Get Firestore instance
        const { getAdminFirestore } = await import('@/lib/firebase-admin');
        const db = getAdminFirestore();

        // Fetch organization document
        const orgDoc = await db.collection(COLLECTION_ORGANIZATIONS).doc(id).get();

        if (!orgDoc.exists) {
            return ApiErrorResponse.notFound('Organization');
        }

        // Build organization object
        const orgData = orgDoc.data();
        const organization = {
            id: orgDoc.id,
            ...orgData,
            createdAt: orgData?.createdAt?.toDate?.()?.toISOString() || null,
            updatedAt: orgData?.updatedAt?.toDate?.()?.toISOString() || null,
        };

        return ApiSuccessResponse.ok({
            organization
        });

    } catch (error) {
        const appError = handleError(error as Error);
        console.error(`[API] Failed to get organization [${appError.errorId}]:`, appError.message);
        return ApiErrorResponse.internalError();
    }
}

// =============================================================================
// PATCH - Update organization
// =============================================================================

// Validation schema for PATCH
const updateOrgSchema = z.object({
    name: z.string().min(1, 'Organization name must not be empty').optional(),
    slug: z.string().min(1, 'Slug must not be empty').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens').optional(),
    plan: z.enum(['free', 'starter', 'pro', 'enterprise']).optional(),
    domain: z.string().nullable().optional(),
    logoURL: z.string().nullable().optional(),
    modules: z.array(z.string()).optional(),
    settings: z.object({
        timezone: z.string().optional(),
        currency: z.string().optional(),
        dateFormat: z.string().optional(),
        language: z.string().optional(),
    }).optional(),
});

export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        // Enforce security: Only Platform Owner/Admin can update orgs
        const auth = await requireAdmin();

        // Get organization ID from route params
        const { id } = await params;

        if (!id) {
            return ApiErrorResponse.badRequest('Organization ID is required');
        }

        // Parse and validate request body
        const body = await request.json();
        const validation = validateRequest(updateOrgSchema, body);

        if (!validation.success) {
            return ApiErrorResponse.validationError(validation.errors);
        }

        // Get Firestore instance
        const { getAdminFirestore } = await import('@/lib/firebase-admin');
        const db = getAdminFirestore();

        // Fetch existing organization
        const orgDoc = await db.collection(COLLECTION_ORGANIZATIONS).doc(id).get();

        if (!orgDoc.exists) {
            return ApiErrorResponse.notFound('Organization');
        }

        const existingOrg = orgDoc.data();

        // Check slug uniqueness if slug is being changed
        if (validation.data.slug && validation.data.slug !== existingOrg?.slug) {
            const existingSlugSnapshot = await db.collection(COLLECTION_ORGANIZATIONS)
                .where('slug', '==', validation.data.slug)
                .limit(1)
                .get();

            if (!existingSlugSnapshot.empty) {
                return ApiErrorResponse.conflict('Organization with this slug already exists');
            }
        }

        // Build update data with only provided fields
        const admin = await import('firebase-admin');
        const FieldValue = admin.firestore.FieldValue;

        const updateData: Record<string, any> = {
            updatedAt: FieldValue.serverTimestamp(),
        };

        // Add provided fields
        if (validation.data.name !== undefined) updateData.name = validation.data.name;
        if (validation.data.slug !== undefined) updateData.slug = validation.data.slug;
        if (validation.data.plan !== undefined) updateData.plan = validation.data.plan;
        if (validation.data.domain !== undefined) updateData.domain = validation.data.domain;
        if (validation.data.logoURL !== undefined) updateData.logoURL = validation.data.logoURL;
        if (validation.data.modules !== undefined) updateData.modules = validation.data.modules;

        // Merge settings if provided
        if (validation.data.settings) {
            const currentSettings = existingOrg?.settings || {};
            updateData.settings = {
                ...currentSettings,
                ...validation.data.settings,
            };
        }

        // Update document
        await db.collection(COLLECTION_ORGANIZATIONS).doc(id).update(updateData);

        // Fetch updated document
        const updatedDoc = await db.collection(COLLECTION_ORGANIZATIONS).doc(id).get();
        const updatedData = updatedDoc.data();

        // Emit audit event (log-safe)
        const changedFields = Object.keys(updateData).filter(k => k !== 'updatedAt');
        await emitSuccessEvent(
            'org',
            'updated',
            { uid: auth.uid, email: auth.email || '', role: auth.role },
            { id, name: updatedData?.name, type: 'org' },
            { changedFields },
            { method: 'PATCH', path: `/api/platform/orgs/${id}` }
        );

        // Return updated organization
        return ApiSuccessResponse.ok({
            organization: {
                id: updatedDoc.id,
                ...updatedData,
                createdAt: updatedData?.createdAt?.toDate?.()?.toISOString() || null,
                updatedAt: updatedData?.updatedAt?.toDate?.()?.toISOString() || null,
            }
        });

    } catch (error) {
        const appError = handleError(error as Error);
        console.error(`[API] Failed to update organization [${appError.errorId}]:`, appError.message);
        return ApiErrorResponse.internalError();
    }
}

// =============================================================================
// DELETE - Disable organization (soft delete)
// =============================================================================

export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        // Enforce security: Only Platform Owner can disable orgs
        const auth = await requireOwner();

        // Get organization ID from route params
        const { id } = await params;

        if (!id) {
            return ApiErrorResponse.badRequest('Organization ID is required');
        }

        // Get Firestore instance
        const { getAdminFirestore } = await import('@/lib/firebase-admin');
        const db = getAdminFirestore();

        // Fetch organization to verify it exists
        const orgDoc = await db.collection(COLLECTION_ORGANIZATIONS).doc(id).get();

        if (!orgDoc.exists) {
            return ApiErrorResponse.notFound('Organization');
        }

        // Import FieldValue for server timestamps
        const admin = await import('firebase-admin');
        const FieldValue = admin.firestore.FieldValue;

        // Update document to mark as disabled (soft delete)
        await db.collection(COLLECTION_ORGANIZATIONS).doc(id).update({
            disabled: true,
            updatedAt: FieldValue.serverTimestamp(),
        });

        // Emit audit event (log-safe)
        const orgData = orgDoc.data();
        await emitSuccessEvent(
            'org',
            'disabled',
            { uid: auth.uid, email: auth.email || '', role: auth.role },
            { id, name: orgData?.name, type: 'org' },
            {},
            { method: 'DELETE', path: `/api/platform/orgs/${id}` }
        );

        return ApiSuccessResponse.ok({
            message: 'Organization disabled successfully'
        });

    } catch (error) {
        const appError = handleError(error as Error);
        console.error(`[API] Failed to disable organization [${appError.errorId}]:`, appError.message);
        return ApiErrorResponse.internalError();
    }
}
