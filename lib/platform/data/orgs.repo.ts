/**
 * Organizations Repository
 * 
 * Data access for organization documents.
 * Part of Phase 12: Real Data Wiring
 * 
 * SYNAPSE Kernel: FROZEN ❄️ - This module does NOT touch synapse-core
 * Policy decisions are NOT made here - only data access
 */

import { getDb, getDocument, listDocuments, createDocument, updateDocument, withProtection } from './firestore';
import type { DocumentResponse } from './firestore';

// ============================================================================
// Types
// ============================================================================

export type OrgStatus = 'active' | 'suspended';
export type OrgPlan = 'free' | 'pro' | 'enterprise';

export interface Organization {
    id: string;
    name: string;
    slug: string;
    ownerId: string;
    memberIds: string[];
    status: OrgStatus;
    plan: OrgPlan;
    domain?: string;
    settings?: Record<string, unknown>;
    createdAt: string;
    updatedAt?: string;
}

export interface CreateOrgInput {
    name: string;
    slug: string;
    ownerId: string;
    plan?: OrgPlan;
    domain?: string;
    settings?: Record<string, unknown>;
}

export interface UpdateOrgInput {
    name?: string;
    status?: OrgStatus;
    plan?: OrgPlan;
    domain?: string;
    settings?: Record<string, unknown>;
}

// ============================================================================
// Constants
// ============================================================================

// Canonical collection name
const COLLECTION = 'platform_organizations';

// ============================================================================
// Repository Methods
// ============================================================================

/**
 * Get organization by ID.
 */
export async function getOrgById(orgId: string): Promise<DocumentResponse<Organization>> {
    return getDocument<Organization>(COLLECTION, orgId);
}

/**
 * Get organization by slug.
 */
export async function getOrgBySlug(slug: string): Promise<DocumentResponse<Organization>> {
    try {
        const result = await withProtection(
            `getOrgBySlug:${slug}`,
            async () => {
                const db = getDb();
                const snapshot = await db.collection(COLLECTION)
                    .where('slug', '==', slug)
                    .limit(1)
                    .get();
                return snapshot;
            }
        );

        if (result.empty) {
            return {
                ok: false,
                code: 'DATA_NOT_FOUND',
                message: `Organization with slug ${slug} not found`,
            };
        }

        const doc = result.docs[0];
        return {
            ok: true,
            data: { id: doc.id, ...doc.data() } as Organization,
        };
    } catch (err) {
        return {
            ok: false,
            code: 'BUG_UNHANDLED',
            message: (err as Error).message,
        };
    }
}

/**
 * List all organizations.
 */
export async function listOrgs(options: {
    limit?: number;
    status?: OrgStatus;
} = {}): Promise<DocumentResponse<Organization[]>> {
    try {
        const result = await withProtection(
            'listOrgs',
            async () => {
                const db = getDb();
                let query = db.collection(COLLECTION) as FirebaseFirestore.Query;

                if (options.status) {
                    query = query.where('status', '==', options.status);
                }

                if (options.limit) {
                    query = query.limit(options.limit);
                }

                return query.get();
            }
        );

        const orgs = result.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        })) as Organization[];

        return {
            ok: true,
            data: orgs,
        };
    } catch (err) {
        return {
            ok: false,
            code: 'BUG_UNHANDLED',
            message: (err as Error).message,
        };
    }
}

/**
 * List organizations for a specific user.
 */
export async function listOrgsForUser(userId: string): Promise<DocumentResponse<Organization[]>> {
    try {
        const result = await withProtection(
            `listOrgsForUser:${userId}`,
            async () => {
                const db = getDb();
                const snapshot = await db.collection(COLLECTION)
                    .where('memberIds', 'array-contains', userId)
                    .get();
                return snapshot;
            }
        );

        const orgs = result.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        })) as Organization[];

        return {
            ok: true,
            data: orgs,
        };
    } catch (err) {
        return {
            ok: false,
            code: 'BUG_UNHANDLED',
            message: (err as Error).message,
        };
    }
}

/**
 * Create a new organization.
 */
export async function createOrg(input: CreateOrgInput): Promise<DocumentResponse<Organization>> {
    const orgData = {
        name: input.name,
        slug: input.slug,
        ownerId: input.ownerId,
        memberIds: [input.ownerId], // Owner is always a member
        status: 'active' as OrgStatus,
        plan: input.plan || 'free',
        domain: input.domain,
        settings: input.settings || {},
    };

    return createDocument<Organization>(COLLECTION, orgData);
}

/**
 * Update an organization.
 */
export async function updateOrg(
    orgId: string,
    input: UpdateOrgInput
): Promise<DocumentResponse<Organization>> {
    return updateDocument<Organization>(COLLECTION, orgId, input);
}

/**
 * Add a member to an organization.
 */
export async function addOrgMember(orgId: string, userId: string): Promise<DocumentResponse<Organization>> {
    try {
        await withProtection(
            `addOrgMember:${orgId}/${userId}`,
            async () => {
                const db = getDb();
                const { FieldValue } = await import('firebase-admin/firestore');
                return db.collection(COLLECTION).doc(orgId).update({
                    memberIds: FieldValue.arrayUnion(userId),
                    updatedAt: new Date().toISOString(),
                });
            }
        );

        return getOrgById(orgId);
    } catch (err) {
        return {
            ok: false,
            code: 'BUG_UNHANDLED',
            message: (err as Error).message,
        };
    }
}

/**
 * Remove a member from an organization.
 */
export async function removeOrgMember(orgId: string, userId: string): Promise<DocumentResponse<Organization>> {
    try {
        await withProtection(
            `removeOrgMember:${orgId}/${userId}`,
            async () => {
                const db = getDb();
                const { FieldValue } = await import('firebase-admin/firestore');
                return db.collection(COLLECTION).doc(orgId).update({
                    memberIds: FieldValue.arrayRemove(userId),
                    updatedAt: new Date().toISOString(),
                });
            }
        );

        return getOrgById(orgId);
    } catch (err) {
        return {
            ok: false,
            code: 'BUG_UNHANDLED',
            message: (err as Error).message,
        };
    }
}
