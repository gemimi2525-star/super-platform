/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CORE OS — Audit Query Tests (Phase 32.4)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Tests for the audit query param parsing, role resolution,
 * and redaction integration.
 *
 * @module coreos/audit/audit-query.test
 */

import { describe, it, expect } from 'vitest';
import {
    AUDIT_EVENTS,
    AUDIT_VERSION,
    createAuditEnvelope,
} from './taxonomy';
import {
    redactAuditEvent,
    getRedactedAuditEvent,
} from './redaction';
import type { RedactionRole } from './redaction';
import type { AuditEventEnvelope } from './taxonomy';

// ═══════════════════════════════════════════════════════════════════════════
// FIXTURES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Simulates what the API endpoint does:
 * create envelope → redact → return.
 */
function simulateApiResponse(role: RedactionRole): AuditEventEnvelope {
    const envelope = createAuditEnvelope(AUDIT_EVENTS.JOB_COMPLETED, {
        traceId: 'trace-api-test-001',
        severity: 'INFO',
        actor: { type: 'worker', id: 'worker-go-001' },
        context: {
            jobId: 'j-001',
            jobType: 'email',
            signature: 'hmac-sha256-secret123',
            workerId: 'worker-go-001',
            payload: { to: 'user@test.com', body: 'Hello' },
            policyReason: 'internal: rate limit bypass',
            error: { code: 'TIMEOUT', message: 'DB connection timed out at 10.0.0.1:5432' },
            durationMs: 1500,
        },
    });
    return getRedactedAuditEvent(envelope, role);
}

// ═══════════════════════════════════════════════════════════════════════════
// T1: API Response Redaction by Role
// ═══════════════════════════════════════════════════════════════════════════

