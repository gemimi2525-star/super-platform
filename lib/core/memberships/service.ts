/**
 * Memberships Service
 * 
 * CRUD operations for organization memberships
 * Manages user-organization relationships and roles
 */

import {
    db,
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    Timestamp,
    serverTimestamp,
    COLLECTION_ORGANIZATION_MEMBERS,
} from '@/lib/firebase';
import type { Membership, UserRole } from '@/lib/types';

/**
 * Membership document ID format: {orgId}_{userId}
 * This ensures unique membership per user per org
 */
function getMembershipId(orgId: string, userId: string): string {
    return `${orgId}_${userId}`;
}

/**
 * Create membership input type
 */
export interface MembershipCreate {
    userId: string;
    organizationId: string;
    role: UserRole;
    invitedBy: string | null;
}

/**
 * Create a new membership
 */
export async function createMembership(data: MembershipCreate): Promise<string> {
    const membershipId = getMembershipId(data.organizationId, data.userId);
    const docRef = doc(db, COLLECTION_ORGANIZATION_MEMBERS, membershipId);

    const membership: Omit<Membership, 'id'> & { id: string } = {
        id: membershipId,
        userId: data.userId,
        organizationId: data.organizationId,
        role: data.role,
        permissions: [], // Will be populated based on role
        invitedBy: data.invitedBy,
        invitedAt: serverTimestamp() as Timestamp,
        joinedAt: serverTimestamp() as Timestamp,
        status: 'active',
    };

    await setDoc(docRef, membership);
    return membershipId;
}

/**
 * Get membership by org and user
 */
export async function getMembership(
    orgId: string,
    userId: string
): Promise<Membership | null> {
    const membershipId = getMembershipId(orgId, userId);
    const docRef = doc(db, COLLECTION_ORGANIZATION_MEMBERS, membershipId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
        return null;
    }

    return docSnap.data() as Membership;
}

/**
 * Get all memberships for a user
 */
export async function getUserMemberships(userId: string): Promise<Membership[]> {
    const q = query(
        collection(db, COLLECTION_ORGANIZATION_MEMBERS),
        where('userId', '==', userId),
        where('status', '==', 'active')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Membership);
}

/**
 * Get all members of an organization
 */
export async function getOrgMembers(orgId: string): Promise<Membership[]> {
    const q = query(
        collection(db, COLLECTION_ORGANIZATION_MEMBERS),
        where('organizationId', '==', orgId)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Membership);
}

/**
 * Update member role
 */
export async function updateMemberRole(
    orgId: string,
    userId: string,
    role: UserRole
): Promise<void> {
    const membershipId = getMembershipId(orgId, userId);
    const docRef = doc(db, COLLECTION_ORGANIZATION_MEMBERS, membershipId);

    await updateDoc(docRef, {
        role,
        updatedAt: serverTimestamp(),
    });
}

/**
 * Remove member from organization
 */
export async function removeMember(orgId: string, userId: string): Promise<void> {
    const membershipId = getMembershipId(orgId, userId);
    const docRef = doc(db, COLLECTION_ORGANIZATION_MEMBERS, membershipId);

    await deleteDoc(docRef);
}

/**
 * Check if user is member of organization
 */
export async function isOrgMember(orgId: string, userId: string): Promise<boolean> {
    const membership = await getMembership(orgId, userId);
    return membership !== null && membership.status === 'active';
}

/**
 * Get user's role in organization
 */
export async function getUserRole(
    orgId: string,
    userId: string
): Promise<UserRole | null> {
    const membership = await getMembership(orgId, userId);
    return membership?.role ?? null;
}

/**
 * Role hierarchy for permission checks
 * Higher index = more permissions
 */
export const ROLE_HIERARCHY: readonly UserRole[] = ['viewer', 'member', 'admin', 'owner'] as const;

/**
 * Check if user has minimum role level
 */
export function hasMinRole(userRole: UserRole, minRole: UserRole): boolean {
    const userRoleIndex = ROLE_HIERARCHY.indexOf(userRole);
    const minRoleIndex = ROLE_HIERARCHY.indexOf(minRole);
    return userRoleIndex >= minRoleIndex;
}

/**
 * Get default permissions for a role
 */
export function getDefaultPermissions(role: UserRole): string[] {
    switch (role) {
        case 'owner':
            return [
                'platform.organization.read',
                'platform.organization.write',
                'platform.organization.delete',
                'platform.users.read',
                'platform.users.write',
                'platform.users.delete',
                'platform.users.invite',
                'platform.roles.read',
                'platform.roles.write',
                'platform.audit.read',
                'seo.sites.read',
                'seo.sites.write',
                'seo.pages.read',
                'seo.pages.write',
                'seo.keywords.read',
                'seo.keywords.write',
            ];
        case 'admin':
            return [
                'platform.organization.read',
                'platform.users.read',
                'platform.users.invite',
                'platform.audit.read',
                'seo.sites.read',
                'seo.sites.write',
                'seo.pages.read',
                'seo.pages.write',
                'seo.keywords.read',
                'seo.keywords.write',
            ];
        case 'member':
            return [
                'platform.organization.read',
                'seo.sites.read',
                'seo.pages.read',
                'seo.pages.write',
                'seo.keywords.read',
                'seo.keywords.write',
            ];
        case 'viewer':
            return [
                'platform.organization.read',
                'seo.sites.read',
                'seo.pages.read',
                'seo.keywords.read',
            ];
        default:
            return [];
    }
}
