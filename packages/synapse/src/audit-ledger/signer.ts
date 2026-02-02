/**
 * SYNAPSE SIGNER INTERFACE
 * 
 * Abstracts signature logic from the Audit Ledger.
 * Enables future integration with KMS, HSM, or Hardware Wallets.
 */

import * as crypto from 'crypto';

export interface Signer {
    /**
     * Sign a payload and return signature
     */
    sign(payload: string): string;

    /**
     * Verify signature for a payload
     */
    verify(payload: string, signature: string): boolean;

    /**
     * Get public identifier/key for external verification
     */
    getPublicKey(): string;
}

/**
 * Mock Signer for Development/Testing
 * Uses SHA-256 HMAC with a secret key
 * 
 * WARNING: NOT CRYPTOGRAPHICALLY SECURE FOR PRODUCTION
 * Replace with proper KMS/HSM integration
 */
export class MockSigner implements Signer {
    private secretKey: string;
    private publicKey: string;

    constructor(seed: string = 'synapse-authority-v1') {
        // Derive a "secret" from seed (mock only)
        this.secretKey = crypto.createHash('sha256').update(seed).digest('hex');
        // Public key is just a hash of the secret (mock only)
        this.publicKey = crypto.createHash('sha256').update(this.secretKey).digest('hex').substring(0, 16);
    }

    public sign(payload: string): string {
        const hmac = crypto.createHmac('sha256', this.secretKey);
        hmac.update(payload);
        return hmac.digest('hex');
    }

    public verify(payload: string, signature: string): boolean {
        const expectedSignature = this.sign(payload);
        return expectedSignature === signature;
    }

    public getPublicKey(): string {
        return this.publicKey;
    }
}
