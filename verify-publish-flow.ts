/**
 * Verification Script for Phase 24C: Publish Flow
 * 
 * Simulates:
 * 1. Dev validates manifest
 * 2. Dev packs artifact
 * 3. Dev signs artifact
 * 4. Dev publishes to 'dev' channel
 * 5. Verify catalog has new app
 */

import { validateApp } from './coreos/cli/validate';
import { packApp } from './coreos/cli/pack';
import { signApp } from './coreos/cli/sign';
import { publishApp } from './coreos/cli/publish';
import { storeCatalog } from './coreos/store/catalog';

export async function verifyPublishFlow() {
    console.log('🚀 Starting Publish Flow Verification...');

    const mockManifest = JSON.stringify({
        appId: 'com.indie.newapp',
        name: 'My New App',
        publisher: 'Indie Dev',
        version: '1.0.0',
        entry: 'main.js',
        window: { defaultRole: 'APP' },
        capabilitiesRequested: [], // Safe
        storageScopes: [],
        updateChannel: 'dev'
    });

    try {
        // 1. Validate
        await validateApp([mockManifest]);

        // 2. Pack
        const artifactJson = await packApp([mockManifest]);

        // 3. Sign (Optional for Dev, but good to test)
        // Let's try publishing unsigned first to dev (should pass)
        console.log('\n--- Attempting Unsigned Publish to Dev ---');
        await publishApp([artifactJson, 'dev']);

        // Verify Catalog
        let item = await storeCatalog.getAppDetails('com.indie.newapp');
        if (item && item.versions.dev) {
            console.log('✅ App appeared in Dev Channel (Unsigned)');
        } else {
            console.error('❌ App failed to appear in Dev Channel');
        }

        // 4. Enterprise Flow
        console.log('\n--- Attempting Enterprise Publish ---');
        // Sign with Ent key
        const signedArtifactJson = await signApp([artifactJson, 'enterprise-key']);

        // Publish to Ent
        await publishApp([signedArtifactJson, 'enterprise']);

        item = await storeCatalog.getAppDetails('com.indie.newapp');
        if (item && item.versions.enterprise) {
            console.log('✅ App appeared in Enterprise Channel (Signed)');
        } else {
            console.error('❌ App failed to appear in Enterprise Channel');
        }

        // 5. Reject Flow (Malware)
        console.log('\n--- Attempting Malware Publish ---');
        const malwareManifest = JSON.stringify({
            appId: 'com.bad.app',
            name: 'Bad App',
            version: '6.6.6',
            capabilitiesRequested: ['system.configure'] // Restricted
        });
        const malwareArtifact = await packApp([malwareManifest]);

        try {
            await publishApp([malwareArtifact, 'dev']);
            console.error('❌ Malware should have been rejected!');
        } catch (e) {
            console.log('✅ Malware Rejected (Expected)');
        }

    } catch (e) {
        console.error('❌ Unexpected Error:', e);
    }
}

// Execute
verifyPublishFlow().catch(console.error);
