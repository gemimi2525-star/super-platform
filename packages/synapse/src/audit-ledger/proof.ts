/**
 * SYNAPSE PROOF BUNDLE
 * 
 * Public-shareable proof of a decision that can be verified externally.
 */

import { DecisionResult } from '../reason-core/schema';
import { Signer } from './signer';
import * as crypto from 'crypto';

export interface ProofBundle {
    // Identity
    readonly decisionId: string;
    readonly policyId: string;
    readonly policyVersion: string;

    // Intent (Hashed for privacy)
    readonly intentHash: string;       // SHA-256 of { action, target, params }

    // Decision
    readonly decision: DecisionResult;

    // Audit Trail
    readonly ledgerHash: string;       // Hash of the ledger entry
    readonly signature: string;        // Authority signature
    readonly issuedAt: number;

    // Authority Info
    readonly authorityId: string;
}

/**
 * Verify a Proof Bundle independently
 * This function simulates external verification
 */
export function verifyProofBundle(bundle: ProofBundle, signer: Signer): {
    valid: boolean;
    reason?: string;
} {
    try {
        // Reconstruct the payload that was signed
        const payload = JSON.stringify({
            decisionId: bundle.decisionId,
            policyId: bundle.policyId,
            policyVersion: bundle.policyVersion,
            intentHash: bundle.intentHash,
            decision: bundle.decision,
            issuedAt: bundle.issuedAt
        });

        // Verify signature
        const isSignatureValid = signer.verify(payload, bundle.signature);

        if (!isSignatureValid) {
            return { valid: false, reason: 'Invalid signature' };
        }

        return { valid: true };
    } catch (error) {
        return { valid: false, reason: `Verification error: ${error}` };
    }
}

/**
 * Create a ProofBundle from a DecisionRecord
 * This is called by the Authority when creating shareable proofs
 */
export function createProofBundle(
    decisionId: string,
    policyId: string,
    policyVersion: string,
    intent: { action: string; target: string; params: Record<string, unknown> },
    decision: DecisionResult,
    ledgerHash: string,
    authorityId: string,
    signer: Signer
): ProofBundle {
    const issuedAt = Date.now();

    // Hash the intent (privacy-preserving)
    const intentHash = crypto.createHash('sha256')
        .update(JSON.stringify(intent))
        .digest('hex');

    // Create payload to sign
    const payload = JSON.stringify({
        decisionId,
        policyId,
        policyVersion,
        intentHash,
        decision,
        issuedAt
    });

    // Sign the payload
    const signature = signer.sign(payload);

    return {
        decisionId,
        policyId,
        policyVersion,
        intentHash,
        decision,
        ledgerHash,
        signature,
        issuedAt,
        authorityId
    };
}
