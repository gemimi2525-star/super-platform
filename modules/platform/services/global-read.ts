/**
 * Platform Global Read Service
 * 
 * Allows platform_owner to read ANY org's data
 * CRITICAL: Every read MUST log to platform_audit_logs
 */

import {
    collection,
    doc,
    getDocs,
    addDoc,
    query,
    orderBy,
    serverTimestamp,
    Timestamp
} from '@/lib/firebase';
import { db } from '@/lib/firebase';
import { handleError } from '@super-platform/core';
import type { Keyword, Page, RankHistory, AuditLog } from '@/modules/seo';

// Platform audit log entry
interface PlatformAuditEntry {
    actorId: string;
    action: 'owner.read';
    orgId: string;
    entityType: string;
    path?: string;
    timestamp: ReturnType<typeof serverTimestamp>;
}

/**
 * Log platform owner access
 */
export async function logPlatformAccess(entry: Omit<PlatformAuditEntry, 'timestamp'>): Promise<void> {
    try {
        await addDoc(collection(db, 'platform_audit_logs'), {
            ...entry,
            timestamp: serverTimestamp()
        });
        console.log('[PLATFORM AUDIT]', entry);
    } catch (error) {
        const appError = handleError(error as Error);
        const msg = (error as Error).message || String(error);
        console.error(`[PLATFORM AUDIT] Failed to log access [${appError.errorId}]: ${msg}`);
        // Don't throw - audit failure shouldn't block read
    }
}

/**
 * Platform Global Read Service
 * platform_owner-only operations with mandatory audit logging
 */
export const platformGlobalRead = {
    /**
     * Read keywords for any org
     */
    async getOrgKeywords(orgId: string, actorId: string): Promise<Keyword[]> {
        await logPlatformAccess({
            actorId,
            action: 'owner.read',
            orgId,
            entityType: 'keywords',
            path: `orgs/${orgId}/seo_keywords`
        });

        const q = query(
            collection(db, 'orgs', orgId, 'seo_keywords'),
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
        })) as unknown as Keyword[];
    },

    /**
     * Read pages for any org
     */
    async getOrgPages(orgId: string, actorId: string): Promise<Page[]> {
        await logPlatformAccess({
            actorId,
            action: 'owner.read',
            orgId,
            entityType: 'pages',
            path: `orgs/${orgId}/seo_pages`
        });

        const q = query(
            collection(db, 'orgs', orgId, 'seo_pages'),
            orderBy('updatedAt', 'desc')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        })) as unknown as Page[];
    },

    /**
     * Read audit logs for any org
     */
    async getOrgAuditLogs(orgId: string, actorId: string, limitCount = 50): Promise<AuditLog[]> {
        await logPlatformAccess({
            actorId,
            action: 'owner.read',
            orgId,
            entityType: 'audit_logs',
            path: `orgs/${orgId}/audit_logs`
        });

        const q = query(
            collection(db, 'orgs', orgId, 'audit_logs'),
            orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: (data.createdAt as Timestamp)?.toDate() || new Date()
            } as unknown as AuditLog;
        });
    },

    /**
     * Get org stats summary
     */
    async getOrgStats(orgId: string, actorId: string) {
        await logPlatformAccess({
            actorId,
            action: 'owner.read',
            orgId,
            entityType: 'stats',
            path: `orgs/${orgId}`
        });

        // Get counts
        const [keywords, pages] = await Promise.all([
            getDocs(collection(db, 'orgs', orgId, 'seo_keywords')),
            getDocs(collection(db, 'orgs', orgId, 'seo_pages'))
        ]);

        return {
            keywordsCount: keywords.size,
            pagesCount: pages.size
        };
    }
};
