/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CORE OS — Redaction Layer Tests (Phase 32.3)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Validates role-based redaction:
 *   - owner sees full envelope
 *   - admin sees sanitized (signatures masked)
 *   - user sees restricted (sensitive removed/masked, actor hashed)
 *   - system sees minimal (structural only)
 *   - edge cases: unknown role, null context, empty context
 *
 * @module coreos/audit/redaction.test
 */

import { describe, it, expect } from 'vitest';
import {
    redactAuditEvent,
    getRedactedAuditEvent,
    hashValue,
    SENSITIVE_FIELDS,
    type RedactionRole,
} from './redaction';
import {
    AUDIT_EVENTS,
    AUDIT_VERSION,
    createAuditEnvelope,
    type AuditEventEnvelope,
} from './taxonomy';

// ═══════════════════════════════════════════════════════════════════════════
// FIXTURES
// ═══════════════════════════════════════════════════════════════════════════

/** Full envelope with all sensitive fields for testing */
function createTestEnvelope(): AuditEventEnvelope {
    return createAuditEnvelope(AUDIT_EVENTS.JOB_COMPLETED, {
        traceId: 'trace-redaction-test',
        severity: 'INFO',
        actor: { type: 'worker', id: 'worker-go-001' },
        context: {
            jobId: 'j-001',
            jobType: 'email',
            signature: 'hmac-sha256-abc123def456',
            signatureBypass: false,
            receivedSigPrefix: 'hmac-sha256-abc1',
            expectedSigPrefix: 'hmac-sha256-abc1',
            workerId: 'worker-go-001',
            payload: { to: 'user@example.com', subject: 'Hello' },
            policyReason: 'internal: rate limit exceeded for tier-free',
            error: { code: 'TIMEOUT', message: 'Connection timed out to smtp.example.com' },
            durationMs: 1234,
            attempt: 1,
            maxAttempts: 3,
        },
    });
}

