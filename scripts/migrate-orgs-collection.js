/**
 * Organizations Collection Migration Script
 * 
 * Copies all documents from 'orgs' collection to 'organizations' collection
 * Preserves all fields and document IDs
 * 
 * Usage:
 *   # Dry run (preview only)
 *   node scripts/migrate-orgs-collection.js --dry-run
 * 
 *   # Actual migration
 *   node scripts/migrate-orgs-collection.js
 * 
 * Requirements:
 *   - Firebase Admin SDK credentials configured
 *   - .env file with FIREBASE_ADMIN_* variables
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// =============================================================================
// CONFIGURATION
// =============================================================================

const SOURCE_COLLECTION = 'orgs';
const TARGET_COLLECTION = 'organizations';
const BATCH_SIZE = 500; // Firestore batch write limit

// Parse command line args
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');

// =============================================================================
// INITIALIZE FIREBASE ADMIN
// =============================================================================

let serviceAccount;

// Try to load service account from multiple possible locations
const possiblePaths = [
    path.join(__dirname, '../serviceAccountKey.json'),
    path.join(__dirname, '../firebase-admin-key.json'),
    process.env.GOOGLE_APPLICATION_CREDENTIALS,
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
];

for (const filePath of possiblePaths) {
    if (filePath && fs.existsSync(filePath)) {
        serviceAccount = require(filePath);
        console.log(`✓ Loaded service account from: ${filePath}`);
        break;
    }
}

if (!serviceAccount) {
    console.error('ERROR: Service account key not found!');
    console.error('Please provide one of the following:');
    console.error('  1. serviceAccountKey.json in project root');
    console.error('  2. firebase-admin-key.json in project root');
    console.error('  3. GOOGLE_APPLICATION_CREDENTIALS env variable');
    console.error('  4. FIREBASE_SERVICE_ACCOUNT_PATH env variable');
    process.exit(1);
}

// Initialize Firebase Admin
try {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log('✓ Firebase Admin initialized');
} catch (error) {
    console.error('ERROR: Failed to initialize Firebase Admin:', error.message);
    process.exit(1);
}

const db = admin.firestore();

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get document count in a collection
 */
async function getCollectionCount(collectionName) {
    const snapshot = await db.collection(collectionName).get();
    return snapshot.size;
}

/**
 * Copy documents in batches
 */
async function copyDocuments(sourceCollection, targetCollection, dryRun = false) {
    console.log('\n' + '='.repeat(80));
    console.log(`COPYING: ${sourceCollection} → ${targetCollection}`);
    console.log('='.repeat(80) + '\n');

    // Get all source documents
    console.log(`Fetching documents from '${sourceCollection}'...`);
    const sourceSnapshot = await db.collection(sourceCollection).get();

    if (sourceSnapshot.empty) {
        console.log(`⚠️  Source collection '${sourceCollection}' is empty. Nothing to copy.`);
        return {
            total: 0,
            copied: 0,
            docIds: []
        };
    }

    const totalDocs = sourceSnapshot.size;
    console.log(`✓ Found ${totalDocs} documents in source collection\n`);

    const copiedDocIds = [];
    let copiedCount = 0;
    let batchCount = 0;
    let batch = db.batch();

    // Process each document
    for (const doc of sourceSnapshot.docs) {
        const docId = doc.id;
        const docData = doc.data();

        if (dryRun) {
            console.log(`[DRY RUN] Would copy: ${docId}`);
            if (copiedCount < 3) {
                console.log(`  Data preview:`, JSON.stringify(docData, null, 2).substring(0, 200) + '...');
            }
        } else {
            const targetRef = db.collection(targetCollection).doc(docId);
            batch.set(targetRef, docData);
            batchCount++;
        }

        copiedDocIds.push(docId);
        copiedCount++;

        // Commit batch when limit reached
        if (!dryRun && batchCount >= BATCH_SIZE) {
            console.log(`Committing batch (${batchCount} documents)...`);
            await batch.commit();
            batch = db.batch();
            batchCount = 0;
        }
    }

    // Commit remaining documents
    if (!dryRun && batchCount > 0) {
        console.log(`Committing final batch (${batchCount} documents)...`);
        await batch.commit();
    }

    return {
        total: totalDocs,
        copied: copiedCount,
        docIds: copiedDocIds
    };
}

