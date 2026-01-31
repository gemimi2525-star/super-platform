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
import type { Ed25519KeyPair, KeyProvider } from './types';
/**
 * Get deterministic test key pair (for dev/test only)
 */
export declare function getTestKeyPair(): Ed25519KeyPair;
/**
 * Compute public key ID (fingerprint)
 * SHA-256 of public key bytes, first 16 hex characters
 */
export declare function computePublicKeyId(publicKey: Uint8Array): string;
/**
 * Test key provider (for development and testing)
 */
export declare class TestKeyProvider implements KeyProvider {
    private readonly keyPair;
    private readonly keyId;
    constructor();
    getSigningKeyPair(): Ed25519KeyPair;
    getPublicKey(): Uint8Array;
    getPublicKeyId(): string;
}
/**
 * Environment key provider (loads from environment variables)
 * For production use with injected keys
 */
export declare class EnvironmentKeyProvider implements KeyProvider {
    private readonly privateKeyEnvVar;
    private readonly publicKeyEnvVar;
    private keyPair;
    private keyId;
    constructor(privateKeyEnvVar?: string, publicKeyEnvVar?: string);
    private loadKeys;
    getSigningKeyPair(): Ed25519KeyPair;
    getPublicKey(): Uint8Array;
    getPublicKeyId(): string;
}
/**
 * Get default key provider (test provider for dev, env provider for prod)
 */
export declare function getDefaultKeyProvider(): KeyProvider;
/**
 * Set custom key provider
 */
export declare function setDefaultKeyProvider(provider: KeyProvider): void;
/**
 * Reset to test key provider
 */
export declare function resetKeyProvider(): void;
//# sourceMappingURL=keys.d.ts.map