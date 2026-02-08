/**
 * Verification Script for Phase 25B: System Update & OTA
 * 
 * Simulates:
 * 1. Check for Updates (Stable -> Up to date)
 * 2. Switch Channel (Beta) -> Update Available
 * 3. Download & Verify
 * 4. Apply Update (Success)
 * 5. Rollback Simulation (Failure Case)
 */

import { updateService } from './coreos/system/update/service';
import { systemUpdater } from './coreos/system/update/installer';

export async function verifyOTA() {
    console.log('🔄 Starting OTA Verification...\n');

    // Subscribe to state changes
    updateService.subscribe(state => {
        // console.log(`[UI Update] Status: ${state.status} | Progress: ${state.progress}% | Version: ${state.currentVersion}`);
    });

    try {
        // 1. Initial Check (Stable)
        console.log('--- 1. Check Stable (Expect: Up to date) ---');
        await updateService.checkForUpdates();

        // 2. Switch to Beta
        console.log('\n--- 2. Switch to Beta (Expect: Update Available) ---');
        updateService.setChannel('beta');
        // Wait for auto-check
        await new Promise(r => setTimeout(r, 1500));

        // 3. Download
        console.log('\n--- 3. Download Update ---');
        await updateService.downloadUpdate();

        // 4. Apply (Install)
        console.log('\n--- 4. Apply Update (Install) ---');
        const manifest = await updateService.applyUpdate();
        if (manifest) {
            const success = await systemUpdater.install(manifest);
            if (success) {
                console.log('✅ Installation Successful!');
            } else {
                console.error('❌ Installation Failed');
            }
        }

        // 5. Rollback Simulation
        console.log('\n--- 5. Rollback Simulation (Bad Update) ---');
        // Inject bad update
        updateService['_injectMockUpdate']('dev', {
            releaseId: 'bad-update',
            version: '3.0.0-BAD',
            channel: 'dev',
            releaseDate: Date.now(),
            notes: 'Do not install',
            critical: true,
            components: [{ id: 'core.os', version: '3.0.0', url: '', checksum: '', required: true }],
            checksum: 'bad'
        });

        updateService.setChannel('dev');
        await new Promise(r => setTimeout(r, 1500));
        await updateService.downloadUpdate();
        const badManifest = await updateService.applyUpdate();

        if (badManifest) {
            const result = await systemUpdater.install(badManifest);
            if (!result) {
                console.log('✅ Rollback Triggered Successfully (Expected Failure)');
            } else {
                console.error('❌ Should have failed!');
            }
        }

    } catch (e) {
        console.error('❌ Unexpected Error:', e);
    }
}

// Execute
verifyOTA().catch(console.error);
