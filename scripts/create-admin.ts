
import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import { cert } from 'firebase-admin/app';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Get the private key and fix newlines if strictly needed (though the SDK handles some)
const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined;

if (!privateKey) {
    console.error('FIREBASE_PRIVATE_KEY is missing');
    process.exit(1);
}

const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: privateKey,
};

if (!admin.apps.length) {
    admin.initializeApp({
        credential: cert(serviceAccount),
    });
}

const auth = admin.auth();

const user = {
    email: 'admin@apicoredata.com',
    password: 'Password@123',
    displayName: 'Admin User',
    emailVerified: true,
};

async function createAdmin() {
    try {
        console.log(`Checking if user ${user.email} exists...`);
        try {
            const existingUser = await auth.getUserByEmail(user.email);
            console.log('User already exists:', existingUser.uid);

            // Optional: Reset password if it exists just to be sure
            await auth.updateUser(existingUser.uid, {
                password: user.password,
                emailVerified: true
            });
            console.log('Password updated/reset to default.');

        } catch (error: any) {
            if (error.code === 'auth/user-not-found') {
                console.log('User not found. Creating new user...');
                const newUser = await auth.createUser(user);
                console.log('Successfully created new user:', newUser.uid);
            } else {
                throw error;
            }
        }

        console.log('Done.');
        process.exit(0);
    } catch (error) {
        console.error('Error managing user:', error);
        process.exit(1);
    }
}

createAdmin();
