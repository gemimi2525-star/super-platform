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

import { createHash, generateKeyPairSync } from 'crypto';
import type { Ed25519KeyPair, KeyProvider } from './types';

// ═══════════════════════════════════════════════════════════════════════════
// TEST KEYS (DETERMINISTIC — FOR TESTING ONLY)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Deterministic test key pair (DO NOT USE IN PRODUCTION)
 * Generated from seed "SYNAPSE_TEST_KEY_V1" for reproducibility
 */
const TEST_SEED = Buffer.from('SYNAPSE_TEST_KEY_V1_SEED_32BYTES', 'utf8').subarray(0, 32);

let cachedTestKeyPair: Ed25519KeyPair | null = null;

/**
 * Get deterministic test key pair (for dev/test only)
 */
export function getTestKeyPair(): Ed25519KeyPair {
    if (cachedTestKeyPair) {
        return cachedTestKeyPair;
    }

    // Generate Ed25519 key pair from seed
    const { publicKey, privateKey } = generateKeyPairSync('ed25519', {
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
export function computePublicKeyId(publicKey: Uint8Array): string {
    const hash = createHash('sha256')
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
export class TestKeyProvider implements KeyProvider {
    private readonly keyPair: Ed25519KeyPair;
    private readonly keyId: string;

    constructor() {
        this.keyPair = getTestKeyPair();
        this.keyId = computePublicKeyId(this.keyPair.publicKey);
    }

    getSigningKeyPair(): Ed25519KeyPair {
        return this.keyPair;
    }

    getPublicKey(): Uint8Array {
        return this.keyPair.publicKey;
    }

    getPublicKeyId(): string {
        return this.keyId;
    }
}

/**
 * Environment key provider (loads from environment variables)
 * For production use with injected keys
 */
export class EnvironmentKeyProvider implements KeyProvider {
    private keyPair: Ed25519KeyPair | null = null;
    private keyId: string = '';

    constructor(
        private readonly privateKeyEnvVar: string = 'ATTESTATION_PRIVATE_KEY',
        private readonly publicKeyEnvVar: string = 'ATTESTATION_PUBLIC_KEY'
    ) { }

    private loadKeys(): Ed25519KeyPair {
        if (this.keyPair) {
            return this.keyPair;
        }

        const privateKeyHex = process.env[this.privateKeyEnvVar];
        const publicKeyHex = process.env[this.publicKeyEnvVar];

        if (!privateKeyHex || !publicKeyHex) {
            throw new Error(
                `Attestation keys not found. Set ${this.privateKeyEnvVar} and ${this.publicKeyEnvVar} environment variables.`
            );
        }

        this.keyPair = {
            privateKey: Buffer.from(privateKeyHex, 'hex'),
            publicKey: Buffer.from(publicKeyHex, 'hex'),
        };

        this.keyId = computePublicKeyId(this.keyPair.publicKey);

        return this.keyPair;
    }

    getSigningKeyPair(): Ed25519KeyPair {
        return this.loadKeys();
    }

    getPublicKey(): Uint8Array {
        return this.loadKeys().publicKey;
    }

    getPublicKeyId(): string {
        this.loadKeys();
        return this.keyId;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// DEFAULT KEY PROVIDER
// ═══════════════════════════════════════════════════════════════════════════

let defaultKeyProvider: KeyProvider | null = null;

/**
 * Get default key provider (test provider for dev, env provider for prod)
 */
export function getDefaultKeyProvider(): KeyProvider {
    if (!defaultKeyProvider) {
        // Use test provider by default (safe for dev/test)
        defaultKeyProvider = new TestKeyProvider();
    }
    return defaultKeyProvider;
}

/**
 * Set custom key provider
 */
export function setDefaultKeyProvider(provider: KeyProvider): void {
    defaultKeyProvider = provider;
}

/**
 * Reset to test key provider
 */
export function resetKeyProvider(): void {
    defaultKeyProvider = null;
}
