/**
 * Rank History Service
 * 
 * Firestore operations for manual rank tracking
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
    Timestamp,
    limit,
    runTransaction,
    type Transaction
} from '@platform/firebase';
import { db } from '@platform/firebase';
import type { RankHistory, CreateRankHistoryInput } from '../types';

const SUBCOLLECTION = 'seo_keyword_ranks';
const KEYWORDS_SUBCOLLECTION = 'seo_keywords';

const getCollection = (orgId: string) => collection(db, 'orgs', orgId, SUBCOLLECTION);

/**
 * Add a new rank entry and update keyword summary
 * ATOMIC OPERATION: Updates both RankHistory and Keyword document
 */
export async function addRankEntry(data: CreateRankHistoryInput): Promise<string> {
    const now = Timestamp.now();
    const { organizationId } = data;

    // 1. Prepare RankHistory Ref
    const rankHistoryRef = doc(getCollection(organizationId));
    const rankHistoryData = {
        ...data,
        createdAt: now,
    };

    // 2. Prepare Keyword Reference
    const keywordRef = doc(db, 'orgs', organizationId, KEYWORDS_SUBCOLLECTION, data.keywordId);

    try {
        await runTransaction(db, async (transaction: Transaction) => {
            // Get current keyword data to calculate best rank
            const keywordDoc = await transaction.get(keywordRef);
            if (!keywordDoc.exists()) {
                throw new Error('Keyword not found');
            }

            const currentData = keywordDoc.data();
            const currentBest = currentData.ranking?.bestPosition || 101;
            const newBest = data.rank < currentBest ? data.rank : currentBest;

            // 1. Create Rank History entry
            transaction.set(rankHistoryRef, rankHistoryData);

            // 2. Update Keyword summary fields
            transaction.update(keywordRef, {
                'ranking.currentPosition': data.rank,
                'ranking.bestPosition': newBest,
                'ranking.lastUpdated': now,
                updatedAt: now
            });
        });

        return rankHistoryRef.id;
    } catch (error) {
        console.error('Error adding rank entry:', error);
        throw error;
    }
}

/**
 * Get rank history for a keyword
 */
export async function getRankHistory(
    organizationId: string,
    keywordId: string,
    limitCount: number = 30
): Promise<RankHistory[]> {
    const q = query(
        getCollection(organizationId),
        where('keywordId', '==', keywordId),
        orderBy('date', 'desc'),
        limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as unknown as RankHistory[];
}

/**
 * Delete a rank history entry
 */
export async function deleteRankEntry(organizationId: string, id: string): Promise<void> {
    await deleteDoc(doc(db, 'orgs', organizationId, SUBCOLLECTION, id));
}
