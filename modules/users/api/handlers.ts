/**
 * Users API Handlers
 * 
 * Server-side logic for user management
 * Used by app/api/platform/users/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import type { PlatformUser, CreateUserRequest, UpdateUserRequest } from '../types';

/**
 * Get all platform users
 */
export async function getUsersHandler() {
    const { getAdminFirestore } = await import('@/lib/firebase-admin');
    const db = getAdminFirestore();

    const snapshot = await db
        .collection('platform_users')
        .orderBy('createdAt', 'desc')
        .get();

    const users: PlatformUser[] = snapshot.docs.map((doc) => ({
        uid: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt,
    })) as PlatformUser[];

    return { users };
}

/**
 * Create a new platform user
 */
export async function createUserHandler(data: CreateUserRequest) {
    const { getAdminAuth, getAdminFirestore } = await import('@/lib/firebase-admin');
    const auth = getAdminAuth();
    const db = getAdminFirestore();

    // Generate random password if not provided
    const password = data.password || generateRandomPassword();

    // Create Firebase Auth user
    const userRecord = await auth.createUser({
        email: data.email,
        password,
        displayName: data.displayName,
        emailVerified: true,
    });

    // Create Firestore document
    const now = new Date();
    const platformUser: Omit<PlatformUser, 'uid'> = {
        email: data.email,
        displayName: data.displayName,
        role: data.role,
        permissions: data.permissions || [],
        enabled: true,
        createdBy: 'system', // TODO: Get from auth context
        createdAt: now,
        updatedAt: now,
    };

    await db.collection('platform_users').doc(userRecord.uid).set(platformUser);

    return {
        user: { uid: userRecord.uid, ...platformUser },
        temporaryPassword: password,
    };
}

/**
 * Update an existing platform user
 */
export async function updateUserHandler(uid: string, data: UpdateUserRequest) {
    const { getAdminAuth, getAdminFirestore } = await import('@/lib/firebase-admin');
    const auth = getAdminAuth();
    const db = getAdminFirestore();

    // Update Firebase Auth if displayName changed
    if (data.displayName) {
        await auth.updateUser(uid, {
            displayName: data.displayName,
        });
    }

    // Update Firestore document
    const updates: Record<string, unknown> = {
        ...data,
        updatedAt: new Date(),
    };

    await db.collection('platform_users').doc(uid).update(updates);

    // Get updated user
    const doc = await db.collection('platform_users').doc(uid).get();

    return {
        user: {
            uid: doc.id,
            ...doc.data(),
        } as PlatformUser,
    };
}

/**
 * Generate a random password
 */
function generateRandomPassword(length = 12): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}
