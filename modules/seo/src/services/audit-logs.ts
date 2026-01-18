import { db } from '@platform/firebase';
import {
    collection,
    addDoc,
    query,
    where,
    getDocs,
    orderBy,
    limit,
    Timestamp,
    serverTimestamp
} from 'firebase/firestore';
import type { AuditLog, AuditAction, AuditEntityType } from '../types';

const SUBCOLLECTION = 'audit_logs';
const getCollection = (orgId: string) => collection(db, 'orgs', orgId, SUBCOLLECTION);

export type CreateAuditLogData = Omit<AuditLog, 'id' | 'createdAt'>;

export const auditLogService = {
    /**
     * Create a new audit log entry
     */
    logAction: async (data: CreateAuditLogData): Promise<string> => {
        try {
            const { organizationId } = data;
            const docRef = await addDoc(getCollection(organizationId), {
                ...data, // Keep orgId field for redundancy/querying ease if needed
                createdAt: serverTimestamp()
            });
            return docRef.id;
        } catch (error) {
            console.error('Error logging audit action:', error);
            return '';
        }
    },

    /**
     * Get audit logs for an organization
     */
    getLogs: async (organizationId: string, limitCount = 50): Promise<AuditLog[]> => {
        const q = query(
            getCollection(organizationId),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: (data.createdAt as Timestamp)?.toDate() || new Date()
            } as AuditLog;
        });
    }
};
