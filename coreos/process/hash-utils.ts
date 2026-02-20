/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PROCESS HASH UTILITIES (Phase 15B — SHA-256 Hardened)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Deterministic SHA-256 hashing for process integrity fields.
 * Client-side: WebCrypto (crypto.subtle)
 * Server-side: Node.js crypto
 *
 * CRITICAL: argsHash must be deterministic (same input → same output).
 * Input is canonicalized via stableStringify (sorted keys, no whitespace).
 *
 * @module coreos/process/hash-utils
 */

// ─── Stable Stringify (Deterministic JSON) ──────────────────────────────

/**
 * Recursively sort object keys and stringify.
 * Produces identical output for identical data regardless of insertion order.
 *
 * Rules:
 * - Objects: keys sorted lexicographically
 * - Arrays: elements in order (not sorted)
 * - Primitives: JSON.stringify
 * - undefined/functions: omitted (standard JSON behavior)
 */
export function stableStringify(value: unknown): string {
    if (value === null || value === undefined) {
        return 'null';
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
        return JSON.stringify(value);
    }

    if (typeof value === 'string') {
        return JSON.stringify(value);
    }

    if (Array.isArray(value)) {
        const items = value.map(item => stableStringify(item));
        return `[${items.join(',')}]`;
    }

    if (typeof value === 'object') {
        const keys = Object.keys(value as Record<string, unknown>).sort();
        const pairs = keys
            .filter(k => (value as Record<string, unknown>)[k] !== undefined)
            .map(k => `${JSON.stringify(k)}:${stableStringify((value as Record<string, unknown>)[k])}`);
        return `{${pairs.join(',')}}`;
    }

    return 'null';
}

// ─── SHA-256 (Client: WebCrypto) ────────────────────────────────────────

/**
 * Compute SHA-256 hex digest using WebCrypto (browser-native).
 * Falls back to a simple hash only in environments without crypto.subtle.
 *
 * @returns 64-char lowercase hex string
 */
export async function sha256Hex(input: string): Promise<string> {
    // Try WebCrypto first (works in browsers + modern Node 18+)
    if (typeof globalThis !== 'undefined' && globalThis.crypto?.subtle) {
        const encoder = new TextEncoder();
        const data = encoder.encode(input);
        const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Fallback: Node.js crypto (server-side API routes)
    try {
        const { createHash } = await import('crypto');
        return createHash('sha256').update(input, 'utf8').digest('hex');
    } catch {
        // Last resort: should never happen in production
        console.warn('[hash-utils] No SHA-256 provider available, using fallback');
        return fallbackHash(input);
    }
}

/**
 * Emergency fallback hash (djb2-based, NOT SHA-256).
 * Only used if neither WebCrypto nor Node crypto is available.
 */
function fallbackHash(input: string): string {
    let hash = 5381;
    for (let i = 0; i < input.length; i++) {
        hash = ((hash << 5) + hash + input.charCodeAt(i)) & 0xffffffff;
    }
    return 'fallback-' + (hash >>> 0).toString(16).padStart(8, '0');
}

// ─── argsHash (Public API) ──────────────────────────────────────────────

/**
 * Compute deterministic argsHash for process integrity.
 *
 * Pipeline: value → stableStringify → UTF-8 encode → SHA-256 → hex
 *
 * @param args - Any serializable value (object, string, etc.)
 * @returns 64-char lowercase hex string (or fallback-prefixed if no SHA-256)
 */
export async function argsHash(args: unknown): Promise<string> {
    const canonical = stableStringify(args);
    return sha256Hex(canonical);
}

// ─── Sync wrapper for legacy call sites ─────────────────────────────────

/**
 * @deprecated Use argsHash() (async) instead.
 * Kept for backward compatibility during migration.
 * Returns a placeholder that will be replaced by the real hash.
 */
export function createHash(input: string): string {
    // Synchronous stub — returns djb2 for immediate use
    // The real SHA-256 hash should be computed via argsHash()
    let hash = 5381;
    for (let i = 0; i < input.length; i++) {
        hash = ((hash << 5) + hash + input.charCodeAt(i)) & 0xffffffff;
    }
    return 'h-' + (hash >>> 0).toString(16).padStart(8, '0');
}
