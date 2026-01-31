import { NextResponse } from 'next/server';
import { getAdminFirestore, verifyIdToken } from '@/lib/firebase-admin';

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Missing token' }, { status: 401 });
        }
        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await verifyIdToken(token);
        const { uid, email } = decodedToken;

        if (!email) return NextResponse.json({ error: 'No email' }, { status: 400 });

        const db = getAdminFirestore();
        const userRef = db.collection('platform_users').doc(uid);
        const userDoc = await userRef.get();
        const userData = userDoc.data() || {};

        // 1. BOOTSTRAP USER (Owner Rule)
        let role = userData.role || 'user';

        // Forced bootstrap for owner emails (platform admins)
        const ownerEmails = [
            'ninenitiwor@gmail.com',
            'admin@apicoredata.com',  // Dev admin account
        ];
        if (ownerEmails.includes(email)) {
            role = 'owner';
        }

        const userUpdates: any = {
            email,
            role,
            lastLoginAt: new Date().toISOString(),
            enabled: true
        };

        // 2. ORG SEEDING
        // Only seed if user has no default Org AND is an owner/admin candidate
        let defaultOrgId = userData.defaultOrgId;

        if (!defaultOrgId) {
            if (role === 'owner') {
                // Check if there are any existing platform_orgs owned by this user to reuse
                const existingOrgs = await db.collection('platform_orgs')
                    .where('ownerId', '==', uid)
                    .limit(1)
                    .get();

                if (!existingOrgs.empty) {
                    defaultOrgId = existingOrgs.docs[0].id;
                } else {
                    // Create NEW Seed Org
                    const newOrgRef = db.collection('platform_orgs').doc();
                    defaultOrgId = newOrgRef.id;

                    await newOrgRef.set({
                        name: 'APICOREDATA HQ',
                        status: 'active',
                        ownerId: uid,
                        createdAt: new Date().toISOString(),
                        entitlements: {
                            // Default Entitlements for the first org
                            flags: ['app.users', 'app.orgs', 'app.settings', 'app.audit'],
                            updatedAt: new Date().toISOString(),
                            source: 'bootstrap'
                        }
                    });

                    console.log(`[BOOTSTRAP] Created Seed Org: ${defaultOrgId}`);
                }

                userUpdates.defaultOrgId = defaultOrgId;
            }
        }

        // Commit User Updates
        await userRef.set(userUpdates, { merge: true });

        console.log(`[BOOTSTRAP] Success for ${email} (${role}) -> Org: ${defaultOrgId || 'none'}`);

        return NextResponse.json({
            success: true,
            role,
            orgId: defaultOrgId
        });

    } catch (error: any) {
        console.error('[BOOTSTRAP] Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Error' }, { status: 500 });
    }
}
