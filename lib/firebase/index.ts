/**
 * Firebase Package Exports
 */

export {
    getFirestore,
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    startAfter,
    Timestamp,
    serverTimestamp,
    increment // เพิ่ม increment สำหรับ atomic operations
} from 'firebase/firestore';

// Explicit collection exports for webpack compatibility
export {
    COLLECTION_USERS,
    COLLECTION_ORGANIZATIONS,
    COLLECTION_ORGANIZATION_MEMBERS,
    COLLECTION_ROLES,
    COLLECTION_PERMISSIONS,
    COLLECTION_AUDIT_LOGS,
    COLLECTION_NOTIFICATIONS,
    COLLECTION_WORKFLOWS,
    COLLECTION_SEO_SITES,
    COLLECTION_SEO_PAGES,
    COLLECTION_SEO_KEYWORDS,
    COLLECTION_SEO_ANALYTICS,
    getCollectionPath
} from './collections';

export * from './client';
