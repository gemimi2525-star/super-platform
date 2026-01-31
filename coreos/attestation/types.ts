/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CORE OS — Attestation Module Types (Phase T)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Trust & Attestation Layer for signed audit segments.
 * Algorithm: Ed25519 (LOCKED)
 * 
 * @module coreos/attestation/types
 * @version 1.0.0 (Phase T)
 */

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

/** Attestation schema version */
export const ATTESTATION_VERSION = '1.0' as const;

/** Signature algorithm (LOCKED) */
export const SIGNATURE_ALGORITHM = 'ed25519' as const;

/** Tool version for manifest */
export const TOOL_VERSION = 'coreos-attestation-1.0.0' as const;

// ═══════════════════════════════════════════════════════════════════════════
// ATTESTATION MANIFEST
// ═══════════════════════════════════════════════════════════════════════════

/**
 * AttestationManifest — Signed evidence metadata for a segment
 */
export interface AttestationManifest {
    /** Schema version */
    readonly version: '1.0';
    /** Tool that generated this manifest */
    readonly toolVersion: string;
    /** Chain ID from audit records */
    readonly chainId: string;
    /** Segment file name (e.g., "audit-0001.jsonl") */
    readonly segmentName: string;
    /** First sequence number in segment */
    readonly seqStart: number;
    /** Last sequence number in segment */
    readonly seqEnd: number;
    /** Number of records in segment */
    readonly recordCount: number;
    /** Hash of the last record in segment */
    readonly headHash: string;
    /** SHA-256 digest of the JSONL file (hex) */
    readonly segmentDigest: string;
    /** Ed25519 signature (base64) */
    readonly signature: string;
    /** Signature algorithm (locked to ed25519) */
    readonly algorithm: 'ed25519';
    /** Public key fingerprint (SHA-256 of public key, first 16 hex chars) */
    readonly publicKeyId: string;
    /** Creation timestamp (epoch ms) */
    readonly createdAt: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// KEY TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Ed25519 key pair
 */
export interface Ed25519KeyPair {
    readonly publicKey: Uint8Array;
    readonly privateKey: Uint8Array;
}

/**
 * Key provider interface (for injection/rotation)
 */
export interface KeyProvider {
    /** Get the signing key pair */
    getSigningKeyPair(): Ed25519KeyPair;
    /** Get the public key for verification */
    getPublicKey(): Uint8Array;
    /** Get the public key ID (fingerprint) */
    getPublicKeyId(): string;
}

// ═══════════════════════════════════════════════════════════════════════════
// VERIFICATION RESULT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Verification result from external verifier
 */
export interface VerificationResult {
    /** Overall verification passed */
    readonly ok: boolean;
    /** List of failure reasons (empty if ok) */
    readonly failures: readonly string[];
    /** Statistics about the verified segment */
    readonly stats: {
        readonly seqStart: number;
        readonly seqEnd: number;
        readonly recordCount: number;
        readonly chainId: string;
    };
}

/**
 * Segment metadata (partial manifest before signing)
 */
export interface SegmentMetadata {
    readonly chainId: string;
    readonly segmentName: string;
    readonly seqStart: number;
    readonly seqEnd: number;
    readonly recordCount: number;
    readonly headHash: string;
    readonly segmentDigest: string;
}
