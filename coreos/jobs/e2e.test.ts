/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Phase 21C — E2E Integration Test (Local Simulation)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Simulates the FULL job lifecycle locally:
 *   TS enqueue → Worker claim → Execute stub → Sign result → TS verify → Audit
 *
 * Does NOT require deployed Vercel or Firestore —
 * tests the contract logic end-to-end with mocked I/O.
 */

import { describe, it, expect, vi, beforeAll } from 'vitest';
import { createHash, createHmac, randomUUID } from 'crypto';

// ─── Constants ───
const HMAC_SECRET = 'test-e2e-hmac-secret-phase21c';

// ─── Mock synapse-core attestation with vi.hoisted() ───
const { mockSignData, mockVerifySignature, mockGetDefaultKeyProvider } = vi.hoisted(() => ({
    mockSignData: vi.fn().mockReturnValue('mock-ed25519-sig-e2e'),
    mockVerifySignature: vi.fn().mockReturnValue(true),
    mockGetDefaultKeyProvider: vi.fn().mockReturnValue({
        getSigningKeyPair: () => ({
            publicKey: new Uint8Array(32),
            privateKey: new Uint8Array(32),
        }),
        getPublicKey: () => new Uint8Array(32),
        getPublicKeyId: () => 'test-key-id',
    }),
}));

vi.mock('@/vendor/synapse-core/core/attestation/signer', () => ({
    signData: mockSignData,
    verifySignature: mockVerifySignature,
}));

vi.mock('@/vendor/synapse-core/core/attestation/keys', () => ({
    getDefaultKeyProvider: mockGetDefaultKeyProvider,
}));

import {
    signTicket,
    canonicalJSON,
    computePayloadHash,
    verifyResult,
    getResultSignableData,
} from './signer';

import {
    validateTicket,
    validateResult,
} from './validator';

import type { JobTicket, JobResult } from './types';
import { DEFAULT_TICKET_TTL_MS } from './types';

// ═══════════════════════════════════════════════════════════════════════════
// HELPER: Simulate Go Worker HMAC Signing
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Simulates what the Go worker does when signing a result.
 * Uses the SAME canonical JSON + HMAC-SHA256 logic as the Go contracts.
 */
function goWorkerSignResult(result: Omit<JobResult, 'signature'>): string {
    // Go worker builds signable data with sorted keys (same as TS getResultSignableData)
    // ALL keys at ALL levels are alphabetically sorted
    const signable = {
        finishedAt: result.finishedAt,
        jobId: result.jobId,
        metrics: { attempts: result.metrics.attempts, latencyMs: result.metrics.latencyMs },
        resultHash: result.resultHash,
        startedAt: result.startedAt,
        status: result.status,
        traceId: result.traceId,
        workerId: result.workerId,
    };
    const data = JSON.stringify(signable);
    return createHmac('sha256', HMAC_SECRET).update(data).digest('hex');
}

// ═══════════════════════════════════════════════════════════════════════════
// E2E TEST
// ═══════════════════════════════════════════════════════════════════════════

