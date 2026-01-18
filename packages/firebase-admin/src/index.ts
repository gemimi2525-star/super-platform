/**
 * Firebase Admin SDK - Server Only
 * 
 * Singleton for Firebase Admin initialization
 * Used for server-side token verification and Firestore admin operations
 * 
 * CRITICAL: Never import this in client code
 */

import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let adminApp: App | undefined;

/**
 * Initialize Firebase Admin (singleton)
 */
function initAdmin(): App {
    if (getApps().length > 0 && adminApp) {
        return adminApp;
    }

    // PRODUCTION SAFETY: Validate required env vars
    const requiredVars = ['FIREBASE_PROJECT_ID'];
    const missing = requiredVars.filter(v => !process.env[v]);

    if (missing.length > 0) {
        const error = `
╔════════════════════════════════════════════════════════════╗
║ FIREBASE ADMIN SDK - CONFIGURATION ERROR                  ║
╚════════════════════════════════════════════════════════════╝

Missing required environment variables:
${missing.map(v => `  ❌ ${v}`).join('\n')}

Required for Firebase Admin SDK:
  - FIREBASE_PROJECT_ID
  - FIREBASE_PRIVATE_KEY (or FIREBASE_SERVICE_ACCOUNT)
  - FIREBASE_CLIENT_EMAIL (or FIREBASE_SERVICE_ACCOUNT)

Please set these in your .env.local file or environment.

Example:
  FIREBASE_PROJECT_ID=your-project-id
  FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"
  FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com

Or use service account JSON:
  FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}'

Server will not start without these values.
════════════════════════════════════════════════════════════
`;
        console.error(error);
        throw new Error('Firebase Admin SDK configuration error - see logs above');
    }

    // Option 1: Use service account JSON (for production)
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        try {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            adminApp = initializeApp({
                credential: cert(serviceAccount)
            });
            console.log('✅ Firebase Admin initialized with service account JSON');
        } catch (error) {
            console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT:', error);
            throw error;
        }
    }
    // Option 2: Use individual env vars (for local dev)
    else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY) {
        try {
            // CRITICAL: Handle newlines in private key correctly
            const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

            adminApp = initializeApp({
                credential: cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: privateKey
                })
            });
            console.log('✅ Firebase Admin initialized with individual env vars');
        } catch (error) {
            console.error('❌ Failed to initialize Firebase Admin with env vars:', error);
            throw error;
        }
    }
    // Option 3: Default credentials (for Cloud Run / GCP)
    else {
        try {
            adminApp = initializeApp();
            console.log('✅ Firebase Admin initialized with default credentials');
        } catch (error) {
            console.error('❌ Failed to initialize Firebase Admin with default credentials:', error);
            throw error;
        }
    }

    return adminApp;
}

/**
 * Get Firebase Admin Auth instance
 */
export function getAdminAuth() {
    const app = initAdmin();
    return getAuth(app);
}

/**
 * Get Firebase Admin Firestore instance
 */
export function getAdminFirestore() {
    const app = initAdmin();
    return getFirestore(app);
}

/**
 * Verify Firebase ID token
 * Returns decoded token with custom claims
 */
export async function verifyIdToken(idToken: string) {
    const auth = getAdminAuth();
    try {
        const decodedToken = await auth.verifyIdToken(idToken);
        return decodedToken;
    } catch (error) {
        console.error('[AUTH] Token verification failed:', error);
        throw new Error('Invalid or expired token');
    }
}

/**
 * Get user custom claims
 */
export async function getUserClaims(uid: string) {
    const auth = getAdminAuth();
    try {
        const user = await auth.getUser(uid);
        return user.customClaims || {};
    } catch (error) {
        console.error('[AUTH] Failed to get user claims:', error);
        return {};
    }
}

/**
 * Set user custom claims (platform_owner, org_admin, org_member)
 */
export async function setUserClaims(uid: string, claims: {
    role?: 'platform_owner' | 'org_admin' | 'org_member';
    orgId?: string;
}) {
    const auth = getAdminAuth();
    try {
        await auth.setCustomUserClaims(uid, claims);
        console.log('[AUTH] Claims updated for user:', uid, claims);
    } catch (error) {
        console.error('[AUTH] Failed to set claims:', error);
        throw error;
    }
}
