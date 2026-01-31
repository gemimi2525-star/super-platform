/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CORE OS — Digital Signer (Phase T)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Ed25519 signing and verification for audit attestation.
 * Algorithm: Ed25519 (LOCKED)
 *
 * @module coreos/attestation/signer
 * @version 1.0.0 (Phase T)
 */
import type { KeyProvider } from './types';
/**
 * Sign data with Ed25519 private key
 * Returns base64-encoded signature
 */
export declare function signData(data: string | Buffer, keyProvider?: KeyProvider): string;
/**
 * Sign segment digest (hex string)
 */
export declare function signDigest(digest: string, keyProvider?: KeyProvider): string;
/**
 * Verify Ed25519 signature
 * @param data - Original data that was signed
 * @param signatureBase64 - Base64-encoded signature
 * @param publicKeyBytes - Raw Ed25519 public key bytes
 */
export declare function verifySignature(data: string | Buffer, signatureBase64: string, publicKeyBytes: Uint8Array): boolean;
/**
 * Verify digest signature
 */
export declare function verifyDigestSignature(digest: string, signatureBase64: string, publicKeyBytes: Uint8Array): boolean;
//# sourceMappingURL=signer.d.ts.map