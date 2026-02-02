/**
 * Rate Limiting Utility
 * 
 * Simple in-memory rate limiter for support form
 * Production: Use Redis or similar
 */

const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export async function rateLimit(
    identifier: string,
    limit: number,
    windowSeconds: number
): Promise<{ success: boolean; remaining: number }> {
    const now = Date.now()
    const entry = rateLimitMap.get(identifier)

    // Clean up if window expired
    if (entry && now > entry.resetTime) {
        rateLimitMap.delete(identifier)
    }

    const current = rateLimitMap.get(identifier)

    if (!current) {
        // First request
        rateLimitMap.set(identifier, {
            count: 1,
            resetTime: now + windowSeconds * 1000,
        })
        return { success: true, remaining: limit - 1 }
    }

    if (current.count >= limit) {
        return { success: false, remaining: 0 }
    }

    // Increment count
    current.count++
    rateLimitMap.set(identifier, current)

    return { success: true, remaining: limit - current.count }
}
