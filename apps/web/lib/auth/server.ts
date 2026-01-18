/**
 * Server-Side Auth Utilities
 * 
 * Functions to enforce authentication in Server Components (layouts/pages)
 * Used in route group layouts for real auth enforcement
 */

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyIdToken } from '@platform/firebase-admin';

export interface AuthContext {
    uid: string;
    email?: string;
    role: 'platform_owner' | 'org_admin' | 'org_member';
    orgId?: string;
}

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

    // In real app, also check Authorization header
    // But Next.js cookies() doesn't give us headers directly
    // So we rely on session cookie for now

    return null;
}

/**
 * Get current auth context
 * Returns null if not authenticated
 */
export async function getAuthContext(): Promise<AuthContext | null> {
    try {
        const token = await getAuthToken();
        if (!token) {
            return null;
        }

        const decodedToken = await verifyIdToken(token);

        return {
            uid: decodedToken.uid,
            email: decodedToken.email,
            role: (decodedToken.role as any) || 'org_member',
            orgId: decodedToken.orgId as string | undefined
        };
    } catch (error) {
        console.error('[AUTH] Failed to get auth context:', error);
        return null;
    }
}

/**
 * Require Platform Owner role
 * Throws 403 if not platform_owner
 */
export async function requirePlatformOwner(): Promise<AuthContext> {
    const context = await getAuthContext();

    if (!context) {
        redirect('/login');
    }

    if (context.role !== 'platform_owner') {
        throw new Error('Forbidden: Platform Owner access required');
    }

    return context;
}

/**
 * Require Tenant Member (org_admin or org_member)
 * Redirects if no org membership
 */
export async function requireTenantMember(): Promise<AuthContext> {
    const context = await getAuthContext();

    if (!context) {
        redirect('/login');
    }

    // platform_owner can also access tenant routes (for global read)
    if (context.role === 'platform_owner') {
        return context;
    }

    if (!context.orgId) {
        redirect('/onboarding');
    }

    if (!['org_admin', 'org_member'].includes(context.role)) {
        throw new Error('Forbidden: Organization membership required');
    }

    return context;
}

/**
 * Check if SEO app is enabled for org
 */
export async function checkAppEnabled(orgId: string, appId: string): Promise<boolean> {
    // Import here to avoid circular deps
    const { getAdminFirestore } = await import('@platform/firebase-admin');
    const db = getAdminFirestore();

    try {
        const doc = await db.collection('orgs').doc(orgId).collection('enabled_apps').doc(appId).get();
        return doc.exists;
    } catch (error) {
        console.error('[AUTH] Failed to check app enablement:', error);
        return false;
    }
}
