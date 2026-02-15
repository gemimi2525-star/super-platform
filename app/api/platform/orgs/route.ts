import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getAuthContext } from '@/lib/auth/server';
import { ApiSuccessResponse, ApiErrorResponse, validateRequest } from '@/lib/api';
import { withQuotaGuard, isQuotaError } from '@/lib/firebase-admin';
import { handleError } from '@super-platform/core';
import { emitSuccessEvent } from '@/lib/audit/emit';

// Canonical collection name (Phase 12)
const COLLECTION_ORGANIZATIONS = 'platform_organizations';

export const runtime = 'nodejs';

// Validation schema for POST
const createOrgSchema = z.object({
    name: z.string().min(1, 'Organization name is required'),
    slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
    plan: z.enum(['free', 'starter', 'pro', 'enterprise']).optional(),
    domain: z.string().nullable().optional(),
    modules: z.array(z.string()).optional(),
});

export async function GET(request: NextRequest) {
    try {
        // ═══════════════════════════════════════════════════════════════════════════
        // PHASE 9.9: DEV BYPASS — Check FIRST before auth (same pattern as Users API)
        // ═══════════════════════════════════════════════════════════════════════════
        if (process.env.NODE_ENV === 'development' && process.env.AUTH_DEV_BYPASS === 'true') {
            console.log('[API:Orgs] Dev bypass mode - returning mock orgs');
            return getMockOrgs();
        }

        const auth = await getAuthContext(request);

        if (!auth) {
            return ApiErrorResponse.unauthorized('Session expired or invalid');
        }

        // PRODUCTION: Use Firebase Admin with Quota Guard
        try {
            const { getAdminFirestore } = await import('@/lib/firebase-admin');
            const db = getAdminFirestore();

            // Mock Data for Quota Bypass
            const MOCK_ORGS_FALLBACK = [
                {
                    id: 'org-fallback-quota-001',
                    name: 'Acme Corp (Quota Bypass)',
                    slug: 'acme-corp',
                    plan: 'pro',
                    domain: 'acme.example.com',
                    status: 'active',
                    createdAt: { toDate: () => new Date('2025-12-01T10:00:00.000Z') },
                },
                {
                    id: 'org-fallback-quota-002',
                    name: 'System Demo Org (Quota Bypass)',
                    slug: 'system-demo',
                    plan: 'enterprise',
                    domain: 'demo.apicoredata.local',
                    status: 'active',
                    createdAt: { toDate: () => new Date() },
                }
            ];

            const snapshot = await withQuotaGuard(
                () => db.collection(COLLECTION_ORGANIZATIONS).orderBy('createdAt', 'desc').limit(50).get(),
                // @ts-ignore - Mocking QuerySnapshot for fallback
                { docs: MOCK_ORGS_FALLBACK.map(o => ({ id: o.id, data: () => o })) }
            );

            let organizations;

            if ('docs' in snapshot) {
                organizations = snapshot.docs.map((doc: any) => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null
                }));
            } else {
                organizations = [];
            }

            // Phase 27C.5: Add Cache-Control to reduce Firestore reads
            const response = ApiSuccessResponse.ok({
                organizations,
                authMode: 'REAL'
            });
            response.headers.set('Cache-Control', 'private, max-age=30');
            return response;
        } catch (dbError: any) {

            // Handle Quota Error specifically with 503
            if (isQuotaError(dbError) || dbError?.code === 'SERVICE_UNAVAILABLE') {
                return ApiErrorResponse.serviceUnavailable(
                    'Database service is currently unavailable due to high traffic (Quota). Please try again later.',
                    60
                );
            }

            console.error('[API] Database connection failed:', dbError?.message || dbError);

            if (process.env.NODE_ENV === 'development') {
                return getMockOrgs();
            }

            return new Response(JSON.stringify({
                success: false,
                error: {
                    code: 'SERVICE_UNAVAILABLE',
                    message: 'Database service is currently unavailable. Please try again later.',
                    degraded: true
                }
            }), {
                status: 503,
                headers: { 'Content-Type': 'application/json' }
            });
        }

    } catch (error: any) {
        if (error?.digest?.startsWith('NEXT_REDIRECT')) {
            console.error('[API] Prevented Redirect in API Route');
            return ApiErrorResponse.internalError('Server attempted redirect, blocked by JSON-only policy');
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
            name: 'Acme Corp (Dev Bypass)',
            slug: 'acme-corp',
            plan: 'pro',  // Phase 9.9: lowercase to match UI theme
            domain: 'acme.example.com',
            status: 'active',
            createdAt: '2025-12-01T10:00:00.000Z',
        },
        {
            id: 'org-fallback-002',
            name: 'System Demo Org',
            slug: 'system-demo',
            plan: 'enterprise',  // Phase 9.9: lowercase to match UI theme
            domain: 'demo.apicoredata.local',
            status: 'active',
            createdAt: new Date().toISOString(),
        }
    ];

    return ApiSuccessResponse.ok({
        organizations: mockOrganizations,
        authMode: 'DEV_BYPASS'
    });
}

// =============================================================================
// POST - Create new organization
// =============================================================================

export async function POST(request: NextRequest) {
    try {
        const auth = await getAuthContext(request);
        if (!auth) {
            return ApiErrorResponse.unauthorized('Session expired');
        }
        if (!['owner', 'admin'].includes(auth.role)) {
            return ApiErrorResponse.forbidden('Requires admin role');
        }

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

    } catch (error: any) {
        if (error?.digest?.startsWith('NEXT_REDIRECT')) {
            return ApiErrorResponse.forbidden('Redirect blocked in API');
        }
        const appError = handleError(error as Error);
        console.error(`[API] Failed to create organization [${appError.errorId}]:`, appError.message);
        return ApiErrorResponse.internalError();
    }
}
