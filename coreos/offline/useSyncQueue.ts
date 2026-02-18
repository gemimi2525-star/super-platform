'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * useSyncQueue — Phase 36.4
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * React hook wrapping the SyncQueue singleton.
 * Auto-triggers processQueue() when connectivity is restored.
 */

import { useState, useEffect, useCallback } from 'react';
import { getSyncQueue, type QueueStatus, type SyncQueueItem } from './syncQueue';

interface UseSyncQueueResult {
    enqueue: (url: string, method: 'POST' | 'PUT' | 'PATCH', body: unknown) => string;
    queueStatus: QueueStatus;
    items: SyncQueueItem[];
    isProcessing: boolean;
    processNow: () => Promise<void>;
}

export function useSyncQueue(): UseSyncQueueResult {
    const [queueStatus, setQueueStatus] = useState<QueueStatus>({
        pending: 0, processing: 0, completed: 0, failed: 0, total: 0,
    });
    const [items, setItems] = useState<SyncQueueItem[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        const queue = getSyncQueue();

        // Initial state
        setQueueStatus(queue.getStatus());
        setItems(queue.getItems());

        // Subscribe to changes
        const unsub = queue.subscribe((status) => {
            setQueueStatus(status);
            setItems(queue.getItems());
        });

        // Auto-process when back online
        const handleOnline = async () => {
            const status = queue.getStatus();
            if (status.pending > 0) {
                console.log(`[SyncQueue] Back online — replaying ${status.pending} queued actions...`);
                setIsProcessing(true);
                const result = await queue.processQueue();
                setIsProcessing(false);
                console.log(`[SyncQueue] Replay complete: ${result.processed} synced, ${result.failed} failed`);
            }
        };

        window.addEventListener('online', handleOnline);

        return () => {
            unsub();
            window.removeEventListener('online', handleOnline);
        };
    }, []);

    const enqueue = useCallback((url: string, method: 'POST' | 'PUT' | 'PATCH', body: unknown) => {
        return getSyncQueue().enqueue(url, method, body);
    }, []);

    const processNow = useCallback(async () => {
        setIsProcessing(true);
        await getSyncQueue().processQueue();
        setIsProcessing(false);
    }, []);

    return { enqueue, queueStatus, items, isProcessing, processNow };
}
