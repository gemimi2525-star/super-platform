import payload from 'payload'
import config from '@/payload.config'

let cached = global.payload

if (!cached) {
    cached = global.payload = { client: null, promise: null }
}

/**
 * Get Payload instance (singleton pattern)
 * 
 * IMPORTANT: This is server-side only!
 * Never import this in client components.
 */
export const getPayload = async () => {
    if (cached.client) {
        return cached.client
    }

    if (!cached.promise) {
        cached.promise = payload.init({
            config,
        })
    }

    try {
        cached.client = await cached.promise
    } catch (e) {
        cached.promise = null
        throw e
    }

    return cached.client
}
