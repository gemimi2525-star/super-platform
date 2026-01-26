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

export * from './client';
export * from './collections';
