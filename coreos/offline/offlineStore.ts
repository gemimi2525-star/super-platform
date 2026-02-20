/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Offline Store — Phase 36.3
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * localStorage-based read cache for offline data access.
 * Safe, non-sensitive data only. TTL-based expiration.
 * 
 * SECURITY: Never cache auth tokens, sessions, or PII.
 */

const STORE_PREFIX = 'coreos:offline:';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface CachedEntry<T> {
    data: T;
    cachedAt: number;
    ttlMs: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// CORE API
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Store data in offline cache with TTL
 */
export function putToOfflineStore<T>(key: string, data: T, ttlMs: number): void {
    if (typeof window === 'undefined') return;

    try {
        const entry: CachedEntry<T> = {
            data,
            cachedAt: Date.now(),
            ttlMs,
        };
        localStorage.setItem(STORE_PREFIX + key, JSON.stringify(entry));
    } catch (err) {
        // localStorage full or disabled — fail silently
        console.warn('[OfflineStore] Failed to cache:', key, err);
    }
}

/**
 * Get data from offline cache (returns null if expired or missing)
 */
export function getFromOfflineStore<T>(key: string): {
    data: T;
    cachedAt: number;
    isStale: boolean;
} | null {
    if (typeof window === 'undefined') return null;

    try {
        const raw = localStorage.getItem(STORE_PREFIX + key);
        if (!raw) return null;

        const entry: CachedEntry<T> = JSON.parse(raw);
        const age = Date.now() - entry.cachedAt;
        const isStale = age > entry.ttlMs;

        // Return data even if stale (let caller decide)
        return {
            data: entry.data,
            cachedAt: entry.cachedAt,
            isStale,
        };
    } catch {
        return null;
    }
}

/**
 * Remove a specific key from offline cache
 */
export function removeFromOfflineStore(key: string): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.removeItem(STORE_PREFIX + key);
    } catch {
        // Ignored
    }
}

/**
 * Clear all offline cache entries
 */
export function clearOfflineStore(): void {
    if (typeof window === 'undefined') return;
    try {
        const keys = Object.keys(localStorage).filter(k => k.startsWith(STORE_PREFIX));
        keys.forEach(k => localStorage.removeItem(k));
    } catch {
        // Ignored
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// WELL-KNOWN KEYS + TTLs
// ═══════════════════════════════════════════════════════════════════════════

export const OFFLINE_KEYS = {
    HEALTH: 'health',
    BUILD_INFO: 'buildInfo',
    INTEGRITY: 'integrity',
    METRICS: 'metrics',
    GOVERNANCE: 'governance',
    JOBS_LIST: 'jobsList',
} as const;

export const OFFLINE_TTL = {
    SHORT: 5 * 60 * 1000,       // 5 minutes (health, metrics)
    MEDIUM: 30 * 60 * 1000,     // 30 minutes (integrity)
    LONG: 60 * 60 * 1000,       // 1 hour (build info, governance)
} as const;
