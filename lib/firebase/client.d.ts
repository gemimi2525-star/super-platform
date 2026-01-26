/**
 * Firebase Client Configuration
 *
 * Initialize Firebase for client-side usage
 */
import { FirebaseApp } from 'firebase/app';
import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import { FirebaseStorage } from 'firebase/storage';
declare let app: FirebaseApp;
declare let auth: Auth;
declare let db: Firestore;
declare let storage: FirebaseStorage;
export { app, auth, db, storage };
export { collection, doc, getDoc, getDocs, addDoc, setDoc, updateDoc, deleteDoc, query, where, orderBy, limit, startAfter, Timestamp, serverTimestamp, } from 'firebase/firestore';
export { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail, updateProfile, } from 'firebase/auth';
export { ref, uploadBytes, uploadBytesResumable, getDownloadURL, deleteObject, } from 'firebase/storage';
//# sourceMappingURL=client.d.ts.map