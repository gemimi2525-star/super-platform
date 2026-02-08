/**
 * ═══════════════════════════════════════════════════════════════════════════
 * WORKER HOST
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Entry point for the Shared/Dedicated Worker.
 * Handles messages from Main thread and initializes Sync Engine.
 * 
 * @module coreos/workers/host
 */

/// <reference lib="webworker" />

import { syncEngine } from './sync/engine';
import { jobQueue } from './sync/queue';
import type { WorkerMessage, Job } from './types';

declare const self: DedicatedWorkerGlobalScope;

console.log('[WorkerHost] Initialized');

// Initialize Queue & Engine
(async () => {
    try {
        await jobQueue.init();
        await syncEngine.start();
        postMessage({ type: 'WORKER_READY', payload: {} });
    } catch (e) {
        console.error('[WorkerHost] Init Failed:', e);
        postMessage({ type: 'WORKER_ERROR', payload: e });
    }
})();

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
    const { type, payload, correlationId } = event.data;
    console.log(`[WorkerHost] Received: ${type}`, payload);

    switch (type) {
        case 'ENQUEUE_JOB':
            try {
                const job = payload as Job;
                await jobQueue.enqueue(job);
                // Trigger engine immediately if idle
                // syncEngine.notify(); // Optimization
            } catch (e) {
                console.error('[WorkerHost] Enqueue Failed:', e);
            }
            break;

        case 'PAUSE_WORKER':
            await syncEngine.stop();
            break;

        case 'RESUME_WORKER':
            await syncEngine.start();
            break;
    }
};
