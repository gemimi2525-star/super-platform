
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Mock console.log to be cleaner
const log = console.log;

console.log('\n🔍 Testing Firebase Connection...\n');

async function testConnection() {
    try {
        // 1. Check Env Vars
        console.log('1️⃣  Checking Environment Variables:');
        const required = [
            'FIREBASE_PROJECT_ID',
            'FIREBASE_CLIENT_EMAIL',
            'FIREBASE_PRIVATE_KEY',
            'NEXT_PUBLIC_FIREBASE_PROJECT_ID'
        ];

        const missing = required.filter(k => !process.env[k]);
        if (missing.length > 0) {
            console.error('   ❌ Missing:', missing.join(', '));
            process.exit(1);
        }

        console.log(`   ✅ Project ID: ${process.env.FIREBASE_PROJECT_ID}`);
        console.log(`   ✅ Client Email: ${process.env.FIREBASE_CLIENT_EMAIL}`);
        console.log(`   ✅ Private Key found (${process.env.FIREBASE_PRIVATE_KEY?.length} chars)`);

        // 2. Import Admin SDK (dynamic import to ensure env is loaded)
        console.log('\n2️⃣  Initializing Firebase Admin SDK:');
        const { getAdminFirestore, getAdminAuth } = await import('../lib/firebase-admin');

        // 3. Test Firestore
        console.log('\n3️⃣  Testing Firestore Connection:');
        const db = getAdminFirestore();
        try {
            const testRef = db.collection('platform_audit_logs').limit(1);
            const snapshot = await testRef.get();
            console.log('   ✅ Firestore Connected!');
            console.log(`   ℹ️  Read success (empty result is ok). Docs found: ${snapshot.size}`);
        } catch (error: any) {
            console.error('   ❌ Firestore Connection Failed:', error.message);
            throw error;
        }

        // 4. Test Auth
        console.log('\n4️⃣  Testing Auth Service:');
        const auth = getAdminAuth();
        try {
            // Try to list users (limit 1) just to check permission
            const listUsersResult = await auth.listUsers(1);
            console.log('   ✅ Auth Service Connected!');
            console.log(`   ℹ️  Users count in page: ${listUsersResult.users.length}`);
        } catch (error: any) {
            console.error('   ❌ Auth Connection Failed:', error.message);
            throw error;
        }

        console.log('\n🎉 SUCCESS: All Firebase services connected successfully!\n');
        process.exit(0);

    } catch (error: any) {
        console.error('\n❌ FATAL ERROR:', error.message);
        process.exit(1);
    }
}

testConnection();