// =============================================================================
// MAIN MIGRATION FUNCTION
// =============================================================================

async function runMigration() {
    try {
        console.log('\n' + '█'.repeat(80));
        console.log('ORGANIZATIONS COLLECTION MIGRATION');
        console.log('█'.repeat(80));
        console.log(`Mode: ${isDryRun ? 'DRY RUN (Preview Only)' : 'LIVE MIGRATION'}`);
        console.log(`Source: ${SOURCE_COLLECTION}`);
        console.log(`Target: ${TARGET_COLLECTION}`);
        console.log('█'.repeat(80) + '\n');

        if (isDryRun) {
            console.log('⚠️  DRY RUN MODE - No changes will be made to Firestore\n');
        }

        // Get initial counts
        console.log('Getting collection counts...');
        const sourceCountBefore = await getCollectionCount(SOURCE_COLLECTION);
        const targetCountBefore = await getCollectionCount(TARGET_COLLECTION);

        console.log(`\nBEFORE MIGRATION:`);
        console.log(`  ${SOURCE_COLLECTION}: ${sourceCountBefore} documents`);
        console.log(`  ${TARGET_COLLECTION}: ${targetCountBefore} documents`);

        if (sourceCountBefore === 0) {
            console.log(`\n⚠️  Source collection is empty. Exiting.`);
            process.exit(0);
        }

        if (targetCountBefore > 0 && !isDryRun) {
            console.log(`\n⚠️  WARNING: Target collection already has ${targetCountBefore} documents`);
            console.log(`This script will OVERWRITE any documents with matching IDs.`);
            console.log(`\nPress Ctrl+C to cancel, or wait 5 seconds to continue...`);
            await new Promise(resolve => setTimeout(resolve, 5000));
        }

        // Perform copy
        const startTime = Date.now();
        const result = await copyDocuments(SOURCE_COLLECTION, TARGET_COLLECTION, isDryRun);
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        // Get final counts
        const targetCountAfter = isDryRun ? targetCountBefore : await getCollectionCount(TARGET_COLLECTION);

        // Report results
        console.log('\n' + '='.repeat(80));
        console.log('MIGRATION RESULTS');
        console.log('='.repeat(80) + '\n');

        console.log(`Status: ${isDryRun ? 'DRY RUN COMPLETE ✓' : 'MIGRATION COMPLETE ✓'}`);
        console.log(`Duration: ${duration}s`);
        console.log(`\nDocuments processed: ${result.total}`);
        console.log(`Documents ${isDryRun ? 'would be copied' : 'copied'}: ${result.copied}`);

        console.log(`\nAFTER MIGRATION:`);
        console.log(`  ${SOURCE_COLLECTION}: ${sourceCountBefore} documents (unchanged)`);
        console.log(`  ${TARGET_COLLECTION}: ${targetCountAfter} documents`);

        if (result.docIds.length > 0) {
            console.log(`\nFirst 3 document IDs ${isDryRun ? 'to copy' : 'copied'}:`);
            result.docIds.slice(0, 3).forEach((id, index) => {
                console.log(`  ${index + 1}. ${id}`);
            });
        }

        if (!isDryRun) {
            console.log(`\n✓ Source collection '${SOURCE_COLLECTION}' was NOT deleted (kept for safety)`);
            console.log(`\nNEXT STEPS:`);
            console.log(`  1. Verify data in '${TARGET_COLLECTION}' collection`);
            console.log(`  2. Test your application`);
            console.log(`  3. Once confirmed working, manually delete '${SOURCE_COLLECTION}' if desired`);
        } else {
            console.log(`\n✓ No changes made (dry run)`);
            console.log(`\nTo perform actual migration, run:`);
            console.log(`  node scripts/migrate-orgs-collection.js`);
        }

        console.log('\n' + '█'.repeat(80) + '\n');

    } catch (error) {
        console.error('\n' + '█'.repeat(80));
        console.error('ERROR DURING MIGRATION');
        console.error('█'.repeat(80));
        console.error('\nError:', error.message);
        console.error('\nStack trace:', error.stack);
        process.exit(1);
    } finally {
        // Cleanup
        await admin.app().delete();
    }
}

// =============================================================================
// RUN MIGRATION
// =============================================================================

runMigration()
    .then(() => {
        console.log('Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Script failed:', error);
        process.exit(1);
    });
