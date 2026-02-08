/**
 * Verification Script for Phase 19: Permission UX
 * 
 * Usage:
 * 1. Open browser console
 * 2. Paste this wrapper or import it
 * 3. Run `verifyPermissionFlow()`
 */

import { dispatchFsIntent } from './lib/filesystem/dispatchFsIntent';

export async function verifyPermissionFlow() {
    console.log('🚀 Starting Permission Flow Verifiction...');

    try {
        const result = await dispatchFsIntent({
            action: 'os.fs.write',
            meta: { path: 'user://docs/test-permission.txt', scheme: 'user' },
            content: 'This is a test file to verify permissions.',
            options: { create: true }
        });

        console.log('✅ Result:', result);

        if (result.success) {
            console.log('🎉 Permission GRANTED and operation succeeded.');
        } else if (result.errorCode === 'PERMISSION_DENIED') {
            console.log('🛑 Permission DENIED by user.');
        } else {
            console.log('⚠️ Unexpected result:', result);
        }
    } catch (e) {
        console.error('❌ Error during verification:', e);
    }
}
