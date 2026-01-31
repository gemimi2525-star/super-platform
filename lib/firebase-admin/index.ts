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
import { handleError } from '@super-platform/core';

let adminApp: App | undefined;

/**
 * Initialize Firebase Admin (singleton)
 */
function initAdmin(): App {
    // Check if an app already exists and reuse it
    const existingApps = getApps();
    if (existingApps.length > 0) {
        adminApp = existingApps[0];
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
        // Error is a string message here, convert to Error object
        const errorObj = new Error(typeof error === 'string' ? error : String(error));
        const appError = handleError(errorObj);
        console.error(`[Firebase Admin] Configuration error [${appError.errorId}]:`, errorObj.message);
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
            const appError = handleError(error as Error);
            console.error(`[Firebase Admin] Failed to parse service account [${appError.errorId}]:`, (error as Error).message);
            throw error;
        }
    }
    // Option 2: Use individual env vars (for local dev)
    else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY) {
        try {
            // CRITICAL: Handle newlines in private key correctly
            let privateKey = process.env.FIREBASE_PRIVATE_KEY;

            // Handle escaped newlines (standard .env format)
            privateKey = privateKey.replace(/\\n/g, '\n');

            // Handle potential wrapping quotes if any leaked through
            if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
                privateKey = privateKey.slice(1, -1);
            }

            // Ensure valid PEM format
            if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
                throw new Error('FIREBASE_PRIVATE_KEY appears invalid (missing header). Check .env.local');
            }

            adminApp = initializeApp({
                credential: cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: privateKey
                })
            });
            console.log('✅ Firebase Admin initialized with individual env vars');
        } catch (error) {
            const appError = handleError(error as Error);
            console.error(`[Firebase Admin] Initialization failed [${appError.errorId}]:`, (error as Error).message);
            throw error;
        }
    }
    // Option 3: Default credentials (for Cloud Run / GCP)
    else {
        try {
            adminApp = initializeApp();
            console.log('✅ Firebase Admin initialized with default credentials');
        } catch (error) {
            const appError = handleError(error as Error);
            console.error(`[Firebase Admin] Default credentials failed [${appError.errorId}]:`, (error as Error).message);
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
 * 
 * WARNING: ID tokens expire after 1 hour!
 * For server-side auth, prefer verifySessionCookie() instead.
 */
export async function verifyIdToken(idToken: string) {
    const auth = getAdminAuth();
    try {
        const decodedToken = await auth.verifyIdToken(idToken);
        return decodedToken;
    } catch (error) {
        const appError = handleError(error as Error);
        console.error(`[AUTH] Token verification failed [${appError.errorId}]:`, (error as Error).message);
        throw new Error('Invalid or expired token');
    }
}

/**
 * Verify Firebase Session Cookie
 * 
 * RECOMMENDED for server-side auth:
 * - Session cookies can have expiry up to 14 days
 * - More suitable for web apps than short-lived ID tokens
 * - Survives browser refresh and tab closures
 * 
 * @param sessionCookie - The __session cookie value
 * @param checkRevoked - Whether to check if session was revoked (default: false for perf)
 */
export async function verifySessionCookie(sessionCookie: string, checkRevoked = false) {
    const auth = getAdminAuth();
    try {
        const decodedClaims = await auth.verifySessionCookie(sessionCookie, checkRevoked);
        return decodedClaims;
    } catch (error: any) {
        const errorCode = error?.code || error?.errorInfo?.code || '';

        // All session verification failures are expected auth flow events
        // Use info/warn level to avoid error noise and Next.js overlay
        if (errorCode === 'auth/session-cookie-expired') {
            console.info(`[AUTH] Session expired - redirect to login`);
        } else if (errorCode === 'auth/session-cookie-revoked') {
            console.info(`[AUTH] Session revoked - user signed out elsewhere`);
        } else if (errorCode === 'auth/argument-error' || error?.message?.includes('iss')) {
            // This happens when old raw ID token cookie is still present
            // Will be fixed after user re-logins with new session flow
            console.info(`[AUTH] Invalid session format - needs re-login`);
        } else {
            // Unknown but still expected auth flow
            console.warn(`[AUTH] Session verify failed (${errorCode})`);
        }

        // Throw with specific error code for upstream handling
        const err = new Error('Invalid or expired session');
        (err as any).code = errorCode || 'auth/session-invalid';
        throw err;
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
        const appError = handleError(error as Error);
        console.error(`[AUTH] Failed to get user claims [${appError.errorId}]:`, (error as Error).message);
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
        const appError = handleError(error as Error);
        console.error(`[AUTH] Failed to set claims [${appError.errorId}]:`, (error as Error).message);
        throw error;
    }
}

/**
 * Create Firebase Session Cookie
 * Exchange an ID token for a long-lived session cookie
 * 
 * @param idToken - The ID token from the client
 * @param expiresIn - Duration in milliseconds (default 5 days)
 */
export async function createSessionCookie(idToken: string, expiresIn = 60 * 60 * 24 * 5 * 1000) {
    const auth = getAdminAuth();
    try {
        const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });
        return sessionCookie;
    } catch (error) {
        const appError = handleError(error as Error);
        console.error(`[AUTH] Failed to create session cookie [${appError.errorId}]:`, (error as Error).message);
        throw error;
    }
}
