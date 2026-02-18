'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * useOfflineData — Phase 36.3
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * React hook for offline-aware data fetching.
 * Online: fetch → cache → return
 * Offline: return cached → show stale indicator
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getFromOfflineStore, putToOfflineStore, OFFLINE_TTL } from './offlineStore';

interface UseOfflineDataOptions {
    /** Cache key for offline store */
    cacheKey: string;
    /** TTL in ms (default: 5 min) */
    ttlMs?: number;
    /** Auto-refresh interval in ms (0 = disabled) */
    refreshInterval?: number;
    /** Skip fetching (e.g. when component is not visible) */
    skip?: boolean;
}

interface UseOfflineDataResult<T> {
    data: T | null;
    isLoading: boolean;
    isStale: boolean;
    isOffline: boolean;
    lastUpdated: number | null;
    error: string | null;
    refresh: () => void;
}

export function useOfflineData<T>(
    apiUrl: string,
    options: UseOfflineDataOptions,
): UseOfflineDataResult<T> {
    const {
        cacheKey,
        ttlMs = OFFLINE_TTL.SHORT,
        refreshInterval = 0,
        skip = false,
    } = options;

    const [data, setData] = useState<T | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isStale, setIsStale] = useState(false);
    const [isOffline, setIsOffline] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const mounted = useRef(true);

    const fetchData = useCallback(async () => {
        if (skip) return;

        // Try cache first (instant)
        const cached = getFromOfflineStore<T>(cacheKey);
        if (cached) {
            setData(cached.data);
            setLastUpdated(cached.cachedAt);
            setIsStale(cached.isStale);
            setIsLoading(false);
        }

        // Try network
        try {
            const res = await fetch(apiUrl);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const freshData = await res.json();
            if (!mounted.current) return;

            setData(freshData);
            setIsStale(false);
            setIsOffline(false);
            setLastUpdated(Date.now());
            setError(null);
            setIsLoading(false);

            // Cache for offline use
            putToOfflineStore(cacheKey, freshData, ttlMs);
        } catch {
            if (!mounted.current) return;

            // Network failed — use cached data if available
            if (cached) {
                setIsOffline(true);
                setIsStale(true);
                setError(null); // We have cached data, not a real error
            } else {
                setIsOffline(true);
                setError('No cached data available');
            }
            setIsLoading(false);
        }
    }, [apiUrl, cacheKey, ttlMs, skip]);

    useEffect(() => {
        mounted.current = true;
        fetchData();

        // Online/offline event listeners
        const handleOnline = () => { fetchData(); };
        const handleOffline = () => { setIsOffline(true); };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Refresh interval
        let intervalId: ReturnType<typeof setInterval> | null = null;
        if (refreshInterval > 0) {
            intervalId = setInterval(fetchData, refreshInterval);
        }

        return () => {
            mounted.current = false;
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            if (intervalId) clearInterval(intervalId);
        };
    }, [fetchData, refreshInterval]);

    return { data, isLoading, isStale, isOffline, lastUpdated, error, refresh: fetchData };
}
