/**
 * Keywords Service
 * 
 * Firestore operations for SEO keywords with multi-tenant support
 * LOCKED: using subcollections orgs/{orgId}/seo_keywords
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
    serverTimestamp,
    Timestamp
} from '@platform/firebase';
import { db } from '@platform/firebase';
import { incrementKeywords } from '@modules/platform';
import type { Keyword, CreateKeywordInput, UpdateKeywordInput } from '../types';

const SUBCOLLECTION = 'seo_keywords';

const getCollection = (orgId: string) => collection(db, 'orgs', orgId, SUBCOLLECTION);

/**
 * Get all keywords for an organization
 */
export async function getKeywordsByOrganization(organizationId: string): Promise<Keyword[]> {
    const q = query(
        getCollection(organizationId),
        orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        ranking: {
            ...doc.data().ranking,
            lastChecked: doc.data().ranking?.lastChecked?.toDate()
        }
    })) as Keyword[];
}

/**
 * Get keywords for a specific page
 */
export async function getKeywordsByPage(organizationId: string, pageId: string): Promise<Keyword[]> {
    const q = query(
        getCollection(organizationId),
        where('pageId', '==', pageId),
        orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        ranking: {
            ...doc.data().ranking,
            lastChecked: doc.data().ranking?.lastChecked?.toDate()
        }
    })) as Keyword[];
}

/**
 * Get a single keyword by ID
 * REQUIRES organizationId for path
 */
export async function getKeywordById(organizationId: string, keywordId: string): Promise<Keyword | null> {
    const docRef = doc(db, 'orgs', organizationId, SUBCOLLECTION, keywordId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
        return null;
    }

    return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate() || new Date(),
        updatedAt: docSnap.data().updatedAt?.toDate() || new Date(),
        ranking: {
            ...docSnap.data().ranking,
            lastChecked: docSnap.data().ranking?.lastChecked?.toDate()
        }
    } as Keyword;
}

/**
 * Create a new keyword
 */
export async function createKeyword(keywordData: CreateKeywordInput): Promise<string> {
    const { organizationId } = keywordData;

    const docRef = await addDoc(getCollection(organizationId), {
        ...keywordData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        ranking: {
            currentPosition: null,
            previousPosition: null,
            bestPosition: null,
            lastChecked: null
        }
    });

    // อัพเดท stats summary (+1 keyword)
    await incrementKeywords(organizationId, 1);

    return docRef.id;
}

/**
 * Update a keyword
 */
export async function updateKeyword({ organizationId, keywordId, updates }: { organizationId: string; keywordId: string; updates: UpdateKeywordInput }): Promise<void> {
    const docRef = doc(db, 'orgs', organizationId, SUBCOLLECTION, keywordId);
    await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
    });
}

/**
 * Delete a keyword
 */
export async function deleteKeyword(organizationId: string, keywordId: string): Promise<void> {
    const docRef = doc(db, 'orgs', organizationId, SUBCOLLECTION, keywordId);
    await deleteDoc(docRef);

    // อัพเดท stats summary (-1 keyword)
    await incrementKeywords(organizationId, -1);
}