/** Minimal envelope (no context, no actor) */
function createMinimalEnvelope(): AuditEventEnvelope {
    return createAuditEnvelope(AUDIT_EVENTS.SYSTEM_HEALTH_CHECK, {
        traceId: 'trace-minimal',
        severity: 'INFO',
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// T1: OWNER — Full Visibility
// ═══════════════════════════════════════════════════════════════════════════

describe('T1: Owner — Full Visibility', () => {
    it('T1a — owner sees ALL fields unchanged', () => {
        const envelope = createTestEnvelope();
        const redacted = redactAuditEvent(envelope, 'owner');

        // Structural
        expect(redacted.version).toBe(AUDIT_VERSION);
        expect(redacted.event).toBe(AUDIT_EVENTS.JOB_COMPLETED);
        expect(redacted.traceId).toBe('trace-redaction-test');
        expect(redacted.severity).toBe('INFO');

        // Actor untouched
        expect(redacted.actor).toEqual({ type: 'worker', id: 'worker-go-001' });

        // Context — all sensitive fields visible
        expect(redacted.context?.signature).toBe('hmac-sha256-abc123def456');
        expect(redacted.context?.workerId).toBe('worker-go-001');
        expect(redacted.context?.payload).toEqual({ to: 'user@example.com', subject: 'Hello' });
        expect(redacted.context?.policyReason).toBe('internal: rate limit exceeded for tier-free');
        expect(redacted.context?.error).toEqual({ code: 'TIMEOUT', message: 'Connection timed out to smtp.example.com' });
    });

    it('T1b — owner redaction returns a copy (not the same reference)', () => {
        const envelope = createTestEnvelope();
        const redacted = redactAuditEvent(envelope, 'owner');

        expect(redacted).not.toBe(envelope);
        expect(redacted).toEqual(envelope);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// T2: ADMIN — Sanitized
// ═══════════════════════════════════════════════════════════════════════════

describe('T2: Admin — Sanitized', () => {
    it('T2a — admin sees signature fields masked', () => {
        const redacted = redactAuditEvent(createTestEnvelope(), 'admin');

        expect(redacted.context?.signature).toBe('***');
        expect(redacted.context?.signatureBypass).toBe('***');
        expect(redacted.context?.receivedSigPrefix).toBe('***');
        expect(redacted.context?.expectedSigPrefix).toBe('***');
    });

    it('T2b — admin sees workerId, payload, error visible', () => {
        const redacted = redactAuditEvent(createTestEnvelope(), 'admin');

        expect(redacted.context?.workerId).toBe('worker-go-001');
        expect(redacted.context?.payload).toEqual({ to: 'user@example.com', subject: 'Hello' });
        expect(redacted.context?.error).toEqual({ code: 'TIMEOUT', message: 'Connection timed out to smtp.example.com' });
    });

    it('T2c — admin sees actor untouched', () => {
        const redacted = redactAuditEvent(createTestEnvelope(), 'admin');

        expect(redacted.actor).toEqual({ type: 'worker', id: 'worker-go-001' });
    });

    it('T2d — admin sees non-sensitive fields untouched', () => {
        const redacted = redactAuditEvent(createTestEnvelope(), 'admin');

        expect(redacted.context?.jobId).toBe('j-001');
        expect(redacted.context?.jobType).toBe('email');
        expect(redacted.context?.durationMs).toBe(1234);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// T3: USER — Restricted
// ═══════════════════════════════════════════════════════════════════════════

describe('T3: User — Restricted', () => {
    it('T3a — user sees signature removed entirely', () => {
        const redacted = redactAuditEvent(createTestEnvelope(), 'user');

        expect(redacted.context?.signature).toBeUndefined();
        expect(redacted.context?.signatureBypass).toBeUndefined();
        expect(redacted.context?.receivedSigPrefix).toBeUndefined();
        expect(redacted.context?.expectedSigPrefix).toBeUndefined();
    });

    it('T3b — user sees workerId masked', () => {
        const redacted = redactAuditEvent(createTestEnvelope(), 'user');

        expect(redacted.context?.workerId).toBe('***');
    });

    it('T3c — user sees payload and policyReason removed', () => {
        const redacted = redactAuditEvent(createTestEnvelope(), 'user');

        expect(redacted.context?.payload).toBeUndefined();
        expect(redacted.context?.policyReason).toBeUndefined();
    });

    it('T3d — user sees error masked', () => {
        const redacted = redactAuditEvent(createTestEnvelope(), 'user');

        expect(redacted.context?.error).toBe('***');
    });

    it('T3e — user sees actor.id hashed', () => {
        const redacted = redactAuditEvent(createTestEnvelope(), 'user');

        expect(redacted.actor).toBeDefined();
        expect(redacted.actor?.type).toBe('worker');
        expect(redacted.actor?.id).toBe(hashValue('worker-go-001'));
        expect(redacted.actor?.id).toHaveLength(8);
    });

    it('T3f — user still sees non-sensitive context fields', () => {
        const redacted = redactAuditEvent(createTestEnvelope(), 'user');

        expect(redacted.context?.jobId).toBe('j-001');
        expect(redacted.context?.jobType).toBe('email');
        expect(redacted.context?.durationMs).toBe(1234);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// T4: SYSTEM — Minimal
// ═══════════════════════════════════════════════════════════════════════════

describe('T4: System — Minimal', () => {
    it('T4a — system sees structural fields preserved', () => {
        const redacted = redactAuditEvent(createTestEnvelope(), 'system');

        expect(redacted.version).toBe(AUDIT_VERSION);
        expect(redacted.event).toBe(AUDIT_EVENTS.JOB_COMPLETED);
        expect(redacted.traceId).toBe('trace-redaction-test');
        expect(typeof redacted.timestamp).toBe('number');
        expect(redacted.severity).toBe('INFO');
    });

    it('T4b — system sees signature and error removed', () => {
        const redacted = redactAuditEvent(createTestEnvelope(), 'system');

        expect(redacted.context?.signature).toBeUndefined();
        expect(redacted.context?.signatureBypass).toBeUndefined();
        expect(redacted.context?.error).toBeUndefined();
    });

    it('T4c — system sees payload and policyReason removed', () => {
        const redacted = redactAuditEvent(createTestEnvelope(), 'system');

        expect(redacted.context?.payload).toBeUndefined();
        expect(redacted.context?.policyReason).toBeUndefined();
    });

    it('T4d — system sees actor removed', () => {
        const redacted = redactAuditEvent(createTestEnvelope(), 'system');

        expect(redacted.actor).toBeUndefined();
    });

    it('T4e — system still sees workerId (visible per policy)', () => {
        const redacted = redactAuditEvent(createTestEnvelope(), 'system');

        expect(redacted.context?.workerId).toBe('worker-go-001');
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// T5: Hash Determinism & Masking
// ═══════════════════════════════════════════════════════════════════════════

describe('T5: Hash Determinism & Masking', () => {
    it('T5a — hashValue is deterministic (same input → same output)', () => {
        const h1 = hashValue('worker-go-001');
        const h2 = hashValue('worker-go-001');

        expect(h1).toBe(h2);
    });

    it('T5b — hashValue produces 8-char hex string', () => {
        const h = hashValue('test-value');

        expect(h).toHaveLength(8);
        expect(h).toMatch(/^[0-9a-f]{8}$/);
    });

    it('T5c — different inputs produce different hashes', () => {
        const h1 = hashValue('worker-001');
        const h2 = hashValue('worker-002');

        expect(h1).not.toBe(h2);
    });

    it('T5d — masked fields show exactly "***"', () => {
        const redacted = redactAuditEvent(createTestEnvelope(), 'admin');

        expect(redacted.context?.signature).toBe('***');
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// T6: Edge Cases
// ═══════════════════════════════════════════════════════════════════════════

describe('T6: Edge Cases', () => {
    it('T6a — unknown role defaults to system (most restrictive)', () => {
        const redacted = redactAuditEvent(
            createTestEnvelope(),
            'hacker' as RedactionRole,
        );
        const systemRedacted = redactAuditEvent(createTestEnvelope(), 'system');

        expect(redacted).toEqual(systemRedacted);
    });

    it('T6b — envelope without context handled gracefully', () => {
        const redacted = redactAuditEvent(createMinimalEnvelope(), 'user');

        expect(redacted.context).toBeUndefined();
        expect(redacted.actor).toBeUndefined();
        expect(redacted.event).toBe(AUDIT_EVENTS.SYSTEM_HEALTH_CHECK);
    });

    it('T6c — envelope without actor handled gracefully', () => {
        const envelope = createAuditEnvelope(AUDIT_EVENTS.JOB_ENQUEUED, {
            traceId: 'trace-no-actor',
            severity: 'INFO',
            context: { jobId: 'j-002' },
        });
        const redacted = redactAuditEvent(envelope, 'user');

        expect(redacted.actor).toBeUndefined();
        expect(redacted.context?.jobId).toBe('j-002');
    });

    it('T6d — structural fields NEVER redacted regardless of role', () => {
        const roles: RedactionRole[] = ['owner', 'admin', 'user', 'system'];
        const envelope = createTestEnvelope();

        for (const role of roles) {
            const redacted = redactAuditEvent(envelope, role);
            expect(redacted.version).toBe(AUDIT_VERSION);
            expect(redacted.event).toBe(AUDIT_EVENTS.JOB_COMPLETED);
            expect(redacted.traceId).toBe('trace-redaction-test');
            expect(typeof redacted.timestamp).toBe('number');
            expect(redacted.severity).toBe('INFO');
        }
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// T7: Integration Hook
// ═══════════════════════════════════════════════════════════════════════════

describe('T7: Integration Hook', () => {
    it('T7a — getRedactedAuditEvent produces same result as redactAuditEvent', () => {
        const envelope = createTestEnvelope();
        const direct = redactAuditEvent(envelope, 'user');
        const hook = getRedactedAuditEvent(envelope, 'user');

        expect(hook).toEqual(direct);
    });

    it('T7b — getRedactedAuditEvent works for all roles', () => {
        const roles: RedactionRole[] = ['owner', 'admin', 'user', 'system'];
        const envelope = createTestEnvelope();

        for (const role of roles) {
            const redacted = getRedactedAuditEvent(envelope, role);
            expect(redacted.traceId).toBe('trace-redaction-test');
        }
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// T8: Policy Coverage
// ═══════════════════════════════════════════════════════════════════════════

describe('T8: Policy Coverage', () => {
    it('T8a — SENSITIVE_FIELDS has at least 6 entries', () => {
        expect(SENSITIVE_FIELDS.length).toBeGreaterThanOrEqual(6);
    });

    it('T8b — every policy has all 4 roles defined', () => {
        for (const policy of SENSITIVE_FIELDS) {
            expect(policy.owner).toBeDefined();
            expect(policy.admin).toBeDefined();
            expect(policy.user).toBeDefined();
            expect(policy.system).toBeDefined();
        }
    });

    it('T8c — owner is always "visible" (full access)', () => {
        for (const policy of SENSITIVE_FIELDS) {
            expect(policy.owner).toBe('visible');
        }
    });
});
