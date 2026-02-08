/**
 * Verification Script for Phase 23A: Offline UX Indicators
 * 
 * Usage:
 * 1. Open browser console
 * 2. Run `verifyOfflineUX()`
 */

import { workerBridge } from './coreos/workers/bridge';

export async function verifyOfflineUX() {
    console.log('🚀 Starting Offline UX Verification...');

    // 1. Subscribe to State
    const unsubscribe = workerBridge.subscribe((state) => {
        console.log('🔄 State Update:', state);
    });

    console.log('1️⃣ Initial State (Should be ONLINE/IDLE)');

    // 2. Simulate Offline
    console.log('2️⃣ Simulating OFFLINE event...');
    // We can't easily trigger window.offline programmatically in a trusted way,
    // but we can call the private method if we exposed it, or just mock the network.
    // For this test, we rely on the fact that the Bridge listens to window events.
    // We will manually trigger the event.
    window.dispatchEvent(new Event('offline'));

    await new Promise(r => setTimeout(r, 500));

    // 3. Enqueue Job while Offline (Should be PENDING_RETRY)
    console.log('3️⃣ Enqueue Job while Offline (Expect PENDING_RETRY)...');
    workerBridge.enqueueJob({
        id: `offline-job-${Date.now()}`,
        type: 'SYNC_FILE',
        payload: { path: 'test' },
        priority: 'NORMAL',
        createdAt: Date.now(),
        createdBy: 'tester',
        traceId: 'trace-off',
        status: 'PENDING',
        retryCount: 0
    });

    await new Promise(r => setTimeout(r, 500));

    // 4. Simulate Online (Should auto-resume -> SYNCING -> IDLE)
    console.log('4️⃣ Simulating ONLINE event (Expect SYNCING -> IDLE)...');
    window.dispatchEvent(new Event('online'));

    // Wait for worker to process (simulated latency is ~500ms in engine)
    await new Promise(r => setTimeout(r, 2000));

    console.log('✅ Verification Complete. Check logs for state transitions.');
    unsubscribe();
}
