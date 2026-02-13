/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CORE OS — Job Validator (Phase 21C)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Validates JobTicket fields, payload integrity, nonce uniqueness, and expiry.
 *
 * @module coreos/jobs/validator
 * @version 1.0.0 (Phase 21C)
 */

import type { JobTicket, JobResult, JobType } from './types';
import { JOB_TYPES, COLLECTION_JOB_NONCES, COLLECTION_JOB_QUEUE } from './types';
import { computePayloadHash } from './signer';
import { verifyTicket, verifyResult } from './signer';

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION RESULT
// ═══════════════════════════════════════════════════════════════════════════

export interface ValidationResult {
    valid: boolean;
    error?: string;
    code?: string;
}

function ok(): ValidationResult {
    return { valid: true };
}

function fail(error: string, code: string): ValidationResult {
    return { valid: false, error, code };
}

// ═══════════════════════════════════════════════════════════════════════════
// TICKET VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Validate a JobTicket completely:
 * 1. Required fields present
 * 2. JobType is valid
 * 3. Not expired
 * 4. PayloadHash matches payload
 * 5. Ed25519 signature valid
 * 6. PolicyDecisionId present
 */
export function validateTicket(
    ticket: JobTicket,
    payload: string,
): ValidationResult {
    // 1. Required fields
    if (!ticket.jobId) return fail('Missing jobId', 'MISSING_JOB_ID');
    if (!ticket.jobType) return fail('Missing jobType', 'MISSING_JOB_TYPE');
    if (!ticket.actorId) return fail('Missing actorId', 'MISSING_ACTOR_ID');
    if (!ticket.nonce) return fail('Missing nonce', 'MISSING_NONCE');
    if (!ticket.traceId) return fail('Missing traceId', 'MISSING_TRACE_ID');
    if (!ticket.signature) return fail('Missing signature', 'MISSING_SIGNATURE');

    // 2. JobType is valid
    if (!JOB_TYPES.includes(ticket.jobType as JobType)) {
        return fail(`Invalid jobType: ${ticket.jobType}`, 'INVALID_JOB_TYPE');
    }

    // 3. PolicyDecisionId required
    if (!ticket.policyDecisionId) {
        return fail('Missing policyDecisionId', 'MISSING_POLICY_DECISION');
    }

    // 4. Not expired
    if (ticket.expiresAt <= Date.now()) {
        return fail('Ticket has expired', 'TICKET_EXPIRED');
    }

    // 5. PayloadHash matches
    const computedHash = computePayloadHash(payload);
    if (ticket.payloadHash !== computedHash) {
        return fail(
            `PayloadHash mismatch: expected ${computedHash}, got ${ticket.payloadHash}`,
            'PAYLOAD_HASH_MISMATCH',
        );
    }

    // 6. Ed25519 signature valid
    if (!verifyTicket(ticket)) {
        return fail('Invalid ticket signature', 'INVALID_SIGNATURE');
    }

    return ok();
}

// ═══════════════════════════════════════════════════════════════════════════
// NONCE VALIDATION (Replay Prevention)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check nonce uniqueness using Firestore.
 * Returns true if nonce is UNIQUE (not seen before).
 * Uses Firestore transaction for atomicity.
 */
export async function validateNonceUnique(
    nonce: string,
    db: FirebaseFirestore.Firestore,
): Promise<ValidationResult> {
    try {
        const nonceRef = db.collection(COLLECTION_JOB_NONCES).doc(nonce);

        const result = await db.runTransaction(async (tx) => {
            const doc = await tx.get(nonceRef);
            if (doc.exists) {
                return fail('Duplicate nonce — replay attack blocked', 'DUPLICATE_NONCE');
            }

            // Atomically claim the nonce
            tx.set(nonceRef, {
                usedAt: Date.now(),
                createdAt: Date.now(),
            });

            return ok();
        });

        return result;
    } catch (error: any) {
        console.error('[JobValidator] Nonce check failed:', error.message);
        return fail('Nonce validation error', 'NONCE_CHECK_ERROR');
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// RESULT VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Validate a JobResult completely:
 * 1. Required fields present
 * 2. HMAC signature valid
 * 3. jobId matches an existing PROCESSING job
 */
export function validateResult(
    result: JobResult,
    hmacSecret: string,
): ValidationResult {
    // 1. Required fields
    if (!result.jobId) return fail('Missing jobId', 'MISSING_JOB_ID');
    if (!result.status) return fail('Missing status', 'MISSING_STATUS');
    if (!result.traceId) return fail('Missing traceId', 'MISSING_TRACE_ID');
    if (!result.workerId) return fail('Missing workerId', 'MISSING_WORKER_ID');
    if (!result.signature) return fail('Missing signature', 'MISSING_SIGNATURE');
    if (!result.resultHash) return fail('Missing resultHash', 'MISSING_RESULT_HASH');

    // 2. Status is valid
    if (result.status !== 'SUCCEEDED' && result.status !== 'FAILED') {
        return fail(`Invalid status: ${result.status}`, 'INVALID_STATUS');
    }

    // 3. HMAC signature valid
    if (!verifyResult(result, hmacSecret)) {
        return fail('Invalid result signature', 'INVALID_SIGNATURE');
    }

    return ok();
}

/**
 * Validate that an existing job exists and is in PROCESSING status.
 */
export async function validateJobExists(
    jobId: string,
    db: FirebaseFirestore.Firestore,
): Promise<ValidationResult> {
    try {
        const jobRef = db.collection(COLLECTION_JOB_QUEUE).doc(jobId);
        const doc = await jobRef.get();

        if (!doc.exists) {
            return fail(`Job not found: ${jobId}`, 'JOB_NOT_FOUND');
        }

        const data = doc.data();
        if (data?.status !== 'PROCESSING') {
            return fail(
                `Job ${jobId} is in status ${data?.status}, expected PROCESSING`,
                'JOB_NOT_PROCESSING',
            );
        }

        return ok();
    } catch (error: any) {
        console.error('[JobValidator] Job lookup failed:', error.message);
        return fail('Job lookup error', 'JOB_LOOKUP_ERROR');
    }
}
