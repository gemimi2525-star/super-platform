#!/usr/bin/env node

/**
 * Seed Enabled Apps Script
 * 
 * Auto-enables SEO app for all existing organizations
 * Run: node scripts/seed-enabled-apps.js
 * 
 * Requirements:
 * - FIREBASE_SERVICE_ACCOUNT or Firebase credentials in env
 */

const { getAdminFirestore } = require('../packages/firebase-admin/src');

async function seedEnabledApps() {
    console.log('🌱 Seeding enabled_apps for existing orgs...\n');

    const db = getAdminFirestore();

    try {
        // Get all orgs
        const orgsSnapshot = await db.collection('orgs').get();
        console.log(`Found ${orgsSnapshot.size} organizations\n`);

        let enabledCount = 0;
        let skippedCount = 0;

        for (const orgDoc of orgsSnapshot.docs) {
            const orgId = orgDoc.id;
            const orgData = orgDoc.data();

            // Check if SEO is already enabled
            const seoEnabled = await db
                .collection('orgs')
                .doc(orgId)
                .collection('enabled_apps')
                .doc('seo')
                .get();

            if (seoEnabled.exists) {
                console.log(`⏭️  ${orgData.name || orgId}: SEO already enabled`);
                skippedCount++;
                continue;
            }

            // Enable SEO app
            await db
                .collection('orgs')
                .doc(orgId)
                .collection('enabled_apps')
                .doc('seo')
                .set({
                    enabledAt: new Date(),
                    config: {}
                });

            console.log(`✅ ${orgData.name || orgId}: SEO enabled`);
            enabledCount++;
        }

        console.log(`\n📊 Summary:`);
        console.log(`   Enabled: ${enabledCount}`);
        console.log(`   Skipped: ${skippedCount}`);
        console.log(`   Total: ${orgsSnapshot.size}\n`);
        console.log('✨ Seed complete!\n');

    } catch (error) {
        console.error('❌ Seed failed:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    seedEnabledApps()
        .then(() => process.exit(0))
        .catch(err => {
            console.error(err);
            process.exit(1);
        });
}

module.exports = { seedEnabledApps };