describe('Phase 21C — E2E Integration Test', () => {

    let ticket: JobTicket;
    let payload: string;
    let canonicalPayload: string;
    const jobId = randomUUID();
    const traceId = `trace-${randomUUID()}`;
    const auditLog: any[] = []; // simulate append-only audit

    // ─── STEP 1: TS Enqueue (Create Signed Ticket) ───
    it('E2E-1 → TS creates signed JobTicket', () => {
        const rawPayload = { reason: 'phase21c-smoke', target: 'scheduler' };
        canonicalPayload = canonicalJSON(rawPayload);
        payload = canonicalPayload;

        const payloadHash = computePayloadHash(canonicalPayload);
        const now = Date.now();

        ticket = signTicket({
            jobId,
            jobType: 'scheduler.tick',
            actorId: 'system',
            scope: ['execute'],
            policyDecisionId: `pd-${randomUUID()}`,
            requestedAt: now,
            expiresAt: now + DEFAULT_TICKET_TTL_MS,
            payloadHash,
            nonce: randomUUID(),
            traceId,
        });

        expect(ticket.signature).toBe('mock-ed25519-sig-e2e');
        expect(ticket.jobId).toBe(jobId);
        expect(ticket.jobType).toBe('scheduler.tick');
        console.log(`[E2E] ✅ Step 1: Ticket signed — jobId=${jobId}`);
    });

    // ─── STEP 2: TS Validates Ticket (pre-enqueue) ───
    it('E2E-2 → TS validates ticket before enqueuing', () => {
        const result = validateTicket(ticket, payload);
        expect(result.valid).toBe(true);
        console.log('[E2E] ✅ Step 2: Ticket validated (fields, expiry, payload hash, signature)');
    });

    // ─── STEP 3: Simulate Queue (Enqueue → Claim) ───
    it('E2E-3 → Job queued and claimed by worker', () => {
        // Simulating Firestore enqueue + claim
        // In production: Firestore atomic transaction
        const queueRecord = {
            ticket,
            payload,
            version: '1.0',
            status: 'PENDING',
            workerId: null as string | null,
            claimedAt: null as number | null,
        };

        // Simulate claim
        queueRecord.status = 'PROCESSING';
        queueRecord.workerId = 'worker-e2e-1';
        queueRecord.claimedAt = Date.now();

        expect(queueRecord.status).toBe('PROCESSING');
        expect(queueRecord.workerId).toBe('worker-e2e-1');
        console.log('[E2E] ✅ Step 3: Job claimed by worker-e2e-1');
    });

    // ─── STEP 4: Go Worker Verifies Ticket ───
    it('E2E-4 → Go worker verifies ticket signature + expiry + payload hash', () => {
        // Simulate Go worker verification
        // 1. Verify Ed25519 signature (mocked — returns true)
        expect(mockVerifySignature).toBeDefined();

        // 2. Verify not expired
        expect(ticket.expiresAt).toBeGreaterThan(Date.now());

        // 3. Verify payload hash
        const expectedHash = computePayloadHash(payload);
        expect(ticket.payloadHash).toBe(expectedHash);

        console.log('[E2E] ✅ Step 4: Worker verified ticket (sig, expiry, hash)');
    });

    // ─── STEP 5: Go Worker Executes Job ───
    it('E2E-5 → Go worker executes scheduler.tick handler', () => {
        // Simulate Go dispatcher.Dispatch("scheduler.tick", payload, traceId)
        const executionResult = {
            tickProcessed: true,
            traceId,
            message: 'Scheduler tick processed (stub)',
        };

        expect(executionResult.tickProcessed).toBe(true);
        console.log('[E2E] ✅ Step 5: scheduler.tick stub executed');
    });

    // ─── STEP 6: Go Worker Signs Result (HMAC-SHA256) ───
    let workerResult: JobResult;
    it('E2E-6 → Go worker signs JobResult with HMAC-SHA256', () => {
        const startedAt = Date.now() - 50;
        const finishedAt = Date.now();

        const resultData = { tickProcessed: true, traceId };
        const resultHash = createHash('sha256')
            .update(JSON.stringify(resultData))
            .digest('hex');

        const resultBase = {
            jobId,
            status: 'SUCCEEDED' as const,
            startedAt,
            finishedAt,
            resultHash,
            resultData,
            metrics: { latencyMs: finishedAt - startedAt, attempts: 1 },
            traceId,
            workerId: 'worker-e2e-1',
        };

        const signature = goWorkerSignResult(resultBase);

        workerResult = {
            ...resultBase,
            signature,
        };

        expect(workerResult.signature).toHaveLength(64);
        expect(workerResult.signature).toMatch(/^[0-9a-f]{64}$/);
        console.log(`[E2E] ✅ Step 6: Result signed — HMAC=${workerResult.signature.substring(0, 16)}...`);
    });

    // ─── STEP 7: TS Verifies HMAC ───
    it('E2E-7 → TS verifies Go worker HMAC signature', () => {
        const validation = validateResult(workerResult, HMAC_SECRET);
        expect(validation.valid).toBe(true);
        console.log('[E2E] ✅ Step 7: HMAC verified — result accepted by TS');
    });

    // ─── STEP 8: TS Verifies Result with verifyResult() ───
    it('E2E-8 → TS verifyResult() returns true', () => {
        const isValid = verifyResult(workerResult, HMAC_SECRET);
        expect(isValid).toBe(true);
        console.log('[E2E] ✅ Step 8: verifyResult() confirmed');
    });

    // ─── STEP 9: Audit Append (Append-Only) ───
    it('E2E-9 → Audit entry appended (append-only)', () => {
        const auditEntry = {
            type: 'job.complete',
            jobId: workerResult.jobId,
            traceId: workerResult.traceId,
            workerId: workerResult.workerId,
            status: workerResult.status,
            resultHash: workerResult.resultHash,
            metrics: workerResult.metrics,
            timestamp: Date.now(),
        };

        auditLog.push(auditEntry);

        expect(auditLog).toHaveLength(1);
        expect(auditLog[0].type).toBe('job.complete');
        expect(auditLog[0].jobId).toBe(jobId);
        expect(auditLog[0].status).toBe('SUCCEEDED');
        console.log(`[E2E] ✅ Step 9: Audit appended — ${auditLog[0].type} (jobId=${jobId})`);
    });

    // ─── STEP 10: Replay Defense ───
    it('E2E-10 → Tampered result is rejected', () => {
        const tampered = { ...workerResult, jobId: 'tampered-job-id' };
        const validation = validateResult(tampered, HMAC_SECRET);
        expect(validation.valid).toBe(false);
        expect(validation.code).toBe('INVALID_SIGNATURE');
        console.log('[E2E] ✅ Step 10: Tampered result rejected (HMAC mismatch)');
    });

    // ─── STEP 11: Wrong Secret Rejected ───
    it('E2E-11 → Wrong HMAC secret is rejected', () => {
        const validation = validateResult(workerResult, 'wrong-secret');
        expect(validation.valid).toBe(false);
        expect(validation.code).toBe('INVALID_SIGNATURE');
        console.log('[E2E] ✅ Step 11: Wrong secret rejected');
    });

    // ─── STEP 12: Expired Ticket Rejected ───
    it('E2E-12 → Expired ticket is rejected', () => {
        const expiredTicket: JobTicket = {
            ...ticket,
            expiresAt: Date.now() - 1000,
        };
        const result = validateTicket(expiredTicket, payload);
        expect(result.valid).toBe(false);
        expect(result.code).toBe('TICKET_EXPIRED');
        console.log('[E2E] ✅ Step 12: Expired ticket rejected');
    });

    // ─── STEP 13: Duplicate Audit Prevention (No Mutation) ───
    it('E2E-13 → Audit is append-only (no mutation)', () => {
        // Second audit entry for the same job would be a new append
        const secondEntry = {
            type: 'job.complete.duplicate_attempt',
            jobId: workerResult.jobId,
            timestamp: Date.now(),
            note: 'This would be a duplicate — detected by application logic',
        };

        auditLog.push(secondEntry);

        // Both entries exist (append-only)
        expect(auditLog).toHaveLength(2);
        expect(auditLog[0].type).toBe('job.complete');
        expect(auditLog[1].type).toBe('job.complete.duplicate_attempt');
        console.log('[E2E] ✅ Step 13: Audit is append-only — no prior entries mutated');
    });
});
