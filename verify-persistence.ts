/**
 * Verification Script for Phase 20: Persistence & Revocation
 * 
 * Usage:
 * 1. Open browser console
 * 2. Run `verifyPersistence()`
 */

import { dispatchFsIntent } from './lib/filesystem/dispatchFsIntent';
import { getKernel } from './coreos';
import { createCorrelationId } from './coreos/types';

export async function verifyPersistence() {
    console.log('🚀 Starting Persistence Verification...');

    // 1. First Request (Should Prompt)
    console.log('1️⃣ Requesting Write (Expect Prompt)...');
    try {
        const r1 = await dispatchFsIntent({
            action: 'os.fs.write',
            meta: { path: 'user://docs/persist-test.txt', scheme: 'user' },
            content: 'Test 1',
            options: { create: true }
        });
        console.log('   Result 1:', r1.decision?.outcome);
    } catch (e) {
        console.error(e);
    }

    // 2. Second Request (If Allowed Persistently, Should Auto-Grant)
    console.log('2️⃣ Requesting-Write AGAIN (Expect Auto-Grant if Persistent)...');
    try {
        const r2 = await dispatchFsIntent({
            action: 'os.fs.write',
            meta: { path: 'user://docs/persist-test.txt', scheme: 'user' },
            content: 'Test 2',
            options: { overwrite: true }
        });
        console.log('   Result 2:', r2.decision?.outcome, r2.decision?.reason);
    } catch (e) {
        console.error(e);
    }

    // 3. Revoke
    console.log('3️⃣ Revoking Permission...');
    getKernel().emit({
        type: 'REVOKE_PERMISSION',
        correlationId: createCorrelationId(),
        payload: {
            appName: 'Application',
            capabilityId: 'fs.write' as any
        }
    });

    // 4. Third Request (Should Prompt Again)
    console.log('4️⃣ Requesting Write AFTER Revoke (Expect Prompt)...');
    setTimeout(async () => {
        try {
            const r3 = await dispatchFsIntent({
                action: 'os.fs.write',
                meta: { path: 'user://docs/persist-test.txt', scheme: 'user' },
                content: 'Test 3',
                options: { overwrite: true }
            });
            console.log('   Result 3:', r3.decision?.outcome);
        } catch (e) {
            console.error(e);
        }
    }, 1000);
}
