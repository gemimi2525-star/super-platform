
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function main() {
    console.log('🌱 Seeding Owner Role...');

    // Initialize Firebase Admin
    if (getApps().length === 0) {
        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
            initializeApp({
                credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
            });
            console.log('Using Service Account JSON');
        } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY) {
            let privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
            if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
                privateKey = privateKey.slice(1, -1);
            }

            initializeApp({
                credential: cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: privateKey
                })
            });
            console.log('Using Env Vars (Private Key)');
        } else {
            console.log('Using Default Credentials');
            initializeApp({
                projectId: process.env.FIREBASE_PROJECT_ID || 'demo-platform-dev'
            });
        }
    }

    const auth = getAuth();
    const db = getFirestore();

    const email = 'owner@test.com';

    try {
        const user = await auth.getUserByEmail(email);
        console.log(`Found user: ${user.uid}`);

        // Update Firestore Role
        await db.collection('platform_users').doc(user.uid).set({
            role: 'owner',
            email: email,
            updatedAt: new Date()
        }, { merge: true });

        console.log(`✅ Successfully promoted ${email} to OWNER`);

        // Update Custom Claims
        await auth.setCustomUserClaims(user.uid, { role: 'platform_owner' });
        console.log('✅ Custom claims updated');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error seeding owner:', error);
        process.exit(1);
    }
}

main();
