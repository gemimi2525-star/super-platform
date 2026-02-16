/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Signed Integrity — HMAC SHA-256 (Phase 30)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Signs the integrity response payload using HMAC SHA-256 to prevent
 * tampering and establish trust. Uses a deterministic canonical JSON
 * representation (sorted keys) to ensure stable signatures.
 *
 * Secret: INTEGRITY_HMAC_SECRET env var (server-only, never exposed)
 */

import { createHmac } from 'crypto';

// ═══════════════════════════════════════════════════════════════════════════
// CANONICAL JSON
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Produce a deterministic JSON string with sorted keys at all levels.
 * This ensures the same payload always produces the same signature
 * regardless of JavaScript object key insertion order.
 */
export function canonicalJSON(obj: unknown): string {
    return JSON.stringify(obj, (_, value) => {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            return Object.keys(value)
                .sort()
                .reduce<Record<string, unknown>>((sorted, key) => {
                    sorted[key] = (value as Record<string, unknown>)[key];
                    return sorted;
                }, {});
        }
        return value;
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// HMAC SIGNER
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Sign the given payload (sans `signature` field) with HMAC SHA-256.
 * Returns the hex-encoded signature string.
 *
 * If INTEGRITY_HMAC_SECRET is not set, returns null (unsigned mode).
 */
export function signPayload(payload: Record<string, unknown>): string | null {
    const secret = process.env.INTEGRITY_HMAC_SECRET;
    if (!secret) {
        return null;
    }

    // Remove signature field if present before signing
    const { signature: _, ...payloadWithoutSig } = payload;

    const canonical = canonicalJSON(payloadWithoutSig);
    const hmac = createHmac('sha256', secret);
    hmac.update(canonical);
    return hmac.digest('hex');
}

/**
 * Verify a signature against a payload.
 * Used for local testing / validation scripts.
 */
export function verifySignature(
    payload: Record<string, unknown>,
    signature: string,
): boolean {
    const computed = signPayload(payload);
    if (!computed) return false;

    // Constant-time comparison to prevent timing attacks
    if (computed.length !== signature.length) return false;

    let mismatch = 0;
    for (let i = 0; i < computed.length; i++) {
        mismatch |= computed.charCodeAt(i) ^ signature.charCodeAt(i);
    }
    return mismatch === 0;
}
