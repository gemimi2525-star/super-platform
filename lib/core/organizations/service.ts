/**
 * Organization Service
 * 
 * CRUD operations for organizations
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
    COLLECTION_ORGANIZATIONS,
    COLLECTION_ORGANIZATION_MEMBERS,
} from '@/lib/firebase';
import type { Organization, OrganizationCreate,  } from '@/lib/types';

/**
 * Create a new organization
 */
export async function createOrganization(
    data: OrganizationCreate
): Promise<string> {
    const orgRef = doc(collection(db, COLLECTION_ORGANIZATIONS));

    const organization: Organization = {
        ...data,
        id: orgRef.id,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
    };

    await setDoc(orgRef, organization);
    return orgRef.id;
}

/**
 * Get organization by ID
 */
export async function getOrganization(id: string): Promise<Organization | null> {
    const docRef = doc(db, COLLECTION_ORGANIZATIONS, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
        return null;
    }

    return docSnap.data() as Organization;
}

/**
 * Get organization by slug
 */
export async function getOrganizationBySlug(slug: string): Promise<Organization | null> {
    const q = query(
        collection(db, COLLECTION_ORGANIZATIONS),
        where('slug', '==', slug)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        return null;
    }

    return snapshot.docs[0].data() as Organization;
}

/**
 * Update organization
 */
export async function updateOrganization(
    id: string,
    data: Partial<Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
    const docRef = doc(db, COLLECTION_ORGANIZATIONS, id);

    await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
    });
}

/**
 * Get all organizations for a user
 */
export async function getUserOrganizations(userId: string): Promise<Organization[]> {
    // This would typically query memberships first,
    // then fetch organizations
    // For now, simplified version

    const snapshot = await getDocs(collection(db, COLLECTION_ORGANIZATIONS));
    return snapshot.docs.map(doc => doc.data() as Organization);
}
