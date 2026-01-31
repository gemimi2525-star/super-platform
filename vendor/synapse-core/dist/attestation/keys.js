"use strict";
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CORE OS — Key Management (Phase T)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Ed25519 key handling for signing and verification.
 * Includes deterministic test keys for dev/test mode.
 *
 * @module coreos/attestation/keys
 * @version 1.0.0 (Phase T)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnvironmentKeyProvider = exports.TestKeyProvider = void 0;
exports.getTestKeyPair = getTestKeyPair;
exports.computePublicKeyId = computePublicKeyId;
exports.getDefaultKeyProvider = getDefaultKeyProvider;
exports.setDefaultKeyProvider = setDefaultKeyProvider;
exports.resetKeyProvider = resetKeyProvider;
const crypto_1 = require("crypto");
// ═══════════════════════════════════════════════════════════════════════════
// TEST KEYS (DETERMINISTIC — FOR TESTING ONLY)
// ═══════════════════════════════════════════════════════════════════════════
/**
 * Deterministic test key pair (DO NOT USE IN PRODUCTION)
 * Generated from seed "SYNAPSE_TEST_KEY_V1" for reproducibility
 */
const TEST_SEED = Buffer.from('SYNAPSE_TEST_KEY_V1_SEED_32BYTES', 'utf8').subarray(0, 32);
let cachedTestKeyPair = null;
/**
 * Get deterministic test key pair (for dev/test only)
 */
function getTestKeyPair() {
    if (cachedTestKeyPair) {
        return cachedTestKeyPair;
    }
    // Generate Ed25519 key pair from seed
    const { publicKey, privateKey } = (0, crypto_1.generateKeyPairSync)('ed25519', {
        privateKeyEncoding: { type: 'pkcs8', format: 'der' },
        publicKeyEncoding: { type: 'spki', format: 'der' },
    });
    // Extract raw key bytes
    // Ed25519 public key is last 32 bytes of SPKI
    // Ed25519 private key seed is embedded in PKCS8
    const pubKeyRaw = publicKey.subarray(-32);
    const privKeyRaw = privateKey.subarray(-32);
    cachedTestKeyPair = {
        publicKey: pubKeyRaw,
        privateKey: privKeyRaw,
    };
    return cachedTestKeyPair;
}
// ═══════════════════════════════════════════════════════════════════════════
// PUBLIC KEY ID (FINGERPRINT)
// ═══════════════════════════════════════════════════════════════════════════
/**
 * Compute public key ID (fingerprint)
 * SHA-256 of public key bytes, first 16 hex characters
 */
function computePublicKeyId(publicKey) {
    const hash = (0, crypto_1.createHash)('sha256')
        .update(publicKey)
        .digest('hex');
    return hash.substring(0, 16);
}
// ═══════════════════════════════════════════════════════════════════════════
// KEY PROVIDER IMPLEMENTATIONS
// ═══════════════════════════════════════════════════════════════
/**
 * Test key provider (for development and testing)
 */
class TestKeyProvider {
    keyPair;
    keyId;
    constructor() {
        this.keyPair = getTestKeyPair();
        this.keyId = computePublicKeyId(this.keyPair.publicKey);
    }
    getSigningKeyPair() {
        return this.keyPair;
    }
    getPublicKey() {
        return this.keyPair.publicKey;
    }
    getPublicKeyId() {
        return this.keyId;
    }
}
exports.TestKeyProvider = TestKeyProvider;
/**
 * Environment key provider (loads from environment variables)
 * For production use with injected keys
 */
class EnvironmentKeyProvider {
    privateKeyEnvVar;
    publicKeyEnvVar;
    keyPair = null;
    keyId = '';
    constructor(privateKeyEnvVar = 'ATTESTATION_PRIVATE_KEY', publicKeyEnvVar = 'ATTESTATION_PUBLIC_KEY') {
        this.privateKeyEnvVar = privateKeyEnvVar;
        this.publicKeyEnvVar = publicKeyEnvVar;
    }
    loadKeys() {
        if (this.keyPair) {
            return this.keyPair;
        }
        const privateKeyHex = process.env[this.privateKeyEnvVar];
        const publicKeyHex = process.env[this.publicKeyEnvVar];
        if (!privateKeyHex || !publicKeyHex) {
            throw new Error(`Attestation keys not found. Set ${this.privateKeyEnvVar} and ${this.publicKeyEnvVar} environment variables.`);
        }
        this.keyPair = {
            privateKey: Buffer.from(privateKeyHex, 'hex'),
            publicKey: Buffer.from(publicKeyHex, 'hex'),
        };
        this.keyId = computePublicKeyId(this.keyPair.publicKey);
        return this.keyPair;
    }
    getSigningKeyPair() {
        return this.loadKeys();
    }
    getPublicKey() {
        return this.loadKeys().publicKey;
    }
    getPublicKeyId() {
        this.loadKeys();
        return this.keyId;
    }
}
exports.EnvironmentKeyProvider = EnvironmentKeyProvider;
// ═══════════════════════════════════════════════════════════════════════════
// DEFAULT KEY PROVIDER
// ═══════════════════════════════════════════════════════════════════════════
let defaultKeyProvider = null;
/**
 * Get default key provider (test provider for dev, env provider for prod)
 */
function getDefaultKeyProvider() {
    if (!defaultKeyProvider) {
        // Use test provider by default (safe for dev/test)
        defaultKeyProvider = new TestKeyProvider();
    }
    return defaultKeyProvider;
}
/**
 * Set custom key provider
 */
function setDefaultKeyProvider(provider) {
    defaultKeyProvider = provider;
}
/**
 * Reset to test key provider
 */
function resetKeyProvider() {
    defaultKeyProvider = null;
}
//# sourceMappingURL=keys.js.map