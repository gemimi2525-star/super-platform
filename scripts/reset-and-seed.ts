/**
 * RESET AND SEED FIREBASE
 * 
 * 1. DELETES ALL Auth Users
 * 2. DELETES ALL Firestore Collections
 * 3. SEEDS Initial Platform Users
 * 
 * Usage:
 *   npx tsx scripts/reset-and-seed.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

// Remap NEXT_PUBLIC_ variables
if (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID && !process.env.FIREBASE_PROJECT_ID) {
    process.env.FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
}
if (process.env.NEXT_PUBLIC_FIREBASE_PRIVATE_KEY && !process.env.FIREBASE_PRIVATE_KEY) {
    process.env.FIREBASE_PRIVATE_KEY = process.env.NEXT_PUBLIC_FIREBASE_PRIVATE_KEY;
}
if (process.env.NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL && !process.env.FIREBASE_CLIENT_EMAIL) {
    process.env.FIREBASE_CLIENT_EMAIL = process.env.NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL;
}

// Import from local lib (using relative path for script)
import { getAdminAuth, getAdminFirestore } from '../lib/firebase-admin';

// Configuration
const COLLECTIONS_TO_CLEAR = [
    'platform_users',
    'platform_audit_logs',
    'orgs',
    'invitations',
    'audit_logs',
    'users'
];

const PLATFORM_USERS = [
    {
        email: 'admin@apicoredata.com',
        password: 'Password@123',
        displayName: 'Platform Admin',
        role: 'owner' as const,
    },
    {
        email: 'staff@apicoredata.com',
        password: 'Password@123',
        displayName: 'Staff User',
        role: 'admin' as const,
    },
];

async function main() {
    console.log('⚠️  STARTING FIREBASE RESET - THIS WILL DELETE ALL DATA ⚠️\n');

    const auth = getAdminAuth();
    const db = getAdminFirestore();

    // 1. Clear Auth Users
    console.log('🗑️  Clearing Auth Users...');
    try {
        const listUsersResult = await auth.listUsers(1000);
        const uids = listUsersResult.users.map((user) => user.uid);

        if (uids.length > 0) {
            await auth.deleteUsers(uids);
            console.log(`   ✅ Deleted ${uids.length} users`);
        } else {
            console.log('   ℹ️  No users found');
        }
    } catch (error) {
        console.error('   ❌ Failed to clear users:', error);
    }

    // 2. Clear Firestore Collections
    console.log('\n🗑️  Clearing Firestore Collections...');
    for (const collectionName of COLLECTIONS_TO_CLEAR) {
        try {
            const batch = db.batch();
            const snapshot = await db.collection(collectionName).limit(500).get();

            if (snapshot.empty) {
                console.log(`   ℹ️  Collection '${collectionName}' is empty`);
                continue;
            }

            snapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });

            await batch.commit();
            console.log(`   ✅ Cleared collection '${collectionName}' (${snapshot.size} docs)`);

            // Note: For very large collections, this needs to be recursive. 
            // Assuming < 500 docs for test env.
        } catch (error) {
            console.error(`   ❌ Failed to clear collection '${collectionName}':`, error);
        }
    }

    // 3. Seed Platform Users
    console.log('\n🌱 Seeding Platform Users...');

    for (const userData of PLATFORM_USERS) {
        try {
            console.log(`   Creating ${userData.role}: ${userData.email}...`);

            // Create Auth User
            const userRecord = await auth.createUser({
                email: userData.email,
                password: userData.password,
                displayName: userData.displayName,
                emailVerified: true,
            });

            // Create Firestore Document
            await db.collection('platform_users').doc(userRecord.uid).set({
                email: userData.email,
                displayName: userData.displayName,
                role: userData.role,
                permissions: [],
                enabled: true,
                createdBy: 'system',
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            console.log(`   ✅ Success (UID: ${userRecord.uid})`);
        } catch (error) {
            console.error(`   ❌ Failed to create ${userData.email}:`, error);
        }
    }

    console.log('\n🎉 RESET AND SEED COMPLETE!');
    process.exit(0);
}

main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
