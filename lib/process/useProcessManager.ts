/**
 * Phase 15B.3: useProcessManager Hook
 * 
 * React hook for reactive process state management.
 * Combines client-side ProcessManager with server registry.
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { ProcessDescriptor } from './types';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

interface UseProcessManagerOptions {
    autoRefresh?: boolean;
    refreshInterval?: number;
}

interface UseProcessManagerResult {
    processes: ProcessDescriptor[];
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
    spawnWorker: (appId: string, entryPoint: string) => Promise<string | null>;
    terminateWorker: (pid: string) => void;
    forceQuitWorker: (pid: string) => void;
    getWorkerCount: () => number;
}

// ═══════════════════════════════════════════════════════════════════════════
// ProcessManager Wrapper (Client-side only)
// ═══════════════════════════════════════════════════════════════════════════

let processManagerInstance: any = null;

function getProcessManager(): any {
    if (typeof window === 'undefined') return null;
    if (!processManagerInstance) {
        // Dynamic import to avoid SSR issues
        const { ProcessManager } = require('./ProcessManager');
        processManagerInstance = ProcessManager.getInstance();
    }
    return processManagerInstance;
}

// ═══════════════════════════════════════════════════════════════════════════
// Hook
// ═══════════════════════════════════════════════════════════════════════════

export function useProcessManager(options: UseProcessManagerOptions = {}): UseProcessManagerResult {
    const { autoRefresh = true, refreshInterval = 5000 } = options;

    const [processes, setProcesses] = useState<ProcessDescriptor[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const unsubscribeRef = useRef<(() => void) | null>(null);

    // Fetch from server registry
    const fetchFromServer = useCallback(async (): Promise<ProcessDescriptor[]> => {
        try {
            const res = await fetch('/api/platform/process-registry');
            const data = await res.json();
            if (data.success) {
                return data.processes || [];
            }
            return [];
        } catch {
            return [];
        }
    }, []);

    // Get local worker processes
    const getLocalProcesses = useCallback((): ProcessDescriptor[] => {
        const pm = getProcessManager();
        if (!pm) return [];
        return pm.list();
    }, []);

    // Merge server and local processes
    const mergeProcesses = useCallback((serverProcs: ProcessDescriptor[], localProcs: ProcessDescriptor[]): ProcessDescriptor[] => {
        const merged = new Map<string, ProcessDescriptor>();

        // Server processes first
        for (const proc of serverProcs) {
            merged.set(proc.pid, proc);
        }

        // Local processes override (they have real-time state)
        for (const proc of localProcs) {
            const existing = merged.get(proc.pid);
            if (existing) {
                // Merge with local state taking priority
                merged.set(proc.pid, { ...existing, ...proc });
            } else {
                merged.set(proc.pid, proc);
            }
        }

        return Array.from(merged.values());
    }, []);

    // Refresh all process data
    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const serverProcs = await fetchFromServer();
            const localProcs = getLocalProcesses();
            const merged = mergeProcesses(serverProcs, localProcs);
            setProcesses(merged);
            setError(null);
        } catch (e: any) {
            setError(e.message || 'Failed to fetch processes');
        } finally {
            setLoading(false);
        }
    }, [fetchFromServer, getLocalProcesses, mergeProcesses]);

    // Spawn a real Web Worker
    const spawnWorker = useCallback(async (appId: string, entryPoint: string): Promise<string | null> => {
        const pm = getProcessManager();
        if (!pm) {
            setError('ProcessManager not available');
            return null;
        }

        try {
            const descriptor = pm.spawn({ appId, entryPoint });
            await refresh();
            return descriptor.pid;
        } catch (e: any) {
            setError(e.message || 'Failed to spawn worker');
            return null;
        }
    }, [refresh]);

    // Terminate worker gracefully
    const terminateWorker = useCallback((pid: string) => {
        const pm = getProcessManager();
        if (!pm) return;

        try {
            pm.terminate(pid);
            refresh();
        } catch (e: any) {
            setError(e.message);
        }
    }, [refresh]);

    // Force quit worker
    const forceQuitWorker = useCallback((pid: string) => {
        const pm = getProcessManager();
        if (!pm) return;

        try {
            pm.forceQuit(pid);
            refresh();
        } catch (e: any) {
            setError(e.message);
        }
    }, [refresh]);

    // Get worker count
    const getWorkerCount = useCallback((): number => {
        const pm = getProcessManager();
        if (!pm) return 0;
        return pm.getCount();
    }, []);

    // Subscribe to ProcessManager updates
    useEffect(() => {
        const pm = getProcessManager();
        if (pm) {
            unsubscribeRef.current = pm.subscribe((updatedProcesses: ProcessDescriptor[]) => {
                setProcesses(prev => mergeProcesses(prev, updatedProcesses));
            });
        }

        return () => {
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
            }
        };
    }, [mergeProcesses]);

    // Initial fetch
    useEffect(() => {
        refresh();
    }, [refresh]);

    // Auto-refresh
    useEffect(() => {
        if (!autoRefresh) return;

        const interval = setInterval(refresh, refreshInterval);
        return () => clearInterval(interval);
    }, [autoRefresh, refreshInterval, refresh]);

    return {
        processes,
        loading,
        error,
        refresh,
        spawnWorker,
        terminateWorker,
        forceQuitWorker,
        getWorkerCount,
    };
}

export default useProcessManager;
