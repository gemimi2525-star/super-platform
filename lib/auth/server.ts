/**
 * Server-Side Auth Utilities
 * 
 * Functions to enforce authentication in Server Components (layouts/pages)
 * Used in route group layouts for real auth enforcement
 */

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { NextRequest } from 'next/server';
import { handleError } from '@super-platform/core';
import { emitDenialEvent } from '@/lib/audit/emit';

// Check if Firebase Admin is configured
const IS_ADMIN_CONFIGURED = !!(
    process.env.FIREBASE_PROJECT_ID ||
    process.env.FIREBASE_SERVICE_ACCOUNT
);

import type { PlatformRole, OrgRole, AuthContext } from '@super-platform/core';
import { ROLE_HIERARCHY } from '@super-platform/core';

/**
 * Get auth token from request
 * Priority: Authorization header > session cookie
 */
async function getAuthToken(): Promise<string | null> {
    // Try to get from cookie (Firebase sets it via client SDK)
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('__session')?.value;

    if (sessionCookie) {
        return sessionCookie;
    }

    return null;
}

/**
 * Decode JWT payload without verification (for dev mode only)
 * WARNING: Never use this in production!
 */
function decodeJwtPayload(token: string): any {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) {
            return null;
        }
        // Decode the payload (second part)
        const payload = Buffer.from(parts[1], 'base64').toString('utf8');
        return JSON.parse(payload);
    } catch {
        return null;
    }
}

/**
 * Get current auth context
 * Returns null if not authenticated
 */
// Helper to get header from request or headers()
async function getHeader(key: string, req?: NextRequest): Promise<string | null> {
    if (req) {
        return req.headers.get(key);
    }
    const headerStore = await headers();
    return headerStore.get(key);
}

/**
 * Get current auth context
 * Returns null if not authenticated
 * 
 * @param req - Optional NextRequest (required for header-based context switching)
 */
