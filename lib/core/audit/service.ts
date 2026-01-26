/**
 * Audit Log Service
 * 
 * Track all important actions
 */

import {
    db,
    collection,
    doc,
    setDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    Timestamp,
    serverTimestamp,
    COLLECTION_AUDIT_LOGS
} from '@/lib/firebase';
import type { AuditLog, AuditLogCreate, AuditAction } from '@/lib/types';

/**
 * Create audit log entry
 */
export async function createAuditLog(
    data: AuditLogCreate
): Promise<string> {
    const logRef = doc(collection(db, COLLECTION_AUDIT_LOGS));

    const auditLog: AuditLog = {
        ...data,
        id: logRef.id,
        timestamp: serverTimestamp() as Timestamp,
    };

    await setDoc(logRef, auditLog);
    return logRef.id;
}

/**
 * Log a CREATE action
 */
export async function logCreate(
    organizationId: string,
    userId: string,
    userName: string,
    resource: string,
    resourceId: string,
    details: Record<string, any> = {}
): Promise<void> {
    await createAuditLog({
        organizationId,
        userId,
        userName,
        action: 'create',
        resource,
        resourceId,
        details,
    });
}

/**
 * Log an UPDATE action
 */
export async function logUpdate(
    organizationId: string,
    userId: string,
    userName: string,
    resource: string,
    resourceId: string,
    details: Record<string, any> = {}
): Promise<void> {
    await createAuditLog({
        organizationId,
        userId,
        userName,
        action: 'update',
        resource,
        resourceId,
        details,
    });
}

/**
 * Log a DELETE action
 */
export async function logDelete(
    organizationId: string,
    userId: string,
    userName: string,
    resource: string,
    resourceId: string,
    details: Record<string, any> = {}
): Promise<void> {
    await createAuditLog({
        organizationId,
        userId,
        userName,
        action: 'delete',
        resource,
        resourceId,
        details,
    });
}

/**
 * Get audit logs for an organization
 */
export async function getOrganizationAuditLogs(
    organizationId: string,
    limitNum: number = 100
): Promise<AuditLog[]> {
    const q = query(
        collection(db, COLLECTION_AUDIT_LOGS),
        where('organizationId', '==', organizationId),
        orderBy('timestamp', 'desc'),
        limit(limitNum)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as AuditLog);
}

/**
 * Get audit logs for a specific resource
 */
export async function getResourceAuditLogs(
    organizationId: string,
    resource: string,
    resourceId: string,
    limitNum: number = 50
): Promise<AuditLog[]> {
    const q = query(
        collection(db, COLLECTION_AUDIT_LOGS),
        where('organizationId', '==', organizationId),
        where('resource', '==', resource),
        where('resourceId', '==', resourceId),
        orderBy('timestamp', 'desc'),
        limit(limitNum)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as AuditLog);
}

/**
 * Get audit logs by user
 */
export async function getUserAuditLogs(
    organizationId: string,
    userId: string,
    limitNum: number = 100
): Promise<AuditLog[]> {
    const q = query(
        collection(db, COLLECTION_AUDIT_LOGS),
        where('organizationId', '==', organizationId),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(limitNum)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as AuditLog);
}

/**
 * Get audit logs by action
 */
export async function getActionAuditLogs(
    organizationId: string,
    action: AuditAction,
    limitNum: number = 100
): Promise<AuditLog[]> {
    const q = query(
        collection(db, COLLECTION_AUDIT_LOGS),
        where('organizationId', '==', organizationId),
        where('action', '==', action),
        orderBy('timestamp', 'desc'),
        limit(limitNum)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as AuditLog);
}
