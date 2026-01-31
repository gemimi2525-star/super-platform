import { getAdminFirestore } from '@/lib/firebase-admin';
import { OrgEntitlements, MINIMAL_ENTITLEMENTS } from './types';
import { handleError } from '@super-platform/core';

/**
 * Retrieves entitlements for a specific organization.
 * 
 * Strategy:
 * 1. Try to read 'entitlements.flags' from 'platform_orgs/{orgId}'
 * 2. If present, return them.
 * 3. If missing or error, return safe fallback (MINIMAL_ENTITLEMENTS)
 * 
 * @param orgId The organization ID to resolve entitlements for
 */
export async function getOrgEntitlements(orgId: string): Promise<OrgEntitlements> {
    if (!orgId) {
        return MINIMAL_ENTITLEMENTS;
    }

    try {
        const db = getAdminFirestore();
        const docRef = db.collection('platform_orgs').doc(orgId);
        const snapshot = await docRef.get();

        if (snapshot.exists) {
            const data = snapshot.data();

            // Check for explicit entitlements field
            // Schema: { entitlements: { flags: ['app.users', ...] } }
            if (data?.entitlements?.flags && Array.isArray(data.entitlements.flags)) {
                return {
                    flags: data.entitlements.flags,
                    source: 'db',
                    updatedAt: data.entitlements.updatedAt || new Date().toISOString()
                };
            }
        }

        // If org exists but has no Entitlements schema yet, return Default Core
        // But log it as a "migratable" event
        // console.warn(`[Entitlements] Org ${orgId} has no entitlements. Using fallback.`);

        return MINIMAL_ENTITLEMENTS;

    } catch (error) {
        const appError = handleError(error as Error);
        console.error(`[Entitlements] Failed to resolve for ${orgId}:`, appError.message);

        // Safety: Always return minimal access on error, never throw
        return MINIMAL_ENTITLEMENTS;
    }
}
