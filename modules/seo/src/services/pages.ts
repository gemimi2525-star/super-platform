/**
 * Pages Service
 * 
 * Firestore operations for SEO pages with multi-tenant support
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
    serverTimestamp // Changed from Timestamp
} from '@platform/firebase';
import { db } from '@platform/firebase';
import { incrementPages } from '@modules/platform'; // Added import
import type { Page, CreatePageInput, UpdatePageInput } from '../types';

const SUBCOLLECTION = 'seo_pages';

const getCollection = (orgId: string) => collection(db, 'orgs', orgId, SUBCOLLECTION);

/**
 * Get all pages for an organization
 */
export async function getPagesByOrganization(organizationId: string): Promise<Page[]> {
    const q = query(
        getCollection(organizationId),
        orderBy('updatedAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Page[];
}

/**
 * Get pages for a specific site
 */
export async function getPagesBySite(organizationId: string, siteId: string): Promise<Page[]> {
    const q = query(
        getCollection(organizationId),
        where('siteId', '==', siteId),
        orderBy('updatedAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Page[];
}

/**
 * Get a single page by ID
 */
export async function getPageById(organizationId: string, pageId: string): Promise<Page | null> {
    const docRef = doc(db, 'orgs', organizationId, SUBCOLLECTION, pageId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
        return null;
    }

    return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate() || new Date(),
        updatedAt: docSnap.data().updatedAt?.toDate() || new Date(),
    } as Page;
}

/**
 * Create a new page
 */
export async function createPage(pageData: CreatePageInput): Promise<string> {
    const { organizationId, ...data } = pageData;

    const docRef = await addDoc(getCollection(organizationId), {
        ...pageData,
        createdAt: serverTimestamp(), // Changed to serverTimestamp
        updatedAt: serverTimestamp(), // Changed to serverTimestamp
    });

    // อัพเดท stats summary (+1 page)
    await incrementPages(organizationId, 1);

    return docRef.id;
}

/**
 * Update a page
 */
export async function updatePage({ organizationId, pageId, updates }: { organizationId: string; pageId: string; updates: UpdatePageInput }): Promise<void> {
    const docRef = doc(db, 'orgs', organizationId, SUBCOLLECTION, pageId);
    await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(), // Changed to serverTimestamp
    });
}

/**
 * Delete a page
 */
export async function deletePage(organizationId: string, pageId: string): Promise<void> {
    const docRef = doc(db, 'orgs', organizationId, SUBCOLLECTION, pageId);
    await deleteDoc(docRef);

    // อัพเดท stats summary (-1 page)
    await incrementPages(organizationId, -1);
}
