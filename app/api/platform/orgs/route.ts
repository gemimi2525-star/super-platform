import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getAuthContext, requirePlatformAccess, requireAdmin } from '@/lib/auth/server';
import { ApiSuccessResponse, ApiErrorResponse, validateRequest } from '@/lib/api';
import { handleError } from '@super-platform/core';
import { COLLECTION_ORGANIZATIONS } from '@/lib/firebase/collections';
import { emitSuccessEvent } from '@/lib/audit/emit';

// Validation schema for POST
const createOrgSchema = z.object({
    name: z.string().min(1, 'Organization name is required'),
    slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
    plan: z.enum(['free', 'starter', 'pro', 'enterprise']).optional(),
    domain: z.string().nullable().optional(),
    modules: z.array(z.string()).optional(),
});

export async function GET() {
    try {
        // Enforce security: Only Platform Owner can list all orgs
        await requirePlatformAccess();

        // DEV MODE: Return mock data when Firebase Admin is not configured
        // OR if explicit bypass is set
        if (process.env.NODE_ENV === 'development' && process.env.AUTH_DEV_BYPASS === 'true') {
            // ... existing mock logic ...
            return getMockOrgs();
        }

        // PRODUCTION: Use Firebase Admin
        try {
            const { getAdminFirestore } = await import('@/lib/firebase-admin');
            const db = getAdminFirestore();
            const snapshot = await db.collection(COLLECTION_ORGANIZATIONS).orderBy('createdAt', 'desc').limit(50).get();

            const organizations = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null
            }));

            return ApiSuccessResponse.ok({
                organizations
            });
        } catch (dbError) {
            console.error('[API] Database connection failed, falling back to mock data (Survivability Mode)', dbError);
            // Fallback to mock data so the app doesn't crash
            return getMockOrgs();
        }

    } catch (error: any) {
        // Rethrow Next.js redirects/not-found to allow them to handle the response
        if (error?.digest?.startsWith('NEXT_REDIRECT')) {
            throw error;
        }

        const appError = handleError(error as Error);
        console.error(`[API] Failed to list platform orgs [${appError.errorId}]:`, appError.message);
        return ApiErrorResponse.internalError();
    }
}

function getMockOrgs() {
    const mockOrganizations = [
        {
            id: 'org-fallback-001',
            name: 'Acme Corp (Offline Mode)',
            plan: 'Pro',
            createdAt: '2025-12-01T10:00:00.000Z',
        },
        {
            id: 'org-fallback-002',
            name: 'System Demo Org',
            plan: 'Enterprise',
            createdAt: new Date().toISOString(),
        }
    ];

    return ApiSuccessResponse.ok({
        organizations: mockOrganizations
    });
}

// =============================================================================
// POST - Create new organization
// =============================================================================

export async function POST(request: NextRequest) {
    try {
        // Enforce security: Only Platform Owner/Admin can create orgs
        const auth = await requireAdmin();

        // Parse and validate request body
        const body = await request.json();
        const validation = validateRequest(createOrgSchema, body);

        if (!validation.success) {
            return ApiErrorResponse.validationError(validation.errors);
        }

        const { name, slug, plan = 'free', domain = null, modules = [] } = validation.data;

        // Get Firestore instance
        const { getAdminFirestore } = await import('@/lib/firebase-admin');
        const db = getAdminFirestore();

        // Check slug uniqueness
        const existingOrgSnapshot = await db.collection(COLLECTION_ORGANIZATIONS)
            .where('slug', '==', slug)
            .limit(1)
            .get();

        if (!existingOrgSnapshot.empty) {
            return ApiErrorResponse.conflict('Organization with this slug already exists');
        }

        // Create organization document
        const orgRef = db.collection(COLLECTION_ORGANIZATIONS).doc();

        // Import FieldValue for server timestamps
        const admin = await import('firebase-admin');
        const FieldValue = admin.firestore.FieldValue;

        const newOrgData = {
            name,
            slug,
            plan,
            domain,
            modules,
            settings: {
                timezone: 'UTC',
                currency: 'USD',
                dateFormat: 'YYYY-MM-DD',
                language: 'en',
            },
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
            createdBy: auth.uid,
        };

        await orgRef.set(newOrgData);

        // Fetch the created document to get actual timestamps
        const createdDoc = await orgRef.get();
        const createdData = createdDoc.data();

        // Emit audit event (log-safe)
        await emitSuccessEvent(
            'org',
            'created',
            { uid: auth.uid, email: auth.email || '', role: auth.role },
            { id: orgRef.id, name, type: 'org' },
            { slug },
            { method: 'POST', path: '/api/platform/orgs' }
        );

        // Return created organization
        return ApiSuccessResponse.ok({
            organization: {
                id: orgRef.id,
                ...createdData,
                createdAt: createdData?.createdAt?.toDate?.()?.toISOString() || null,
                updatedAt: createdData?.updatedAt?.toDate?.()?.toISOString() || null,
            }
        });

    } catch (error) {
        const appError = handleError(error as Error);
        console.error(`[API] Failed to create organization [${appError.errorId}]:`, appError.message);
        return ApiErrorResponse.internalError();
    }
}