export async function getAuthContext(req?: NextRequest): Promise<AuthContext | null> {
    try {
        const token = await getAuthToken();
        if (!token) {
            // console.log('[AUTH] No session token found');
            return null;
        }

        // 1. Priority: Verify with Firebase Admin (if configured)
        if (IS_ADMIN_CONFIGURED) {
            const { verifyIdToken, getAdminFirestore } = await import('@/lib/firebase-admin');
            const decodedToken = await verifyIdToken(token);

            // Default role
            let role: PlatformRole = 'user';

            // Check platform_users collection for role
            try {
                const db = getAdminFirestore();
                const platformUserDoc = await db.collection('platform_users').doc(decodedToken.uid).get();

                if (platformUserDoc.exists) {
                    const platformUserData = platformUserDoc.data();
                    if (platformUserData?.enabled !== false) {
                        const dbRole = platformUserData?.role as PlatformRole;
                        if (['owner', 'admin', 'user'].includes(dbRole)) {
                            role = dbRole;
                            // console.log(`[AUTH] ${decodedToken.uid} has role: ${role}`);
                        }
                    }
                }
            } catch (error: any) {
                const appError = handleError(error as Error);
                console.error(`[AUTH] Failed to check platform_users [${appError.errorId}]:`, (error as Error).message || String(error));
                // FAILSAFE: If DB fails (bad cert) but we have a valid token, allow access in dev mode
                if (process.env.NODE_ENV === 'development') {
                    console.warn('[AUTH] ⚠️ Using token data only (DB unreachable due to config error)');
                    // Default to owner/admin if email matches known admins for dev convenience
                    if (decodedToken.email && decodedToken.email.includes('admin')) {
                        role = 'owner';
                    }
                }
            }

            // [NEW] Admin Org Switcher Logic
            // If user is owner/admin AND request header x-org-id is present, use it
            let finalOrgId = decodedToken.orgId as string | undefined;

            if (['owner', 'admin'].includes(role)) {
                const requestedOrgId = await getHeader('x-org-id', req);
                if (requestedOrgId) {
                    // Verify that the requested Org actually exists
                    try {
                        const db = getAdminFirestore();
                        const orgDoc = await db.collection('orgs').doc(requestedOrgId).get();
                        if (orgDoc.exists) {
                            // console.log(`[AUTH] Context Switch: ${role} ${decodedToken.email} -> ${requestedOrgId}`);
                            finalOrgId = requestedOrgId;
                        } else {
                            console.warn(`[AUTH] Context Switch Blocked: Org ${requestedOrgId} not found`);
                            // Do NOT switch context if org is invalid (remains valid admin but without org context -> 403 at Guard)
                        }
                    } catch (err) {
                        console.error(`[AUTH] Context Switch Error:`, err);
                    }
                }
            }

            return {
                uid: decodedToken.uid,
                email: decodedToken.email,
                role,
                orgId: finalOrgId
            };
        }

        // 2. Fallback: Dev Mode Bypass (only if explicitly enabled)
        // WARNING: This is insecure and should only be used for local dev!
        if (process.env.NODE_ENV === 'development' && process.env.AUTH_DEV_BYPASS === 'true') {
            console.warn('[AUTH] ⚠️ DEV MODE: Bypassing token verification (AUTH_DEV_BYPASS=true)');
            const payload = decodeJwtPayload(token);

            if (!payload || !payload.user_id) {
                // console.log('[AUTH] Invalid JWT payload in bypass mode');
                return null;
            }

            const uid = payload.user_id || payload.sub;
            let role: PlatformRole = 'user';

            // DEV MODE: Check platform_users collection for role
            try {
                const { getAdminFirestore } = await import('@/lib/firebase-admin');
                const db = getAdminFirestore();
                const platformUserDoc = await db.collection('platform_users').doc(uid).get();

                if (platformUserDoc.exists) {
                    const platformUserData = platformUserDoc.data();
                    if (platformUserData?.enabled !== false) {
                        const dbRole = platformUserData?.role as PlatformRole;
                        if (['owner', 'admin', 'user'].includes(dbRole)) {
                            role = dbRole;
                            // console.log(`[AUTH] DEV MODE: ${uid} has role: ${role}`);
                        }
                    }
                }
            } catch (error) {
                const appError = handleError(error as Error);
                console.error(`[AUTH] Failed to check platform_users [${appError.errorId}]:`, (error as Error).message || String(error));
            }

            return {
                uid,
                email: payload.email,
                role,
                orgId: payload.orgId
            };
        }

        // 3. Error: No verification method available
        console.error('[AUTH] ❌ Setup Error: Firebase Admin not configured and AUTH_DEV_BYPASS not enabled.');
        return null;

    } catch (error) {
        const appError = handleError(error as Error);
        console.error(`[AUTH] Failed to get auth context [${appError.errorId}]:`, (error as Error).message || String(error));
        return null;
    }
}

/**
 * Require Platform Access (any platform role)
 * Redirects to login if not authenticated
 */
export async function requirePlatformAccess(): Promise<AuthContext> {
    const context = await getAuthContext();

    if (!context) {
        redirect('/auth/login');
    }

    return context;
}

/**
 * Require Owner role
 * Redirects to login if not owner
 */
export async function requireOwner(): Promise<AuthContext> {
    const context = await getAuthContext();

    if (!context) {
        redirect('/auth/login');
    }

    if (context.role !== 'owner') {
        // Log permission denial
        // Log permission denial
        await emitDenialEvent(
            { uid: context.uid, email: context.email || '', role: context.role },
            'owner',
            { method: 'unknown', path: 'unknown' }, // Guards don't have access to request details
            { action: 'requireOwner' }
        );
        redirect('/platform');
    }

    return context;
}

/**
 * Require Admin or Owner role
 * Redirects to platform home if insufficient role
 */
