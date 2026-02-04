/**
 * RESET AND SEED FIREBASE
 * 
 * 1. DELETES ALL Auth Users
 * 2. DELETES ALL Firestore Collections
 * 3. SEEDS Initial Platform Users
 * 4. SEEDS Organizations (Phase 10.1)
 * 5. SEEDS Audit Logs (Phase 10.1)
 * 6. SEEDS Alerts (Phase 10.1)
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
    'organizations',
    'invitations',
    'audit_logs',
    'alerts',
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

// Phase 10.1: Organizations seed data
const ORGANIZATIONS = [
    {
        id: 'org-seed-001',
        name: 'Acme Corporation',
        slug: 'acme-corp',
        plan: 'pro',
        domain: 'acme.example.com',
        status: 'active',
        modules: ['seo', 'analytics'],
        settings: {
            timezone: 'Asia/Bangkok',
            currency: 'THB',
            dateFormat: 'DD/MM/YYYY',
            language: 'th',
        },
    },
    {
        id: 'org-seed-002',
        name: 'Demo Enterprise',
        slug: 'demo-enterprise',
        plan: 'enterprise',
        domain: 'demo.apicoredata.local',
        status: 'active',
        modules: ['seo', 'analytics', 'reports'],
        settings: {
            timezone: 'UTC',
            currency: 'USD',
            dateFormat: 'YYYY-MM-DD',
            language: 'en',
        },
    },
];

// Phase 10.1: Audit logs seed data
const AUDIT_LOGS = [
    { action: 'user.created', outcome: 'success', details: { targetEmail: 'admin@apicoredata.com', role: 'owner' } },
    { action: 'user.created', outcome: 'success', details: { targetEmail: 'staff@apicoredata.com', role: 'admin' } },
    { action: 'org.created', outcome: 'success', details: { orgName: 'Acme Corporation', plan: 'pro' } },
    { action: 'session.created', outcome: 'success', details: { method: 'password', ip: '127.0.0.1' } },
    { action: 'permission.denied', outcome: 'denied', details: { resource: '/api/platform/users', reason: 'insufficient_role' } },
];

// Phase 10.1: Alerts seed data
const ALERTS = [
    {
        id: 'alert-seed-001',
        type: 'warning',
        title: 'High Memory Usage',
        description: 'Memory usage is above 80% threshold',
        severity: 'medium',
        acknowledged: false,
        correlatedRequestIds: [],
    },
    {
        id: 'alert-seed-002',
        type: 'info',
        title: 'System Update Available',
        description: 'A new system update is ready to install',
        severity: 'low',
        acknowledged: true,
        correlatedRequestIds: [],
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
    let ownerUid = '';

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

            // Store owner UID for audit logs
            if (userData.role === 'owner') {
                ownerUid = userRecord.uid;
            }

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

    // 4. Seed Organizations (Phase 10.1)
    console.log('\n🌱 Seeding Organizations...');
    for (const org of ORGANIZATIONS) {
        try {
            await db.collection('organizations').doc(org.id).set({
                ...org,
                createdAt: new Date(),
                updatedAt: new Date(),
                createdBy: ownerUid || 'system',
            });
            console.log(`   ✅ Created org: ${org.name} (${org.plan})`);
        } catch (error) {
            console.error(`   ❌ Failed to create org ${org.name}:`, error);
        }
    }

    // 5. Seed Audit Logs (Phase 10.1)
    console.log('\n🌱 Seeding Audit Logs...');
    for (let i = 0; i < AUDIT_LOGS.length; i++) {
        const log = AUDIT_LOGS[i];
        try {
            await db.collection('platform_audit_logs').add({
                action: log.action,
                outcome: log.outcome,
                actorUid: ownerUid || 'system',
                actorEmail: 'admin@apicoredata.com',
                details: log.details,
                timestamp: new Date(Date.now() - (i * 3600000)), // Stagger by 1 hour
            });
            console.log(`   ✅ Created audit log: ${log.action} (${log.outcome})`);
        } catch (error) {
            console.error(`   ❌ Failed to create audit log ${log.action}:`, error);
        }
    }

    // 6. Seed Alerts (Phase 10.1)
    console.log('\n🌱 Seeding Alerts...');
    for (const alert of ALERTS) {
        try {
            await db.collection('alerts').doc(alert.id).set({
                ...alert,
                timestamp: new Date(),
            });
            console.log(`   ✅ Created alert: ${alert.title} (${alert.severity})`);
        } catch (error) {
            console.error(`   ❌ Failed to create alert ${alert.title}:`, error);
        }
    }

    console.log('\n🎉 RESET AND SEED COMPLETE!');
    console.log('\n📋 Summary:');
    console.log(`   - Platform Users: ${PLATFORM_USERS.length}`);
    console.log(`   - Organizations: ${ORGANIZATIONS.length}`);
    console.log(`   - Audit Logs: ${AUDIT_LOGS.length}`);
    console.log(`   - Alerts: ${ALERTS.length}`);
    process.exit(0);
}

main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});

