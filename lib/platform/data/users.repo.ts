/**
 * Users Repository
 * 
 * Data access for user documents.
 * Part of Phase 12: Real Data Wiring
 * 
 * SYNAPSE Kernel: FROZEN ❄️ - This module does NOT touch synapse-core
 * Policy decisions are NOT made here - only data access
 */

import { getDb, getDocument, listDocuments, createDocument, updateDocument, withProtection } from './firestore';
import type { DocumentResponse } from './firestore';

// ============================================================================
// Types
// ============================================================================

export type UserRole = 'guest' | 'user' | 'admin' | 'owner';
export type UserStatus = 'active' | 'suspended';

export interface User {
    id: string;
    email: string;
    displayName: string;
    role: UserRole;
    orgIds: string[];
    status: UserStatus;
    createdAt: string;
    updatedAt: string;
    lastLogin?: string;
}

export interface CreateUserInput {
    email: string;
    displayName: string;
    role: UserRole;
    orgIds?: string[];
    status?: UserStatus;
}

export interface UpdateUserInput {
    displayName?: string;
    role?: UserRole;
    orgIds?: string[];
    status?: UserStatus;
    lastLogin?: string;
}

// ============================================================================
// Constants
// ============================================================================

// Canonical collection name
const COLLECTION = 'platform_users';

// ============================================================================
// Repository Methods
// ============================================================================

/**
 * Get user by ID.
 * Checks both 'users' and 'platform_users' collections for compatibility.
 */
export async function getUserById(userId: string): Promise<DocumentResponse<User>> {
    // Try primary collection first
    const result = await getDocument<User>(COLLECTION, userId);

    if (result.ok) {
        return result;
    }

    // Now just uses canonical collection
    return getDocument<User>(COLLECTION, userId);
}

/**
 * Get user by email.
 */
export async function getUserByEmail(email: string): Promise<DocumentResponse<User>> {
    try {
        const result = await withProtection(
            `getUserByEmail:${email}`,
            async () => {
                const db = getDb();

                // Try primary collection
                let snapshot = await db.collection(COLLECTION)
                    .where('email', '==', email)
                    .limit(1)
                    .get();

                if (snapshot.empty) {
                    // No fallback needed - single canonical collection
                }

                return snapshot;
            }
        );

        if (result.empty) {
            return {
                ok: false,
                code: 'DATA_NOT_FOUND',
                message: `User with email ${email} not found`,
            };
        }

        const doc = result.docs[0];
        return {
            ok: true,
            data: { id: doc.id, ...doc.data() } as User,
        };
    } catch (err) {
        return {
            ok: false,
            code: 'BUG_UNHANDLED',
            message: (err as Error).message,
        };
    }
}

/**
 * List all users.
 */
export async function listUsers(options: {
    limit?: number;
    status?: UserStatus;
    role?: UserRole;
} = {}): Promise<DocumentResponse<User[]>> {
    try {
        const result = await withProtection(
            'listUsers',
            async () => {
                const db = getDb();
                let query = db.collection(COLLECTION) as FirebaseFirestore.Query;

                if (options.status) {
                    query = query.where('status', '==', options.status);
                }

                if (options.role) {
                    query = query.where('role', '==', options.role);
                }

                if (options.limit) {
                    query = query.limit(options.limit);
                }

                return query.get();
            }
        );

        const users = result.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        })) as User[];

        return {
            ok: true,
            data: users,
        };
    } catch (err) {
        return {
            ok: false,
            code: 'BUG_UNHANDLED',
            message: (err as Error).message,
        };
    }
}

/**
 * Create a new user.
 * NOTE: Role changes should be controlled by policy, not direct writes.
 */
export async function createUser(input: CreateUserInput): Promise<DocumentResponse<User>> {
    const userData = {
        email: input.email,
        displayName: input.displayName,
        role: input.role,
        orgIds: input.orgIds || [],
        status: input.status || 'active',
    };

    return createDocument<User>(COLLECTION, userData);
}

/**
 * Update a user.
 * NOTE: Role changes should be controlled by policy, not direct writes.
 */
export async function updateUser(
    userId: string,
    input: UpdateUserInput
): Promise<DocumentResponse<User>> {
    return updateDocument<User>(COLLECTION, userId, input);
}

/**
 * Update user's last login time.
 */
export async function updateLastLogin(userId: string): Promise<DocumentResponse<User>> {
    return updateUser(userId, {
        lastLogin: new Date().toISOString(),
    });
}