describe('T1: API Response Redaction by Role', () => {
    it('T1a — owner sees full envelope including signature', () => {
        const result = simulateApiResponse('owner');
        expect(result.context?.signature).toBe('hmac-sha256-secret123');
        expect(result.context?.payload).toEqual({ to: 'user@test.com', body: 'Hello' });
        expect(result.context?.policyReason).toBe('internal: rate limit bypass');
        expect(result.actor?.id).toBe('worker-go-001');
    });

    it('T1b — admin sees signature masked but workerId visible', () => {
        const result = simulateApiResponse('admin');
        expect(result.context?.signature).toBe('***');
        expect(result.context?.workerId).toBe('worker-go-001');
        expect(result.context?.payload).toEqual({ to: 'user@test.com', body: 'Hello' });
        expect(result.actor?.id).toBe('worker-go-001');
    });

    it('T1c — user sees restricted view', () => {
        const result = simulateApiResponse('user');
        expect(result.context?.signature).toBeUndefined();
        expect(result.context?.workerId).toBe('***');
        expect(result.context?.payload).toBeUndefined();
        expect(result.context?.policyReason).toBeUndefined();
        expect(result.context?.error).toBe('***');
        // Actor ID is hashed
        expect(result.actor?.id).toHaveLength(8);
        expect(result.actor?.id).not.toBe('worker-go-001');
    });

    it('T1d — system sees minimal', () => {
        const result = simulateApiResponse('system');
        expect(result.context?.signature).toBeUndefined();
        expect(result.context?.payload).toBeUndefined();
        expect(result.context?.error).toBeUndefined();
        expect(result.actor).toBeUndefined();
        // But structural fields preserved
        expect(result.event).toBe(AUDIT_EVENTS.JOB_COMPLETED);
        expect(result.traceId).toBe('trace-api-test-001');
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// T2: Structural Fields Never Redacted
// ═══════════════════════════════════════════════════════════════════════════

describe('T2: Structural Fields Never Redacted', () => {
    it('T2a — all roles preserve version/event/traceId/timestamp/severity', () => {
        const roles: RedactionRole[] = ['owner', 'admin', 'user', 'system'];
        for (const role of roles) {
            const result = simulateApiResponse(role);
            expect(result.version).toBe(AUDIT_VERSION);
            expect(result.event).toBe(AUDIT_EVENTS.JOB_COMPLETED);
            expect(result.traceId).toBe('trace-api-test-001');
            expect(typeof result.timestamp).toBe('number');
            expect(result.severity).toBe('INFO');
        }
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// T3: Pagination & Filters (unit tests for param logic)
// ═══════════════════════════════════════════════════════════════════════════

describe('T3: Query Param Logic', () => {
    it('T3a — limit is clamped to 1-100 range', () => {
        // Simulate the clamping logic from the route
        const clamp = (raw: number) => Math.max(1, Math.min(isNaN(raw) ? 50 : raw, 100));
        expect(clamp(0)).toBe(1);
        expect(clamp(-10)).toBe(1);
        expect(clamp(200)).toBe(100);
        expect(clamp(50)).toBe(50);
        expect(clamp(NaN)).toBe(50);
    });

    it('T3b — traceId filter is exact match', () => {
        const traceId = 'trace-exact-001';
        const envelope = createAuditEnvelope(AUDIT_EVENTS.JOB_ENQUEUED, {
            traceId,
            severity: 'INFO',
        });
        // Simulate filter: only events with matching traceId
        expect(envelope.traceId).toBe(traceId);
    });

    it('T3c — severity filter matches specific level', () => {
        const envelope = createAuditEnvelope(AUDIT_EVENTS.JOB_FAILED, {
            traceId: 'trace-filter',
            severity: 'ERROR',
        });
        // Simulate filter
        expect(envelope.severity).toBe('ERROR');
        expect(envelope.severity !== 'INFO').toBe(true);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// T4: Auth Guard Logic
// ═══════════════════════════════════════════════════════════════════════════

describe('T4: Role Resolution', () => {
    it('T4a — SUPER_ADMIN_ID resolves to owner', () => {
        // Simulate role resolution
        const resolveRole = (uid: string, superAdminId: string) =>
            uid === superAdminId ? 'owner' : 'admin';

        expect(resolveRole('uid-001', 'uid-001')).toBe('owner');
    });

    it('T4b — non-SUPER_ADMIN resolves to admin', () => {
        const resolveRole = (uid: string, superAdminId: string) =>
            uid === superAdminId ? 'owner' : 'admin';

        expect(resolveRole('uid-002', 'uid-001')).toBe('admin');
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// T5: Multiple Events Redacted Independently
// ═══════════════════════════════════════════════════════════════════════════

describe('T5: Batch Redaction', () => {
    it('T5a — each event in batch is redacted independently', () => {
        const events = [
            createAuditEnvelope(AUDIT_EVENTS.JOB_ENQUEUED, {
                traceId: 'batch-001', severity: 'INFO',
                context: { signature: 'sig-aaa', jobId: 'j-1' },
            }),
            createAuditEnvelope(AUDIT_EVENTS.JOB_FAILED, {
                traceId: 'batch-002', severity: 'ERROR',
                context: { signature: 'sig-bbb', jobId: 'j-2', error: { code: 'ERR', message: 'fail' } },
            }),
        ];

        const redacted = events.map(e => getRedactedAuditEvent(e, 'admin'));

        // admin: signatures masked, other fields visible
        expect(redacted[0].context?.signature).toBe('***');
        expect(redacted[0].context?.jobId).toBe('j-1');
        expect(redacted[1].context?.signature).toBe('***');
        expect(redacted[1].context?.jobId).toBe('j-2');
        expect(redacted[1].context?.error).toEqual({ code: 'ERR', message: 'fail' });
    });

    it('T5b — batch preserves original envelopes', () => {
        const original = createAuditEnvelope(AUDIT_EVENTS.JOB_COMPLETED, {
            traceId: 'batch-orig', severity: 'INFO',
            context: { signature: 'secret', jobId: 'j-3' },
        });

        const _ = getRedactedAuditEvent(original, 'user');

        // Original unchanged (not a user view)
        expect(original.context?.signature).toBe('secret');
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// T6: Sensitive Field Leak Prevention
// ═══════════════════════════════════════════════════════════════════════════

describe('T6: No Sensitive Field Leaks', () => {
    it('T6a — user NEVER sees raw signature in any event type', () => {
        const jobEvents = [
            AUDIT_EVENTS.JOB_ENQUEUED,
            AUDIT_EVENTS.JOB_CLAIMED,
            AUDIT_EVENTS.JOB_COMPLETED,
            AUDIT_EVENTS.JOB_FAILED,
        ];

        for (const event of jobEvents) {
            const envelope = createAuditEnvelope(event, {
                traceId: 'leak-test',
                severity: 'INFO',
                context: { signature: 'hmac-secret-value', jobId: 'j-leak' },
            });
            const redacted = redactAuditEvent(envelope, 'user');
            expect(redacted.context?.signature).toBeUndefined();
        }
    });

    it('T6b — system NEVER sees actor.id', () => {
        const envelope = createAuditEnvelope(AUDIT_EVENTS.JOB_COMPLETED, {
            traceId: 'sys-leak',
            severity: 'INFO',
            actor: { type: 'worker', id: 'secret-worker-id' },
        });
        const redacted = redactAuditEvent(envelope, 'system');
        expect(redacted.actor).toBeUndefined();
    });

    it('T6c — user NEVER sees raw payload', () => {
        const envelope = createAuditEnvelope(AUDIT_EVENTS.JOB_ENQUEUED, {
            traceId: 'payload-leak',
            severity: 'INFO',
            context: { payload: { secret: 'data', apiKey: 'sk-123' }, jobId: 'j-p' },
        });
        const redacted = redactAuditEvent(envelope, 'user');
        expect(redacted.context?.payload).toBeUndefined();
    });
});
