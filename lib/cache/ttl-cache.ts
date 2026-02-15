/**
 * TTL Cache with Stale-While-Revalidate — Phase 27C.8 + 27C.8b
 *
 * In-memory cache using globalThis to survive across warm lambda invocations.
 * Designed for Vercel/Next.js serverless: one cache per lambda instance.
 *
 * Features:
 * - TTL-based freshness (default 30s)
 * - Stale window (default 5min) — serves stale data if source is unavailable
 * - Stampede protection — single in-flight promise per key
 * - Manual invalidation for mutations
 * - Persistent snapshot fallback (Phase 27C.8b) — /tmp + bundled seed
 */

import * as fs from 'fs';
import * as path from 'path';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CacheEntry<T = unknown> {
    value: T;
    createdAt: number;   // epoch ms
    ttlMs: number;
    staleWindowMs: number;
}

type CacheStore = Map<string, CacheEntry>;
type InFlightMap = Map<string, Promise<unknown>>;

// ─── Global Store (survives across requests in warm lambda) ───────────────────

const GLOBAL_KEY = '__APICOREDATA_TTL_CACHE__';
const INFLIGHT_KEY = '__APICOREDATA_CACHE_INFLIGHT__';

function getStore(): CacheStore {
    if (!(globalThis as any)[GLOBAL_KEY]) {
        (globalThis as any)[GLOBAL_KEY] = new Map();
    }
    return (globalThis as any)[GLOBAL_KEY];
}

function getInFlight(): InFlightMap {
    if (!(globalThis as any)[INFLIGHT_KEY]) {
        (globalThis as any)[INFLIGHT_KEY] = new Map();
    }
    return (globalThis as any)[INFLIGHT_KEY];
}

// ─── Cache Status ─────────────────────────────────────────────────────────────

export type CacheStatus = 'HIT' | 'STALE' | 'MISS' | 'PERSISTENT_STALE';

export interface CacheResult<T> {
    value: T;
    status: CacheStatus;
}

// ─── Persistent Snapshot (Phase 27C.8b) ───────────────────────────────────────

const TMP_SNAPSHOT_DIR = '/tmp/apicoredata-snapshots';
const SEED_DIR = path.join(process.cwd(), 'data', 'snapshots');

/** Sanitise cache key to filesystem-safe name */
function keyToFilename(key: string): string {
    return key.replace(/[^a-zA-Z0-9_-]/g, '_') + '.json';
}

/**
 * Persist a snapshot to /tmp so it survives warm lambda reuse.
 * Non-blocking — errors are logged but swallowed.
 */
export function persistSnapshot<T>(key: string, data: T): void {
    try {
        if (!fs.existsSync(TMP_SNAPSHOT_DIR)) {
            fs.mkdirSync(TMP_SNAPSHOT_DIR, { recursive: true });
        }
        const filePath = path.join(TMP_SNAPSHOT_DIR, keyToFilename(key));
        fs.writeFileSync(filePath, JSON.stringify(data), 'utf-8');
        console.log(`[TTLCache] Persisted snapshot: ${key}`);
    } catch (err: any) {
        console.warn(`[TTLCache] Failed to persist snapshot ${key}:`, err?.message);
    }
}

/**
 * Load a snapshot — tries /tmp first (recent warm data), then bundled seed.
 * Returns null if nothing found anywhere.
 */
export function loadSnapshot<T>(key: string): T | null {
    const filename = keyToFilename(key);

    // 1. Try /tmp (most recent warm data)
    try {
        const tmpPath = path.join(TMP_SNAPSHOT_DIR, filename);
        if (fs.existsSync(tmpPath)) {
            const raw = fs.readFileSync(tmpPath, 'utf-8');
            const data = JSON.parse(raw) as T;
            // Only return if non-empty array
            if (Array.isArray(data) && data.length > 0) {
                console.log(`[TTLCache] Loaded snapshot from /tmp: ${key} (${(data as any[]).length} items)`);
                return data;
            }
        }
    } catch (err: any) {
        console.warn(`[TTLCache] Failed to read /tmp snapshot ${key}:`, err?.message);
    }

    // 2. Try bundled seed from deploy
    try {
        const seedPath = path.join(SEED_DIR, filename);
        if (fs.existsSync(seedPath)) {
            const raw = fs.readFileSync(seedPath, 'utf-8');
            const data = JSON.parse(raw) as T;
            if (Array.isArray(data) && data.length > 0) {
                console.log(`[TTLCache] Loaded snapshot from seed: ${key} (${(data as any[]).length} items)`);
                return data;
            }
        }
    } catch (err: any) {
        console.warn(`[TTLCache] Failed to read seed snapshot ${key}:`, err?.message);
    }

    return null;
}

// ─── Core API ─────────────────────────────────────────────────────────────────

const DEFAULT_TTL_MS = 30_000;          // 30 seconds fresh
const DEFAULT_STALE_WINDOW_MS = 300_000; // 5 minutes stale window

