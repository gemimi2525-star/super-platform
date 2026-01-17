/**
 * Sites Service
 * 
 * Firestore operations for SEO sites with multi-tenant support
 */

import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    Timestamp
} from '@platform/firebase';
import { db } from '@platform/firebase';
import type { Site } from '../types';

const COLLECTION = 'seo_sites';

/**
 * Get all sites for an organization
 */
export async function getSitesByOrganization(organizationId: string): Promise<Site[]> {
    const q = query(
        collection(db, COLLECTION),
        where('organizationId', '==', organizationId),
        orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Site[];
}

/**
 * Get a single site by ID
 */
export async function getSiteById(siteId: string): Promise<Site | null> {
    const docRef = doc(db, COLLECTION, siteId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
        return null;
    }

    return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate() || new Date(),
        updatedAt: docSnap.data().updatedAt?.toDate() || new Date(),
    } as Site;
}

/**
 * Create a new site
 */
export async function createSite(
    organizationId: string,
    userId: string,
    siteData: Omit<Site, 'id' | 'organizationId' | 'createdAt' | 'updatedAt' | 'createdBy'>
): Promise<string> {
    const now = Timestamp.now();

    const docRef = await addDoc(collection(db, COLLECTION), {
        ...siteData,
        organizationId,
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
    });

    return docRef.id;
}

/**
 * Update a site
 */
export async function updateSite(
    siteId: string,
    updates: Partial<Omit<Site, 'id' | 'organizationId' | 'createdAt' | 'createdBy'>>
): Promise<void> {
    const docRef = doc(db, COLLECTION, siteId);
    await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now(),
    });
}

/**
 * Delete a site
 */
export async function deleteSite(siteId: string): Promise<void> {
    const docRef = doc(db, COLLECTION, siteId);
    await deleteDoc(docRef);
}

/**
 * Get site count for organization
 */
export async function getSiteCount(organizationId: string): Promise<number> {
    const sites = await getSitesByOrganization(organizationId);
    return sites.length;
}
