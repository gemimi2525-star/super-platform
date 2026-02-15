import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getAuthContext } from '@/lib/auth/server';
import { ApiSuccessResponse, ApiErrorResponse, validateRequest } from '@/lib/api';
import { isQuotaError } from '@/lib/firebase-admin';
import { handleError } from '@super-platform/core';
import { emitSuccessEvent } from '@/lib/audit/emit';
import { cachedFetch, cacheInvalidate, type CacheStatus } from '@/lib/cache/ttl-cache';

// Canonical collection name (Phase 12)
const COLLECTION_ORGANIZATIONS = 'platform_organizations';
const CACHE_KEY_ORGS_LIST = 'orgs:list';

export const runtime = 'nodejs';

// Validation schema for POST
const createOrgSchema = z.object({
    name: z.string().min(1, 'Organization name is required'),
    slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
    plan: z.enum(['free', 'starter', 'pro', 'enterprise']).optional(),
    domain: z.string().nullable().optional(),
    modules: z.array(z.string()).optional(),
});

// Org shape returned from cache
interface CachedOrg {
    id: string;
    name: string;
    slug: string;
    plan: string;
    domain?: string | null;
    status?: string;
    createdAt: string | null;
    [key: string]: unknown;
}

/**
 * Helper: add cache-related headers to response
 */
function withCacheHeaders(response: Response, cacheStatus: CacheStatus): Response {
    response.headers.set('Cache-Control', 'private, max-age=30');
    response.headers.set('X-Cache', cacheStatus);
    response.headers.set('X-Cache-Key', CACHE_KEY_ORGS_LIST);
    return response;
}

export async function GET(request: NextRequest) {
    try {
        // ═══════════════════════════════════════════════════════════════════════════
        // PHASE 9.9: DEV BYPASS — Check FIRST before auth
        // ═══════════════════════════════════════════════════════════════════════════
        if (process.env.NODE_ENV === 'development' && process.env.AUTH_DEV_BYPASS === 'true') {
            console.log('[API:Orgs] Dev bypass mode - returning mock orgs');
            return getMockOrgs();
        }

        const auth = await getAuthContext(request);

        if (!auth) {
            return ApiErrorResponse.unauthorized('Session expired or invalid');
        }

        // ═══════════════════════════════════════════════════════════════════
        // Phase 27C.8: TTL Cache + Stale-While-Revalidate
        // ═══════════════════════════════════════════════════════════════════

        const fetcher = async (): Promise<CachedOrg[]> => {
            const { getAdminFirestore } = await import('@/lib/firebase-admin');
            const db = getAdminFirestore();

            const snapshot = await db.collection(COLLECTION_ORGANIZATIONS)
                .orderBy('createdAt', 'desc')
                .limit(50)
                .get();

            return snapshot.docs.map((doc: any) => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
            }));
        };

        let organizations: CachedOrg[];
        let cacheStatus: CacheStatus;

        try {
            const result = await cachedFetch<CachedOrg[]>(CACHE_KEY_ORGS_LIST, fetcher);
            organizations = result.value;
            cacheStatus = result.status;
            console.log(`[API:Orgs] Cache ${cacheStatus} — ${organizations.length} orgs`);
        } catch {
            // cachedFetch threw = MISS + fetch failed + no stale data
            return ApiErrorResponse.serviceUnavailable(
                'Database service is currently unavailable due to high traffic (Quota). Please try again later.',
                60
            );
        }

        const response = ApiSuccessResponse.ok({
            organizations,
            authMode: 'REAL',
        });
        return withCacheHeaders(response, cacheStatus);

    } catch (error: any) {
        if (isQuotaError(error)) {
            return ApiErrorResponse.serviceUnavailable(
                'Database service is currently unavailable due to high traffic (Quota). Please try again later.',
                60
            );
        }

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

        // Phase 27C.8: Invalidate orgs list cache after mutation
        cacheInvalidate(CACHE_KEY_ORGS_LIST);

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
