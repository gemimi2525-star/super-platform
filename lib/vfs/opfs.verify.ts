/**
 * ═══════════════════════════════════════════════════════════════════════════
 * OPFS VERIFICATION SCRIPT (Phase 15A M2)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Run this in the browser console or via a test harness to verify OPFS.
 * 
 * @module lib/vfs/opfs.verify
 */

import { getDriver } from './driver';
import { VFSError } from './types';

export const verifyOPFS = async () => {
    console.group('🛡️ OPFS Verification');

    try {
        const driver = getDriver();
        console.log(`Driver Selected: ${driver.name}`);

        const available = await driver.isAvailable();
        console.log(`Available: ${available}`);

        if (!available) {
            console.warn('OPFS not available, skipping tests.');
            return;
        }

        // 1. List Root
        console.log('1. Listing Root...');
        const root = await driver.list('user://');
        console.table(root);

        // 2. Write File
        const testPath = 'user://test-vfs-m2.txt';
        const content = 'Hello Phase 15A Milestone 2!';
        console.log(`2. Writing to ${testPath}...`);
        await driver.write(testPath, content);
        console.log('Write success.');

        // 3. Read File
        console.log(`3. Reading from ${testPath}...`);
        const readBuffer = await driver.read(testPath);
        const readContent = new TextDecoder().decode(readBuffer);
        console.log(`Read Content: "${readContent}"`);

        if (readContent === content) {
            console.log('✅ READ/WRITE VERIFIED');
        } else {
            console.error('❌ READ MISMATCH');
        }

        // 4. Stat
        console.log('4. Stat File...');
        const stats = await driver.stat(testPath);
        console.table(stats);

    } catch (e) {
        console.error('❌ OPFS Verification Failed:', e);
        if (e instanceof VFSError) {
            console.error(`Code: ${e.code}`);
        }
    } finally {
        console.groupEnd();
    }
};

// Auto-run if in browser for manual testing
if (typeof window !== 'undefined') {
    (window as any).verifyOPFS = verifyOPFS;
}