export async function requireAdmin(): Promise<AuthContext> {
    const context = await getAuthContext();

    if (!context) {
        redirect('/auth/login');
    }

    if (!['owner', 'admin'].includes(context.role)) {
        // Log permission denial
        // Log permission denial
        await emitDenialEvent(
            { uid: context.uid, email: context.email || '', role: context.role },
            'admin',
            { method: 'unknown', path: 'unknown' },
            { action: 'requireAdmin' }
        );
        redirect('/platform');
    }

    return context;
}

/**
 * Require Tenant Member (for future org features)
 * Currently allows all authenticated users
 */
export async function requireTenantMember(): Promise<AuthContext> {
    const context = await getAuthContext();

    if (!context) {
        redirect('/auth/login');
    }

    // Owner/Admin bypass org check
    if (['owner', 'admin'].includes(context.role)) {
        return context;
    }

    // Regular users need orgId (for future org features)
    if (!context.orgId) {
        redirect('/onboarding/create-organization');
    }

    return context;
}

/**
 * Check if SEO app is enabled for org
 */
export async function checkAppEnabled(orgId: string, appId: string): Promise<boolean> {
    // Import here to avoid circular deps
    const { getAdminFirestore } = await import('@/lib/firebase-admin');
    const db = getAdminFirestore();

    try {
        const doc = await db.collection('orgs').doc(orgId).collection('enabled_apps').doc(appId).get();
        return doc.exists;
    } catch (error) {
        const appError = handleError(error as Error);
        console.error(`[AUTH] Failed to check app enablement [${appError.errorId}]:`, (error as Error).message || String(error));
        return false;
    }
}

/**
 * Get current organization ID from auth context
 * Throws if no org is set
 */
export async function getCurrentOrgId(): Promise<string> {
    const context = await getAuthContext();

    if (!context) {
        redirect('/auth/login');
    }

    if (!context.orgId) {
        redirect('/onboarding');
    }

    return context.orgId;
}

/**
 * Check if user has minimum organization role level
 */
export function hasMinOrgRole(userOrgRole: OrgRole, minRole: OrgRole): boolean {
    const userRoleIndex = ROLE_HIERARCHY.indexOf(userOrgRole);
    const minRoleIndex = ROLE_HIERARCHY.indexOf(minRole);
    return userRoleIndex >= minRoleIndex;
}

/**
 * Require minimum organization role
 * Use for pages that need specific role levels (e.g., admin-only pages)
 * 
 * @param minRole - Minimum role required (viewer, member, admin, owner)
 */
export async function requireRole(minRole: OrgRole): Promise<AuthContext> {
    const context = await requireTenantMember();

    // Owner/Admin bypass role checks
    if (['owner', 'admin'].includes(context.role)) {
        return context;
    }

    // Map platform roles to org roles for comparison
    let effectiveOrgRole: OrgRole;
    if (context.orgRole) {
        effectiveOrgRole = context.orgRole;
    } else if (context.role === 'admin') {
        effectiveOrgRole = 'admin';
    } else {
        effectiveOrgRole = 'member';
    }

    if (!hasMinOrgRole(effectiveOrgRole, minRole)) {
        throw new Error(`Forbidden: Requires ${minRole} role or higher`);
    }

    return context;
}

/**
 * Get list of organizations for current user
 * Used in org switcher component
 */
export async function listUserOrganizations(): Promise<{ id: string; name: string; role: OrgRole }[]> {
    const context = await getAuthContext();

    if (!context) {
        return [];
    }

    // Import dynamically to avoid bundling issues
    try {
        const { getUserMemberships } = await import('@/lib/core');
        const { getOrganization } = await import('@/lib/core');

        const memberships = await getUserMemberships(context.uid);

        const orgs = await Promise.all(
            memberships.map(async (m) => {
                const org = await getOrganization(m.organizationId);
                return org ? {
                    id: m.organizationId,
                    name: org.name,
                    role: m.role,
                } : null;
            })
        );

        return orgs.filter((o): o is NonNullable<typeof o> => o !== null);
    } catch (error) {
        const appError = handleError(error as Error);
        console.error(`[AUTH] Failed to list user organizations [${appError.errorId}]:`, (error as Error).message || String(error));
        return [];
    }
}
