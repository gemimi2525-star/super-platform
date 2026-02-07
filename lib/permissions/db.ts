
import { getAdminFirestore } from '@/lib/firebase-admin';
import { PermissionGrant } from './types';

const COLLECTION_PERMISSIONS = 'platform_permissions';
const COLLECTION_AUDIT_LOGS = 'platform_audit_logs';

export async function getPermissionGrant(appId: string, userId: string, capability: string): Promise<PermissionGrant | null> {
    const db = getAdminFirestore();
    const docId = `${userId}_${appId}_${capability}`;
    const snap = await db.collection(COLLECTION_PERMISSIONS).doc(docId).get();

    if (!snap.exists) {
        return null;
    }
    return snap.data() as PermissionGrant;
}

export async function getAppGrants(appId: string, userId: string): Promise<PermissionGrant[]> {
    const db = getAdminFirestore();
    const snap = await db.collection(COLLECTION_PERMISSIONS)
        .where('appId', '==', appId)
        .where('userId', '==', userId)
        .get();

    return snap.docs.map(d => d.data() as PermissionGrant);
}

export async function setPermissionGrant(grant: PermissionGrant): Promise<void> {
    const db = getAdminFirestore();
    const docId = `${grant.userId}_${grant.appId}_${grant.capability}`;
    await db.collection(COLLECTION_PERMISSIONS).doc(docId).set(grant);

    // Audit Log
    await db.collection(COLLECTION_AUDIT_LOGS).add({
        event: 'permission_change',
        ...grant,
        timestamp: new Date(),
    });
}
