/**
 * Firestore Data Access Layer Core
 * 
 * Provides database access with circuit breaker protection.
 * Part of Phase 12: Real Data Wiring
 * 
 * SYNAPSE Kernel: FROZEN ❄️ - This module does NOT touch synapse-core
 */

import { getAdminFirestore } from '../../firebase-admin';
import { withTimeout, withRetry, firestoreCircuit, FIRESTORE_TIMEOUT_MS } from '../runtime/circuit';
import { ErrorCodes, normalizeError } from '../errors/normalize';
import { info, error as logError } from '../logging/logger';
import type { Firestore } from 'firebase-admin/firestore';

// ============================================================================
// Types
// ============================================================================

export interface QueryOptions {
    limit?: number;
    orderBy?: string;
    orderDirection?: 'asc' | 'desc';
}

export interface DocumentResult<T> {
    ok: true;
    data: T;
}

export interface DocumentError {
    ok: false;
    code: string;
    message: string;
}

export type DocumentResponse<T> = DocumentResult<T> | DocumentError;

// ============================================================================
// Database Access
// ============================================================================

/**
 * Get Firestore instance.
 */
export function getDb(): Firestore {
    return getAdminFirestore();
}

// ============================================================================
// Protected Operations
// ============================================================================

/**
 * Execute a Firestore operation with circuit breaker and timeout protection.
 */
export async function withProtection<T>(
    operationName: string,
    operation: () => Promise<T>
): Promise<T> {
    return firestoreCircuit.execute(async () => {
        return withTimeout(operation, {
            timeoutMs: FIRESTORE_TIMEOUT_MS,
            operationName,
        });
    });
}

/**
 * Execute a Firestore operation with circuit breaker, timeout, and retry.
 */
export async function withProtectionAndRetry<T>(
    operationName: string,
    operation: () => Promise<T>,
    maxRetries = 2
): Promise<T> {
    return withRetry(
        () => withProtection(operationName, operation),
        {
            maxRetries,
            delayMs: 1000,
            backoffMultiplier: 2,
        }
    );
}

// ============================================================================
// Error Mapping
// ============================================================================

/**
 * Map Firestore errors to Phase 11 error codes.
 */
export function mapFirestoreError(err: unknown): DocumentError {
    const error = err as Error & { code?: string };

    // Check for specific Firestore error codes
    if (error.code) {
        switch (error.code) {
            case 'not-found':
                return {
                    ok: false,
                    code: ErrorCodes.DATA_NOT_FOUND,
                    message: 'Document not found',
                };
            case 'permission-denied':
                return {
                    ok: false,
                    code: ErrorCodes.AUTH_FORBIDDEN,
                    message: 'Permission denied',
                };
            case 'deadline-exceeded':
            case 'unavailable':
                return {
                    ok: false,
                    code: ErrorCodes.INFRA_TIMEOUT,
                    message: 'Database timeout',
                };
            case 'resource-exhausted':
                return {
                    ok: false,
                    code: ErrorCodes.INFRA_RATE_LIMIT,
                    message: 'Rate limit exceeded',
                };
        }
    }

    // Check for timeout in message
    if (error.message?.toLowerCase().includes('timeout')) {
        return {
            ok: false,
            code: ErrorCodes.INFRA_TIMEOUT,
            message: 'Database operation timed out',
        };
    }

    // Default to unhandled
    return {
        ok: false,
        code: ErrorCodes.BUG_UNHANDLED,
        message: error.message || 'Unknown database error',
    };
}

// ============================================================================
// Collection Helpers
// ============================================================================

/**
 * Get a document by ID with protection.
 */
export async function getDocument<T>(
    collection: string,
    docId: string
): Promise<DocumentResponse<T>> {
    try {
        const doc = await withProtection(
            `getDocument:${collection}/${docId}`,
            async () => {
                const db = getDb();
                return db.collection(collection).doc(docId).get();
            }
        );

        if (!doc.exists) {
            return {
                ok: false,
                code: ErrorCodes.DATA_NOT_FOUND,
                message: `Document ${collection}/${docId} not found`,
            };
        }

        info('API', `Fetched ${collection}/${docId}`, { path: `/${collection}/${docId}` });

        return {
            ok: true,
            data: { id: doc.id, ...doc.data() } as T,
        };
    } catch (err) {
        logError('API', `Error fetching ${collection}/${docId}`, { code: (err as Error).message });
        return mapFirestoreError(err);
    }
}

/**
 * List documents in a collection with protection.
 */
export async function listDocuments<T>(
    collection: string,
    options: QueryOptions = {}
): Promise<DocumentResponse<T[]>> {
    try {
        const docs = await withProtection(
            `listDocuments:${collection}`,
            async () => {
                const db = getDb();
                let query = db.collection(collection) as FirebaseFirestore.Query;

                if (options.orderBy) {
                    query = query.orderBy(options.orderBy, options.orderDirection || 'desc');
                }

                if (options.limit) {
                    query = query.limit(options.limit);
                }

                return query.get();
            }
        );

        const results = docs.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        })) as T[];

        info('API', `Listed ${collection}: ${results.length} docs`, { path: `/${collection}` });

        return {
            ok: true,
            data: results,
        };
    } catch (err) {
        logError('API', `Error listing ${collection}`, { code: (err as Error).message });
        return mapFirestoreError(err);
    }
}

/**
 * Create a document with protection.
 * Auto-generates createdAt and updatedAt fields.
 */
export async function createDocument<T extends { id: string }>(
    collection: string,
    data: Record<string, unknown>
): Promise<DocumentResponse<T>> {
    try {
        const docRef = await withProtection(
            `createDocument:${collection}`,
            async () => {
                const db = getDb();
                const docData = {
                    ...data,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };
                return db.collection(collection).add(docData);
            }
        );

        info('API', `Created ${collection}/${docRef.id}`, { path: `/${collection}` });

        return {
            ok: true,
            data: { id: docRef.id, ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as unknown as T,
        };
    } catch (err) {
        logError('API', `Error creating ${collection}`, { code: (err as Error).message });
        return mapFirestoreError(err);
    }
}

/**
 * Update a document with protection.
 */
export async function updateDocument<T>(
    collection: string,
    docId: string,
    data: Partial<T>
): Promise<DocumentResponse<T>> {
    try {
        await withProtection(
            `updateDocument:${collection}/${docId}`,
            async () => {
                const db = getDb();
                const updateData = {
                    ...data,
                    updatedAt: new Date().toISOString(),
                };
                return db.collection(collection).doc(docId).update(updateData);
            }
        );

        // Fetch updated document
        return getDocument<T>(collection, docId);
    } catch (err) {
        logError('API', `Error updating ${collection}/${docId}`, { code: (err as Error).message });
        return mapFirestoreError(err);
    }
}
