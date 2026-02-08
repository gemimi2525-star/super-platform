/**
 * Verification Script for Phase 23B: Conflict Resolution UI
 * 
 * Usage:
 * 1. Open browser console
 * 2. Run `verifyConflictUI()`
 */

import { workerBridge } from './coreos/workers/bridge';

export async function verifyConflictUI() {
    console.log('🚀 Starting Conflict UX Verification...');

    // 1. Subscribe to State
    const unsubscribe = workerBridge.subscribe((state) => {
        console.log('🔄 State Update:', state);
        if (state.activeConflict) {
            console.log('⚠️ CONFLICT DETECTED IN STATE!');
        } else {
            console.log('✅ No Active Conflict');
        }
    });

    // 2. Simulate Conflict Event (from Worker)
    console.log('2️⃣ Simulating CONFLICT event...');

    // NOTE: In a real scenario, this comes from the worker. 
    // Since we are checking the UI, we can mock the state handling in the bridge
    // OR send a fake message if the worker handles it. 
    // Here we will use the bridge internals to force the state for testing UI rendering.

    // Hack: Accessing private state via a simulated message dispatch if possible, 
    // or just assume the worker is running and we can postMessage to a real worker that reflects it back.
    // For now, simpler test: logic check.

    // Simulating message reception logic (Internal Mock)
    const fakeConflict = {
        id: 'conflict-123',
        fileUri: 'app://docs/report.md',
        localPayload: { updatedAt: Date.now(), size: 1024 },
        remotePayload: { updatedAt: Date.now() - 5000, size: 2048 },
        reason: 'CONCURRENT_EDIT'
    };

    // We manually trigger the listener to skip the actual worker roundtrip for this UI test
    // @ts-ignore
    workerBridge.state = { ...workerBridge.state, activeConflict: fakeConflict };
    // @ts-ignore
    workerBridge.notifyListeners();

    console.log('✅ Fake Conflict Injected. UI should show Modal.');

    // 3. User Resolution
    // The user clicks "Keep Local" -> calls resolveConflict('conflict-123', 'KEEP_LOCAL')
    // This clears the state.

    await new Promise(r => setTimeout(r, 5000));
    console.log('ℹ️ Resolving conflict (Simulated User Action)...');

    workerBridge.resolveConflict('conflict-123', 'KEEP_LOCAL');

    console.log('✅ Conflict Resolved. UI should close.');
    unsubscribe();
}
