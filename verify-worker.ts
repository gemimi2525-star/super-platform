/**
 * Verification Script for Phase 22: Background Workers & Sync
 * 
 * Usage:
 * 1. Open browser console
 * 2. Run `verifyWorker()`
 */

import { dispatchFsIntent } from './lib/filesystem/dispatchFsIntent';
import { jobQueue } from './coreos/workers/sync/queue';
import { workerBridge } from './coreos/workers/bridge';

export async function verifyWorker() {
    console.log('🚀 Starting Worker Sync Verification...');

    // 0. Ensure Worker is Running
    workerBridge.init();
    await new Promise(r => setTimeout(r, 1000)); // Wait for init

    // 1. Initial State
    const initialJobs = await jobQueue.getAll();
    console.log(`1️⃣ Initial Job Queue Size: ${initialJobs.length}`);

    // 2. Perform Write (Should Trigger Auto-Sync)
    console.log('2️⃣ Writing to app://sync-test.txt (Expect Auto-Sync)...');
    try {
        await dispatchFsIntent({
            action: 'os.fs.write',
            meta: { path: 'app://sync-test.txt', scheme: 'app' },
            content: 'Offline First Data',
            options: { create: true }
        });
        console.log('   ✅ Write Success');
    } catch (e) {
        console.error('   ❌ Write Failed:', e);
    }

    // 3. Check Queue (Should have SYNC_FILE job)
    setTimeout(async () => {
        const jobs = await jobQueue.getAll();
        console.log(`3️⃣ Current Job Queue Size: ${jobs.length}`);

        const syncJob = jobs.find(j => j.type === 'SYNC_FILE' && j.status === 'COMPLETED');
        if (syncJob) {
            console.log('   ✅ Found COMPLETED Sync Job:', syncJob.id);
        } else {
            const pendingJob = jobs.find(j => j.type === 'SYNC_FILE');
            if (pendingJob) {
                console.log('   ⚠️ Found PENDING/RUNNING Sync Job:', pendingJob.id, pendingJob.status);
            } else {
                console.error('   ❌ Sync Job NOT Found!');
            }
        }

        // 4. Manual Heavy Task
        console.log('4️⃣ Dispatching Heavy Compute Job...');
        workerBridge.enqueueJob({
            id: `compute-${Date.now()}`,
            type: 'COMPUTE_HASH',
            payload: { data: 'heavy-data' },
            priority: 'NORMAL',
            createdAt: Date.now(),
            createdBy: 'tester',
            traceId: 'trace-manual',
            status: 'PENDING',
            retryCount: 0
        });

    }, 2000);
}
