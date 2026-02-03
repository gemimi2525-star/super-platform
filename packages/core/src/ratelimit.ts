/**
 * Simple Rate Limiter (In-Memory)
 * 
 * Uses Token Bucket algorithm with Map storage.
 * Suitable for single-instance or edge-like environments where local state is transient.
 * 
 * Note: In a distributed environment (e.g. Vercel Serverless), this will only limit
 * per-lambda instance. For strict global limits, use Redis/Upstash.
 * 
 * Configurable via Environment Variables:
 * - RATELIMIT_AUTH: max requests for auth routes
 * - RATELIMIT_WRITE: max requests for write operations
 * - RATELIMIT_READ: max requests for read operations
 */

interface RateLimitConfig {
    limit: number;
    windowMs: number;
}

interface TokenBucket {
    tokens: number;
    lastRefill: number;
}

// Global storage for rate limits
const storage = new Map<string, TokenBucket>();

// Cleanup interval (every 5 minutes)
// We use a loose interval to prevent memory leaks in long-running processes
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        const now = Date.now();
        for (const [key, bucket] of storage.entries()) {
            // Remove if older than 1 hour
            if (now - bucket.lastRefill > 3600000) {
                storage.delete(key);
            }
        }
    }, 300000).unref?.(); // unref if node environment
}

export type RateLimitType = 'auth' | 'write' | 'read' | 'page_nav' | 'non_browser';

const CONFIG: Record<RateLimitType, RateLimitConfig> = {
    auth: {
        limit: Number(process.env.RATELIMIT_AUTH) || 10,
        windowMs: 60 * 1000, // 1 minute
    },
    write: {
        limit: Number(process.env.RATELIMIT_WRITE) || 60,
        windowMs: 60 * 1000, // 1 minute
    },
    read: {
        limit: Number(process.env.RATELIMIT_READ) || 300,
        windowMs: 60 * 1000, // 1 minute
    },
    // Phase 6.3.9: Page navigation for real browsers (very generous)
    page_nav: {
        limit: Number(process.env.RATELIMIT_PAGE_NAV) || 600,
        windowMs: 60 * 1000, // 10 req/sec average
    },
    // Phase 6.3.9: Non-browser requests (bots, curl, etc.) - tighter
    non_browser: {
        limit: Number(process.env.RATELIMIT_NON_BROWSER) || 60,
        windowMs: 60 * 1000, // 1 req/sec average
    },
};

export interface RateLimitResult {
    success: boolean;
    limit: number;
    remaining: number;
    retryAfter: number; // Seconds
}

/**
 * Check Rate Limit
 * @param identifier Unique user ID or IP
 * @param type Rate limit category
 */
export function checkRateLimit(identifier: string, type: RateLimitType): RateLimitResult {
    const config = CONFIG[type];
    const key = `${type}:${identifier}`;
    const now = Date.now();

    let bucket = storage.get(key);

    if (!bucket) {
        bucket = {
            tokens: config.limit,
            lastRefill: now,
        };
        storage.set(key, bucket);
    }

    // Refill tokens based on time passed
    const timePassed = now - bucket.lastRefill;
    const refillRate = config.limit / config.windowMs;
    const tokensToAdd = timePassed * refillRate;

    if (tokensToAdd > 0) {
        bucket.tokens = Math.min(config.limit, bucket.tokens + tokensToAdd);
        bucket.lastRefill = now;
    }

    // Consumption
    const cost = 1;
    let success = false;
    let remaining = Math.floor(bucket.tokens);

    if (bucket.tokens >= cost) {
        bucket.tokens -= cost;
        remaining = Math.floor(bucket.tokens);
        success = true;
    } else {
        success = false;
        remaining = 0;
    }

    // Save back
    storage.set(key, bucket);

    // Calculate retry after
    const tokensNeeded = cost - bucket.tokens;
    const timeToRefill = tokensNeeded > 0 ? tokensNeeded / refillRate : 0;
    const retryAfter = Math.ceil(timeToRefill / 1000); // Seconds

    return {
        success,
        limit: config.limit,
        remaining,
        retryAfter: success ? 0 : retryAfter,
    };
}
