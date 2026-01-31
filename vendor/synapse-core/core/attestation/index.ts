/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CORE OS — Attestation Module (Phase T)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Trust & Attestation Layer for signed audit export.
 * Algorithm: Ed25519 (LOCKED)
 * 
 * @module coreos/attestation
 * @version 1.0.0 (Phase T)
 */

// Types
export type {
    AttestationManifest,
    Ed25519KeyPair,
    KeyProvider,
    VerificationResult,
    SegmentMetadata,
} from './types';
export {
    ATTESTATION_VERSION,
    SIGNATURE_ALGORITHM,
    TOOL_VERSION,
} from './types';

// Digest
export {
    LINE_TERMINATOR,
    DIGEST_ALGORITHM,
    computeSegmentDigest,
    computeDigestFromBytes,
    normalizeLineEndings,
    extractSegmentMetadata,
} from './digest';

// Keys
export {
    getTestKeyPair,
    computePublicKeyId,
    TestKeyProvider,
    EnvironmentKeyProvider,
    getDefaultKeyProvider,
    setDefaultKeyProvider,
    resetKeyProvider,
} from './keys';

// Signer
export {
    signData,
    signDigest,
    verifySignature,
    verifyDigestSignature,
} from './signer';

// Manifest
export {
    buildManifest,
    serializeManifest,
    parseManifest,
} from './manifest';

// Verifier
export {
    verifySegment,
    verifySegmentContinuity,
} from './verifier';
