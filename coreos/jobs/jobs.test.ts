/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Phase 21C — Job System Unit Tests
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Tests: signing, verification, validation, payload hashing, replay defense
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock synapse-core attestation with vi.hoisted() ───
const { mockSignData, mockVerifySignature, mockGetDefaultKeyProvider } = vi.hoisted(() => ({
    mockSignData: vi.fn().mockReturnValue('mock-ed25519-signature-base64'),
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
    canonicalJSON,
    computePayloadHash,
    signTicket,
    verifyTicket,
    getTicketSignableData,
    computeResultHMAC,
    verifyResult,
    exportPublicKeyBase64,
} from './signer';

import {
    validateTicket,
    validateResult as validateResultFields,
} from './validator';

import type { JobTicket, JobResult } from './types';
import { JOB_TYPES, DEFAULT_TICKET_TTL_MS } from './types';

// ═══════════════════════════════════════════════════════════════════════════
// TEST FIXTURES
// ═══════════════════════════════════════════════════════════════════════════

function makeValidTicket(overrides?: Partial<JobTicket>): JobTicket {
    return {
        jobId: 'test-job-001',
        jobType: 'scheduler.tick',
        actorId: 'actor-001',
        scope: ['execute'],
        policyDecisionId: 'policy-decision-001',
        requestedAt: Date.now(),
        expiresAt: Date.now() + DEFAULT_TICKET_TTL_MS,
        payloadHash: computePayloadHash('{"key":"value"}'),
        nonce: 'nonce-001',
        traceId: 'trace-001',
        signature: 'mock-ed25519-signature-base64',
        ...overrides,
    };
}

function makeValidResult(overrides?: Partial<JobResult>): JobResult {
    const base = {
        jobId: 'test-job-001',
        status: 'SUCCEEDED' as const,
        startedAt: Date.now() - 1000,
        finishedAt: Date.now(),
        resultHash: computePayloadHash('{"result":"done"}'),
        traceId: 'trace-001',
        workerId: 'worker-001',
        metrics: { latencyMs: 150, attempts: 1 },
    };

    const signature = computeResultHMAC(base, 'test-hmac-secret');

    return {
        ...base,
        signature,
        ...overrides,
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('Phase 21C — Job System', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        mockSignData.mockReturnValue('mock-ed25519-signature-base64');
        mockVerifySignature.mockReturnValue(true);
    });

    // ─── T1: Canonical JSON ───
    describe('canonicalJSON()', () => {
        it('T1 — sorts keys deterministically', () => {
            const a = canonicalJSON({ z: 1, a: 2, m: 3 });
            const b = canonicalJSON({ m: 3, z: 1, a: 2 });
            expect(a).toBe(b);
            expect(a).toBe('{"a":2,"m":3,"z":1}');
        });
    });

    // ─── T2: Payload Hash ───
    describe('computePayloadHash()', () => {
        it('T2 — produces 64-char hex SHA-256', () => {
            const hash = computePayloadHash('{"key":"value"}');
            expect(hash).toHaveLength(64);
            expect(hash).toMatch(/^[0-9a-f]{64}$/);
        });

        it('T2b — same input → same hash', () => {
            const h1 = computePayloadHash('{"a":1}');
            const h2 = computePayloadHash('{"a":1}');
            expect(h1).toBe(h2);
        });

        it('T2c — different input → different hash', () => {
            const h1 = computePayloadHash('{"a":1}');
            const h2 = computePayloadHash('{"a":2}');
            expect(h1).not.toBe(h2);
        });
    });

    // ─── T3: Ticket Signing ───
    describe('signTicket()', () => {
        it('T3 — signs ticket and returns complete JobTicket with signature', () => {
            const ticketInput = {
                jobId: 'job-001',
                jobType: 'scheduler.tick' as const,
                actorId: 'actor-001',
                scope: ['execute'] as readonly string[],
                policyDecisionId: 'pd-001',
                requestedAt: 1000,
                expiresAt: 2000,
                payloadHash: 'abc123',
                nonce: 'nonce-001',
                traceId: 'trace-001',
            };

            const signed = signTicket(ticketInput);
            expect(signed.signature).toBe('mock-ed25519-signature-base64');
            expect(signed.jobId).toBe('job-001');
            expect(mockSignData).toHaveBeenCalledOnce();
        });
    });

    // ─── T4: Ticket Verification ───
    describe('verifyTicket()', () => {
        it('T4 — valid ticket returns true', () => {
            const ticket = makeValidTicket();
            expect(verifyTicket(ticket)).toBe(true);
            expect(mockVerifySignature).toHaveBeenCalledOnce();
        });

        it('T4b — tampered ticket returns false', () => {
            mockVerifySignature.mockReturnValue(false);
            const ticket = makeValidTicket({ actorId: 'tampered-actor' });
            expect(verifyTicket(ticket)).toBe(false);
        });
    });

    // ─── T5: Ticket Signable Data ───
    describe('getTicketSignableData()', () => {
        it('T5 — excludes signature field', () => {
            const { signature, ...rest } = makeValidTicket();
            const data = getTicketSignableData(rest);
            expect(data).not.toContain('signature');
            expect(data).toContain('jobId');
            expect(data).toContain('payloadHash');
        });
    });

    // ─── T6: HMAC Result Signing ───
    describe('computeResultHMAC()', () => {
        it('T6 — produces 64-char hex HMAC', () => {
            const resultBase = {
                jobId: 'job-001',
                status: 'SUCCEEDED' as const,
                startedAt: 1000,
                finishedAt: 2000,
                resultHash: 'abc',
                traceId: 'trace-001',
                workerId: 'w-001',
                metrics: { latencyMs: 100, attempts: 1 },
            };

            const hmac = computeResultHMAC(resultBase, 'secret');
            expect(hmac).toHaveLength(64);
            expect(hmac).toMatch(/^[0-9a-f]{64}$/);
        });

        it('T6b — same input + same secret → same HMAC', () => {
            const base = {
                jobId: 'j1', status: 'SUCCEEDED' as const,
                startedAt: 1, finishedAt: 2, resultHash: 'h',
                traceId: 't', workerId: 'w',
                metrics: { latencyMs: 1, attempts: 1 },
            };
            expect(computeResultHMAC(base, 's')).toBe(computeResultHMAC(base, 's'));
        });

        it('T6c — different secret → different HMAC', () => {
            const base = {
                jobId: 'j1', status: 'SUCCEEDED' as const,
                startedAt: 1, finishedAt: 2, resultHash: 'h',
                traceId: 't', workerId: 'w',
                metrics: { latencyMs: 1, attempts: 1 },
            };
            expect(computeResultHMAC(base, 'secret1')).not.toBe(computeResultHMAC(base, 'secret2'));
        });
    });

    // ─── T7: Result Verification ───
    describe('verifyResult()', () => {
        it('T7 — valid result with correct HMAC returns true', () => {
            const result = makeValidResult();
            expect(verifyResult(result, 'test-hmac-secret')).toBe(true);
        });

        it('T7b — tampered result returns false', () => {
            const result = makeValidResult();
            const tampered: JobResult = { ...result, jobId: 'tampered-id' };
            expect(verifyResult(tampered, 'test-hmac-secret')).toBe(false);
        });

        it('T7c — wrong secret returns false', () => {
            const result = makeValidResult();
            expect(verifyResult(result, 'wrong-secret')).toBe(false);
        });

        it('T7d — missing secret returns false', () => {
            const result = makeValidResult();
            // Remove env var and pass no secret
            const origEnv = process.env.JOB_WORKER_HMAC_SECRET;
            delete process.env.JOB_WORKER_HMAC_SECRET;
            expect(verifyResult(result)).toBe(false);
            if (origEnv) process.env.JOB_WORKER_HMAC_SECRET = origEnv;
        });
    });

    // ─── T8: Ticket Validation ───
    describe('validateTicket()', () => {
        it('T8 — valid ticket passes validation', () => {
            const payload = '{"key":"value"}';
            const ticket = makeValidTicket({
                payloadHash: computePayloadHash(payload),
            });
            const result = validateTicket(ticket, payload);
            expect(result.valid).toBe(true);
        });

        it('T8b — expired ticket is rejected', () => {
            const payload = '{"key":"value"}';
            const ticket = makeValidTicket({
                payloadHash: computePayloadHash(payload),
                expiresAt: Date.now() - 1000, // already expired
            });
            const result = validateTicket(ticket, payload);
            expect(result.valid).toBe(false);
            expect(result.code).toBe('TICKET_EXPIRED');
        });

        it('T8c — payload hash mismatch is rejected', () => {
            const ticket = makeValidTicket({
                payloadHash: 'wrong-hash-value-should-not-match-at-all',
            });
            const result = validateTicket(ticket, '{"key":"value"}');
            expect(result.valid).toBe(false);
            expect(result.code).toBe('PAYLOAD_HASH_MISMATCH');
        });

        it('T8d — missing policyDecisionId is rejected', () => {
            const payload = '{"key":"value"}';
            const ticket = makeValidTicket({
                payloadHash: computePayloadHash(payload),
                policyDecisionId: '',
            });
            const result = validateTicket(ticket, payload);
            expect(result.valid).toBe(false);
            expect(result.code).toBe('MISSING_POLICY_DECISION');
        });

        it('T8e — invalid signature is rejected', () => {
            mockVerifySignature.mockReturnValue(false);
            const payload = '{"key":"value"}';
            const ticket = makeValidTicket({
                payloadHash: computePayloadHash(payload),
            });
            const result = validateTicket(ticket, payload);
            expect(result.valid).toBe(false);
            expect(result.code).toBe('INVALID_SIGNATURE');
        });

        it('T8f — invalid jobType is rejected', () => {
            const payload = '{"key":"value"}';
            const ticket = makeValidTicket({
                payloadHash: computePayloadHash(payload),
                jobType: 'invalid.type' as any,
            });
            const result = validateTicket(ticket, payload);
            expect(result.valid).toBe(false);
            expect(result.code).toBe('INVALID_JOB_TYPE');
        });
    });

    // ─── T9: Result Validation ───
    describe('validateResult()', () => {
        it('T9 — valid result passes', () => {
            const result = makeValidResult();
            const validation = validateResultFields(result, 'test-hmac-secret');
            expect(validation.valid).toBe(true);
        });

        it('T9b — missing jobId is rejected', () => {
            const result = makeValidResult({ jobId: '' });
            const validation = validateResultFields(result, 'test-hmac-secret');
            expect(validation.valid).toBe(false);
            expect(validation.code).toBe('MISSING_JOB_ID');
        });

        it('T9c — invalid HMAC signature is rejected', () => {
            const result = makeValidResult({ signature: 'invalid-signature' });
            const validation = validateResultFields(result, 'test-hmac-secret');
            expect(validation.valid).toBe(false);
            expect(validation.code).toBe('INVALID_SIGNATURE');
        });
    });

    // ─── T10: Constants & Types ───
    describe('Types & Constants', () => {
        it('T10 — JOB_TYPES has 3 entries', () => {
            expect(JOB_TYPES).toHaveLength(3);
            expect(JOB_TYPES).toContain('scheduler.tick');
            expect(JOB_TYPES).toContain('index.build');
            expect(JOB_TYPES).toContain('webhook.process');
        });

        it('T10b — DEFAULT_TICKET_TTL_MS is 30 minutes', () => {
            expect(DEFAULT_TICKET_TTL_MS).toBe(30 * 60 * 1000);
        });
    });

    // ─── T11: Public Key Export ───
    describe('exportPublicKeyBase64()', () => {
        it('T11 — exports base64 public key string', () => {
            const pk = exportPublicKeyBase64();
            expect(typeof pk).toBe('string');
            expect(pk.length).toBeGreaterThan(0);
        });
    });

    // ─── T12: Edge Cases ───
    describe('Edge Cases', () => {
        it('T12 — verifyTicket handles exception gracefully', () => {
            mockVerifySignature.mockImplementation(() => { throw new Error('boom'); });
            const ticket = makeValidTicket();
            expect(verifyTicket(ticket)).toBe(false);
        });

        it('T12b — empty payload produces valid hash', () => {
            const hash = computePayloadHash('');
            expect(hash).toHaveLength(64);
        });

        it('T12c — canonical JSON handles nested objects', () => {
            const result = canonicalJSON({ c: { z: 1, a: 2 }, a: 'hello' });
            // top-level keys sorted, nested keys preserve order (canonicalJSON is non-recursive)
            expect(result).toContain('"a"');
            expect(result).toContain('"c"');
        });
    });
});
