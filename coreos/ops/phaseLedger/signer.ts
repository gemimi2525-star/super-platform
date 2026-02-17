/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Phase Ledger — HMAC Signer / Verifier (Phase 34.3 — Hardened)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Verifies inbound POST requests to the upsert endpoint using HMAC-SHA256.
 *
 * Phase 34.3 changes:
 *   - Signature base = "timestamp.nonce.rawBody" (replay protection)
 *   - Timestamp window validation (±5 minutes)
 *   - Nonce format validation (hex, >= 16 bytes)
 *
 * Secret: OPS_PHASE_LEDGER_SECRET env var
 */

import { createHmac } from 'crypto';

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const ENV_KEY = 'OPS_PHASE_LEDGER_SECRET';

export const HEADER_SIGNATURE = 'x-ops-signature';
export const HEADER_TIMESTAMP = 'x-ops-timestamp';
export const HEADER_NONCE = 'x-ops-nonce';

/** Max allowed clock skew in milliseconds (5 minutes) */
export const MAX_TIMESTAMP_SKEW_MS = 5 * 60 * 1000;

/** Minimum nonce length in hex chars (16 bytes = 32 hex chars) */
export const MIN_NONCE_HEX_LENGTH = 32;

/** Nonce TTL in milliseconds (10 minutes) — for Firestore cleanup */
export const NONCE_TTL_MS = 10 * 60 * 1000;

/** Firestore collection for nonce replay guard */
export const COLLECTION_NONCES = 'coreos_phase_ledger_nonces';

// ═══════════════════════════════════════════════════════════════════════════
// ERROR CODES
// ═══════════════════════════════════════════════════════════════════════════

export const ERR_MISSING_SIGNATURE = 'OPS_LEDGER_MISSING_SIGNATURE';
export const ERR_MISSING_TIMESTAMP = 'OPS_LEDGER_MISSING_TIMESTAMP';
export const ERR_MISSING_NONCE = 'OPS_LEDGER_MISSING_NONCE';
export const ERR_INVALID_NONCE = 'OPS_LEDGER_INVALID_NONCE';
export const ERR_TIMESTAMP_SKEW = 'OPS_LEDGER_TIMESTAMP_SKEW';
export const ERR_REPLAY = 'OPS_LEDGER_REPLAY';
export const ERR_INVALID_SIGNATURE = 'OPS_LEDGER_INVALID_SIGNATURE';
export const ERR_SECRET_NOT_SET = 'OPS_LEDGER_SECRET_NOT_SET';

// ═══════════════════════════════════════════════════════════════════════════
// SIGNATURE BASE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Build canonical signature base string.
 * Format: "{timestamp}.{nonce}.{rawBody}"
 */
export function buildSignatureBase(
    timestamp: string,
    nonce: string,
    rawBody: string,
): string {
    return `${timestamp}.${nonce}.${rawBody}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// SIGN (used by tests & CI scripts)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Sign a signature base string with HMAC-SHA256.
 * Returns hex-encoded signature.
 */
export function signBody(base: string, secret?: string): string | null {
    const s = secret ?? process.env[ENV_KEY];
    if (!s) return null;
    return createHmac('sha256', s).update(base).digest('hex');
}

// ═══════════════════════════════════════════════════════════════════════════
// VERIFY
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Verify an HMAC-SHA256 signature against a signature base.
 * Uses constant-time comparison to prevent timing attacks.
 */
export function verifyLedgerSignature(
    base: string,
    signature: string,
    secret?: string,
): boolean {
    const s = secret ?? process.env[ENV_KEY];
    if (!s) {
        console.error(`[PhaseLedger/Signer] ${ENV_KEY} not configured`);
        return false;
    }

    const expected = createHmac('sha256', s).update(base).digest('hex');

    // Constant-time comparison
    if (expected.length !== signature.length) return false;

    let mismatch = 0;
    for (let i = 0; i < expected.length; i++) {
        mismatch |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
    }
    return mismatch === 0;
}

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Validate that timestamp is within ±5 minutes of server time.
 * @param timestampMs - Unix timestamp in milliseconds
 */
export function validateTimestamp(timestampMs: number): boolean {
    if (!Number.isFinite(timestampMs) || timestampMs <= 0) return false;
    const now = Date.now();
    return Math.abs(now - timestampMs) <= MAX_TIMESTAMP_SKEW_MS;
}

/**
 * Validate nonce format: hex string, >= 32 chars (16 bytes).
 */
export function validateNonce(nonce: string): boolean {
    if (!nonce || nonce.length < MIN_NONCE_HEX_LENGTH) return false;
    return /^[a-f0-9]+$/i.test(nonce);
}

// ═══════════════════════════════════════════════════════════════════════════
// HEADER EXTRACTION
// ═══════════════════════════════════════════════════════════════════════════

export interface ExtractedHeaders {
    signature: string | null;
    timestamp: string | null;
    nonce: string | null;
}

/**
 * Extract all security headers from request.
 */
export function extractHeaders(headers: Headers): ExtractedHeaders {
    return {
        signature: headers.get(HEADER_SIGNATURE),
        timestamp: headers.get(HEADER_TIMESTAMP),
        nonce: headers.get(HEADER_NONCE),
    };
}
