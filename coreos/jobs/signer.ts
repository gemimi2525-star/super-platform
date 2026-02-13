/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CORE OS — Job Ticket Signer (Phase 21C)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Ed25519 signing for JobTicket (TS → Go)
 * HMAC-SHA256 verification for JobResult (Go → TS)
 *
 * @module coreos/jobs/signer
 * @version 1.0.0 (Phase 21C)
 */

import { createHash, createHmac } from 'crypto';
import { signData, verifySignature } from '@/vendor/synapse-core/core/attestation/signer';
import { getDefaultKeyProvider } from '@/vendor/synapse-core/core/attestation/keys';
import type { JobTicket, JobResult } from './types';

// ═══════════════════════════════════════════════════════════════════════════
// CANONICAL JSON
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create canonical JSON string with recursively sorted keys.
 * Deterministic serialization for signing — ensures TS and Go produce identical output.
 */
export function canonicalJSON(obj: unknown): string {
    return JSON.stringify(sortKeysDeep(obj));
}

/**
 * Recursively sort object keys for deterministic serialization.
 */
function sortKeysDeep(value: unknown): unknown {
    if (Array.isArray(value)) {
        return value.map(sortKeysDeep);
    }
    if (value !== null && typeof value === 'object') {
        const sorted: Record<string, unknown> = {};
        for (const key of Object.keys(value as Record<string, unknown>).sort()) {
            sorted[key] = sortKeysDeep((value as Record<string, unknown>)[key]);
        }
        return sorted;
    }
    return value;
}

// ═══════════════════════════════════════════════════════════════════════════
// PAYLOAD HASH
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Compute SHA-256 hash of a canonical JSON payload.
 * Returns hex string (64 chars).
 */
export function computePayloadHash(payload: string): string {
    return createHash('sha256').update(payload).digest('hex');
}

// ═══════════════════════════════════════════════════════════════════════════
// TICKET SIGNING (Ed25519)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get the signable data from a JobTicket.
 * Includes all fields EXCEPT signature.
 */
export function getTicketSignableData(ticket: Omit<JobTicket, 'signature'>): string {
    const signable = {
        jobId: ticket.jobId,
        jobType: ticket.jobType,
        actorId: ticket.actorId,
        scope: [...ticket.scope],
        policyDecisionId: ticket.policyDecisionId,
        requestedAt: ticket.requestedAt,
        expiresAt: ticket.expiresAt,
        payloadHash: ticket.payloadHash,
        nonce: ticket.nonce,
        traceId: ticket.traceId,
    };
    return canonicalJSON(signable);
}

/**
 * Sign a JobTicket with Ed25519.
 * Uses the SYNAPSE attestation KeyProvider.
 */
export function signTicket(ticket: Omit<JobTicket, 'signature'>): JobTicket {
    const data = getTicketSignableData(ticket);
    const signature = signData(data);

    return {
        ...ticket,
        signature,
    } as JobTicket;
}

/**
 * Verify a JobTicket Ed25519 signature.
 * Returns true if valid, false otherwise.
 */
export function verifyTicket(ticket: JobTicket): boolean {
    try {
        const { signature, ...ticketWithoutSig } = ticket;
        const data = getTicketSignableData(ticketWithoutSig);
        const keyProvider = getDefaultKeyProvider();
        const publicKey = keyProvider.getPublicKey();

        return verifySignature(data, signature, publicKey);
    } catch (error) {
        console.error('[JobSigner] Ticket verification failed:', error);
        return false;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// RESULT VERIFICATION (HMAC-SHA256)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get the signable data from a JobResult.
 * Includes all fields EXCEPT signature.
 */
export function getResultSignableData(result: Omit<JobResult, 'signature'>): string {
    const signable = {
        jobId: result.jobId,
        status: result.status,
        startedAt: result.startedAt,
        finishedAt: result.finishedAt,
        resultHash: result.resultHash,
        traceId: result.traceId,
        workerId: result.workerId,
        metrics: result.metrics,
    };
    return canonicalJSON(signable);
}

/**
 * Compute HMAC-SHA256 for a JobResult.
 */
export function computeResultHMAC(result: Omit<JobResult, 'signature'>, secret: string): string {
    const data = getResultSignableData(result);
    return createHmac('sha256', secret).update(data).digest('hex');
}

/**
 * Verify a JobResult HMAC-SHA256 signature.
 * Uses shared secret from environment.
 */
export function verifyResult(result: JobResult, secret?: string): boolean {
    try {
        const hmacSecret = secret ?? process.env.JOB_WORKER_HMAC_SECRET;
        if (!hmacSecret) {
            console.error('[JobSigner] JOB_WORKER_HMAC_SECRET not configured');
            return false;
        }

        const { signature, ...resultWithoutSig } = result;
        const expectedHMAC = computeResultHMAC(resultWithoutSig, hmacSecret);

        // Constant-time comparison
        if (signature.length !== expectedHMAC.length) return false;

        let diff = 0;
        for (let i = 0; i < signature.length; i++) {
            diff |= signature.charCodeAt(i) ^ expectedHMAC.charCodeAt(i);
        }
        return diff === 0;
    } catch (error) {
        console.error('[JobSigner] Result verification failed:', error);
        return false;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// PUBLIC KEY EXPORT (for Go Worker)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Export the public key as base64 for Go worker configuration.
 */
export function exportPublicKeyBase64(): string {
    const keyProvider = getDefaultKeyProvider();
    const publicKey = keyProvider.getPublicKey();
    return Buffer.from(publicKey).toString('base64');
}
