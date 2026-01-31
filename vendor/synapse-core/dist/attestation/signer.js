"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.signData = signData;
exports.signDigest = signDigest;
exports.verifySignature = verifySignature;
exports.verifyDigestSignature = verifyDigestSignature;
const crypto_1 = require("crypto");
const keys_1 = require("./keys");
// ═══════════════════════════════════════════════════════════════════════════
// SIGNING
// ═══════════════════════════════════════════════════════════════════════════
/**
 * Sign data with Ed25519 private key
 * Returns base64-encoded signature
 */
function signData(data, keyProvider) {
    const provider = keyProvider ?? (0, keys_1.getDefaultKeyProvider)();
    const keyPair = provider.getSigningKeyPair();
    // Create crypto key object from raw bytes
    const privateKey = (0, crypto_1.createPrivateKey)({
        key: Buffer.concat([
            // Ed25519 PKCS8 prefix
            Buffer.from('302e020100300506032b657004220420', 'hex'),
            Buffer.from(keyPair.privateKey),
        ]),
        format: 'der',
        type: 'pkcs8',
    });
    const dataBuffer = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
    const signature = (0, crypto_1.sign)(null, dataBuffer, privateKey);
    return signature.toString('base64');
}
/**
 * Sign segment digest (hex string)
 */
function signDigest(digest, keyProvider) {
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
function verifySignature(data, signatureBase64, publicKeyBytes) {
    try {
        // Create crypto public key object from raw bytes
        const publicKey = (0, crypto_1.createPublicKey)({
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
        return (0, crypto_1.verify)(null, dataBuffer, publicKey, signatureBuffer);
    }
    catch (error) {
        return false;
    }
}
/**
 * Verify digest signature
 */
function verifyDigestSignature(digest, signatureBase64, publicKeyBytes) {
    return verifySignature(digest, signatureBase64, publicKeyBytes);
}
//# sourceMappingURL=signer.js.map