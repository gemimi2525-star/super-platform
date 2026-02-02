/**
 * SYNAPSE PUBLIC VERIFIER
 * 
 * Public-safe ProofBundle verification for external parties.
 * This module ONLY exposes verification logic - NO internal Authority/Ledger access.
 */

import * as crypto from 'node:crypto';

export interface ProofBundle {
    readonly decisionId: string;
    readonly policyId: string;
    readonly policyVersion: string;
    readonly intentHash: string;
    readonly decision: 'ALLOW' | 'DENY' | 'ESCALATE';
    readonly ledgerHash: string;
    readonly signature: string;
    readonly issuedAt: number;
    readonly authorityId: string;
}

export interface VerificationResult {
    valid: boolean;
    reasons?: string[];
}

/**
 * Verify a ProofBundle (Public-Safe)
 * 
 * This function can be used by external parties without system access.
 * It performs signature format validation and structural checks.
 */
export function verifyProofBundle(bundle: ProofBundle): VerificationResult {
    const reasons: string[] = [];

    // 1. Structural validation
    if (!bundle.decisionId || typeof bundle.decisionId !== 'string') {
        reasons.push('Missing or invalid decisionId');
    }

    if (!bundle.policyId || typeof bundle.policyId !== 'string') {
        reasons.push('Missing or invalid policyId');
    }

    if (!bundle.policyVersion || typeof bundle.policyVersion !== 'string') {
        reasons.push('Missing or invalid policyVersion');
    }

    if (!bundle.intentHash || typeof bundle.intentHash !== 'string') {
        reasons.push('Missing or invalid intentHash');
    }

    if (!['ALLOW', 'DENY', 'ESCALATE'].includes(bundle.decision)) {
        reasons.push('Invalid decision value');
    }

    if (!bundle.signature || typeof bundle.signature !== 'string') {
        reasons.push('Missing or invalid signature');
    }

    if (!bundle.issuedAt || typeof bundle.issuedAt !== 'number') {
        reasons.push('Missing or invalid issuedAt timestamp');
    }

    // 2. Hash format validation (SHA-256 = 64 hex chars)
    if (bundle.intentHash && !/^[a-f0-9]{64}$/i.test(bundle.intentHash)) {
        reasons.push('intentHash is not a valid SHA-256 hash');
    }

    if (bundle.ledgerHash && !/^[a-f0-9]{64}$/i.test(bundle.ledgerHash)) {
        reasons.push('ledgerHash is not a valid SHA-256 hash');
    }

    // 3. Signature format validation (HMAC-SHA256 = 64 hex chars)
    if (bundle.signature && !/^[a-f0-9]{64}$/i.test(bundle.signature)) {
        reasons.push('Signature format is invalid');
    }

    // 4. Timestamp sanity check
    if (bundle.issuedAt) {
        const now = Date.now();
        const age = now - bundle.issuedAt;

        // Warn if timestamp is in the future
        if (bundle.issuedAt > now + 60000) { // 1 minute tolerance
            reasons.push('Timestamp is in the future');
        }

        // Warn if timestamp is very old (>1 year)
        if (age > 365 * 24 * 60 * 60 * 1000) {
            reasons.push('Timestamp is older than 1 year');
        }
    }

    if (reasons.length > 0) {
        return { valid: false, reasons };
    }

    return { valid: true };
}

/**
 * Validate ProofBundle structure without verification
 * Useful for checking if JSON is parseable as ProofBundle
 */
export function isValidProofBundleStructure(obj: any): obj is ProofBundle {
    return (
        obj &&
        typeof obj === 'object' &&
        typeof obj.decisionId === 'string' &&
        typeof obj.policyId === 'string' &&
        typeof obj.policyVersion === 'string' &&
        typeof obj.intentHash === 'string' &&
        typeof obj.decision === 'string' &&
        typeof obj.ledgerHash === 'string' &&
        typeof obj.signature === 'string' &&
        typeof obj.issuedAt === 'number' &&
        typeof obj.authorityId === 'string'
    );
}
