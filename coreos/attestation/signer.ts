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

import { sign, verify, createPrivateKey, createPublicKey } from 'crypto';
import type { KeyProvider } from './types';
import { getDefaultKeyProvider } from './keys';

// ═══════════════════════════════════════════════════════════════════════════
// SIGNING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Sign data with Ed25519 private key
 * Returns base64-encoded signature
 */
export function signData(
    data: string | Buffer,
    keyProvider?: KeyProvider
): string {
    const provider = keyProvider ?? getDefaultKeyProvider();
    const keyPair = provider.getSigningKeyPair();

    // Create crypto key object from raw bytes
    const privateKey = createPrivateKey({
        key: Buffer.concat([
            // Ed25519 PKCS8 prefix
            Buffer.from('302e020100300506032b657004220420', 'hex'),
            Buffer.from(keyPair.privateKey),
        ]),
        format: 'der',
        type: 'pkcs8',
    });

    const dataBuffer = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;

    const signature = sign(null, dataBuffer, privateKey);

    return signature.toString('base64');
}

/**
 * Sign segment digest (hex string)
 */
export function signDigest(
    digest: string,
    keyProvider?: KeyProvider
): string {
    // Sign the hex digest string directly
    return signData(digest, keyProvider);
}

// ═══════════════════════════════════════════════════════════════════════════
// VERIFICATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Verify Ed25519 signature
 * @param data - Original data that was signed
 * @param signatureBase64 - Base64-encoded signature
 * @param publicKeyBytes - Raw Ed25519 public key bytes
 */
export function verifySignature(
    data: string | Buffer,
    signatureBase64: string,
    publicKeyBytes: Uint8Array
): boolean {
    try {
        // Create crypto public key object from raw bytes
        const publicKey = createPublicKey({
            key: Buffer.concat([
                // Ed25519 SPKI prefix
                Buffer.from('302a300506032b6570032100', 'hex'),
                Buffer.from(publicKeyBytes),
            ]),
            format: 'der',
            type: 'spki',
        });

        const dataBuffer = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
        const signatureBuffer = Buffer.from(signatureBase64, 'base64');

        return verify(null, dataBuffer, publicKey, signatureBuffer);
    } catch (error) {
        return false;
    }
}

/**
 * Verify digest signature
 */
export function verifyDigestSignature(
    digest: string,
    signatureBase64: string,
    publicKeyBytes: Uint8Array
): boolean {
    return verifySignature(digest, signatureBase64, publicKeyBytes);
}
