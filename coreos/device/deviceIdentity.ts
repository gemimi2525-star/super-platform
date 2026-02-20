/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Device Identity — Phase 15D.A
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Persistent device identifier for cross-device handoff.
 * Each browser profile gets a unique, stable ID stored in localStorage.
 *
 * Format: dev_<uuidv4>
 *
 * @module coreos/device/deviceIdentity
 * @version 1.0.0
 */

const DEVICE_ID_KEY = 'coreos:deviceId';

/**
 * Get or create a persistent device identifier.
 * Returns the same ID across page reloads within the same browser profile.
 * Different browser profiles / devices get different IDs.
 */
export function getOrCreateDeviceId(): string {
    if (typeof window === 'undefined') return 'dev_server';

    try {
        const existing = localStorage.getItem(DEVICE_ID_KEY);
        if (existing && existing.startsWith('dev_')) return existing;

        const id = `dev_${generateUUID()}`;
        localStorage.setItem(DEVICE_ID_KEY, id);
        console.log(`[DeviceIdentity] Created deviceId: ${id}`);
        return id;
    } catch {
        // localStorage unavailable (private browsing, etc.)
        return `dev_ephemeral_${Date.now()}`;
    }
}

/**
 * Get the current device ID without creating one.
 * Returns null if no device ID has been created yet.
 */
export function getDeviceId(): string | null {
    if (typeof window === 'undefined') return null;
    try {
        return localStorage.getItem(DEVICE_ID_KEY);
    } catch {
        return null;
    }
}

function generateUUID(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    // Fallback
    return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}