/**
 * Get a value from cache.
 * Returns null if not cached at all (or expired beyond stale window).
 */
export function cacheGet<T>(key: string): CacheResult<T> | null {
    const store = getStore();
    const entry = store.get(key);
    if (!entry) return null;

    const age = Date.now() - entry.createdAt;

    // Within TTL → HIT
    if (age <= entry.ttlMs) {
        return { value: entry.value as T, status: 'HIT' };
    }

    // Within stale window → STALE
    if (age <= entry.ttlMs + entry.staleWindowMs) {
        return { value: entry.value as T, status: 'STALE' };
    }

    // Expired beyond stale window → remove
    store.delete(key);
    return null;
}

/**
 * Set a value in cache.
 */
export function cacheSet<T>(
    key: string,
    value: T,
    ttlMs: number = DEFAULT_TTL_MS,
    staleWindowMs: number = DEFAULT_STALE_WINDOW_MS,
): void {
    const store = getStore();
    store.set(key, {
        value,
        createdAt: Date.now(),
        ttlMs,
        staleWindowMs,
    });
}

/**
 * Invalidate a cache key (e.g., after mutation).
 */
export function cacheInvalidate(key: string): void {
    const store = getStore();
    store.delete(key);
    // Also clear any in-flight promise
    const inFlight = getInFlight();
    inFlight.delete(key);
}

/**
 * Fetch with cache — main entry point.
 *
 * 1. If fresh cache exists → return HIT immediately
 * 2. If stale cache exists → start background refresh, return STALE immediately
 * 3. If no cache → fetch, cache result, return MISS
 * 4. If fetch fails, no stale → try persistent snapshot → PERSISTENT_STALE (27C.8b)
 *
 * Stampede protection: only one in-flight fetch per key.
 * If fetch fails and stale data exists → keep stale data, don't evict.
 */
export async function cachedFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    opts?: { ttlMs?: number; staleWindowMs?: number },
): Promise<CacheResult<T>> {
    const ttlMs = opts?.ttlMs ?? DEFAULT_TTL_MS;
    const staleWindowMs = opts?.staleWindowMs ?? DEFAULT_STALE_WINDOW_MS;

    // ── Check cache ───────────────────────────────────────────────────
    const cached = cacheGet<T>(key);

    if (cached) {
        if (cached.status === 'HIT') {
            return cached; // Fresh, no need to refetch
        }

        // STALE — trigger background revalidate but return stale immediately
        triggerBackgroundRevalidate(key, fetcher, ttlMs, staleWindowMs);
        return cached;
    }

    // ── MISS — must fetch synchronously ───────────────────────────────
    const inFlight = getInFlight();

    // Stampede protection: reuse in-flight promise if one exists
    if (inFlight.has(key)) {
        try {
            const value = (await inFlight.get(key)!) as T;
            return { value, status: 'MISS' };
        } catch {
            // If in-flight fails, try persistent snapshot (27C.8b)
            const snapshot = loadSnapshot<T>(key);
            if (snapshot) {
                // Promote to memory cache so next request is a HIT
                cacheSet(key, snapshot, ttlMs, staleWindowMs);
                return { value: snapshot, status: 'PERSISTENT_STALE' };
            }
            throw new Error(`[TTLCache] Fetch failed for key: ${key}`);
        }
    }

    // Start new fetch
    const fetchPromise = fetcher();
    inFlight.set(key, fetchPromise);

    try {
        const value = await fetchPromise;
        cacheSet(key, value, ttlMs, staleWindowMs);
        // Persist to /tmp for cold-start resilience (27C.8b)
        persistSnapshot(key, value);
        return { value, status: 'MISS' };
    } catch (fetchError) {
        // Fetch failed — try persistent snapshot before giving up (27C.8b)
        const snapshot = loadSnapshot<T>(key);
        if (snapshot) {
            cacheSet(key, snapshot, ttlMs, staleWindowMs);
            console.log(`[TTLCache] Serving PERSISTENT_STALE for ${key} after fetch failure`);
            return { value: snapshot, status: 'PERSISTENT_STALE' };
        }
        // No persistent data either — propagate error
        throw fetchError;
    } finally {
        inFlight.delete(key);
    }
}

// ─── Background Revalidation ──────────────────────────────────────────────────

function triggerBackgroundRevalidate<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlMs: number,
    staleWindowMs: number,
): void {
    const inFlight = getInFlight();

    // Don't start another revalidation if one is already in-flight
    if (inFlight.has(key)) return;

    const promise = fetcher()
        .then((value) => {
            cacheSet(key, value, ttlMs, staleWindowMs);
            persistSnapshot(key, value); // Also update persistent snapshot
            console.log(`[TTLCache] Background revalidate OK: ${key}`);
        })
        .catch((err) => {
            // On failure (e.g. quota 503), DON'T evict stale cache
            console.warn(`[TTLCache] Background revalidate FAILED for ${key}, keeping stale:`, err?.message || err);
        })
        .finally(() => {
            inFlight.delete(key);
        });

    inFlight.set(key, promise);
}
