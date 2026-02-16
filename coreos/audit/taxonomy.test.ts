/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CORE OS — Audit Taxonomy Tests (Phase 32.1)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Validates the frozen taxonomy: uniqueness, version, naming convention,
 * envelope shape, and group coverage.
 *
 * @module coreos/audit/taxonomy.test
 */

import { describe, it, expect } from 'vitest';
import {
    AUDIT_VERSION,
    AUDIT_EVENTS,
    AUDIT_GROUPS,
    createAuditEnvelope,
    isEventInGroup,
    type AuditEventType,
    type AuditEventEnvelope,
    type AuditSeverity,
} from './taxonomy';

// ═══════════════════════════════════════════════════════════════════════════
// T1: VERSION
// ═══════════════════════════════════════════════════════════════════════════

describe('T1: Taxonomy Version', () => {
    it('T1a — AUDIT_VERSION is 1.0.1', () => {
        expect(AUDIT_VERSION).toBe('1.0.1');
    });

    it('T1b — version follows semver format', () => {
        expect(AUDIT_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// T2: EVENT UNIQUENESS
// ═══════════════════════════════════════════════════════════════════════════

describe('T2: Event Uniqueness', () => {
    const eventValues = Object.values(AUDIT_EVENTS);
    const eventKeys = Object.keys(AUDIT_EVENTS);

    it('T2a — all event values are unique (no duplicates)', () => {
        const uniqueValues = new Set(eventValues);
        expect(uniqueValues.size).toBe(eventValues.length);
    });

    it('T2b — all event keys are unique (no duplicate keys)', () => {
        const uniqueKeys = new Set(eventKeys);
        expect(uniqueKeys.size).toBe(eventKeys.length);
    });

    it('T2c — has at least 40 events', () => {
        expect(eventValues.length).toBeGreaterThanOrEqual(40);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// T3: NAMING CONVENTION
// ═══════════════════════════════════════════════════════════════════════════

describe('T3: Naming Convention', () => {
    const eventValues = Object.values(AUDIT_EVENTS);

    it('T3a — every event follows dotted-path format (group.action or group.category.action)', () => {
        for (const event of eventValues) {
            const parts = event.split('.');
            expect(parts.length).toBeGreaterThanOrEqual(2);
            expect(parts.length).toBeLessThanOrEqual(3);
            for (const part of parts) {
                expect(part.length).toBeGreaterThan(0);
                // Only lowercase letters, digits, and underscores
                expect(part).toMatch(/^[a-z][a-z0-9_]*$/);
            }
        }
    });

    it('T3b — every event starts with a known group prefix', () => {
        const groupPrefixes = AUDIT_GROUPS.map((g) => g + '.');
        for (const event of eventValues) {
            const matchesGroup = groupPrefixes.some((prefix) =>
                event.startsWith(prefix),
            );
            expect(matchesGroup).toBe(true);
        }
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// T4: GROUP COVERAGE
// ═══════════════════════════════════════════════════════════════════════════

describe('T4: Group Coverage', () => {
    const eventValues = Object.values(AUDIT_EVENTS);

    it('T4a — every declared group has at least one event', () => {
        for (const group of AUDIT_GROUPS) {
            const groupEvents = eventValues.filter((e) =>
                e.startsWith(group + '.'),
            );
            expect(groupEvents.length).toBeGreaterThan(0);
        }
    });

    it('T4b — all 9 groups are present', () => {
        expect(AUDIT_GROUPS).toHaveLength(9);
    });

    it('T4c — required groups exist', () => {
        const requiredGroups = [
            'job.lifecycle',
            'job.ops',
            'worker',
            'auth',
            'policy',
            'governance',
            'system',
            'security',
            'brain',
        ];
        for (const g of requiredGroups) {
            expect(AUDIT_GROUPS).toContain(g);
        }
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// T5: AUDIT EVENT ENVELOPE
// ═══════════════════════════════════════════════════════════════════════════

describe('T5: AuditEventEnvelope', () => {
    it('T5a — createAuditEnvelope produces valid envelope', () => {
        const envelope = createAuditEnvelope(AUDIT_EVENTS.JOB_ENQUEUED, {
            traceId: 'trace-001',
            severity: 'INFO',
            actor: { type: 'system', id: 'job-queue' },
            context: { jobId: 'j-123', jobType: 'email' },
        });

        expect(envelope.version).toBe(AUDIT_VERSION);
        expect(envelope.event).toBe('job.lifecycle.enqueued');
        expect(envelope.traceId).toBe('trace-001');
        expect(typeof envelope.timestamp).toBe('number');
        expect(envelope.severity).toBe('INFO');
        expect(envelope.actor).toEqual({ type: 'system', id: 'job-queue' });
        expect(envelope.context).toEqual({
            jobId: 'j-123',
            jobType: 'email',
        });
    });

    it('T5b — envelope without optional fields is valid', () => {
        const envelope = createAuditEnvelope(
            AUDIT_EVENTS.SYSTEM_HEALTH_CHECK,
            {
                traceId: 'trace-002',
                severity: 'INFO',
            },
        );

        expect(envelope.version).toBe(AUDIT_VERSION);
        expect(envelope.event).toBe('system.health_check');
        expect(envelope.actor).toBeUndefined();
        expect(envelope.context).toBeUndefined();
    });

    it('T5c — envelope allows custom timestamp', () => {
        const ts = 1700000000000;
        const envelope = createAuditEnvelope(AUDIT_EVENTS.AUTH_LOGIN, {
            traceId: 'trace-003',
            severity: 'INFO',
            timestamp: ts,
        });

        expect(envelope.timestamp).toBe(ts);
    });

    it('T5d — all severity levels are valid', () => {
        const severities: AuditSeverity[] = [
            'INFO',
            'WARN',
            'ERROR',
            'CRITICAL',
        ];
        for (const severity of severities) {
            const envelope = createAuditEnvelope(AUDIT_EVENTS.SYSTEM_STARTUP, {
                traceId: 'trace-sev',
                severity,
            });
            expect(envelope.severity).toBe(severity);
        }
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// T6: GROUP UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

describe('T6: Group Utilities', () => {
    it('T6a — isEventInGroup correctly identifies group membership', () => {
        expect(isEventInGroup('job.lifecycle.enqueued', 'job.lifecycle')).toBe(
            true,
        );
        expect(isEventInGroup('auth.login', 'auth')).toBe(true);
        expect(isEventInGroup('brain.proposal_created', 'brain')).toBe(true);
    });

    it('T6b — isEventInGroup rejects wrong group', () => {
        expect(isEventInGroup('job.lifecycle.enqueued', 'auth')).toBe(false);
        expect(isEventInGroup('auth.login', 'brain')).toBe(false);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// T7: JOBS BACKWARD COMPATIBILITY
// ═══════════════════════════════════════════════════════════════════════════

describe('T7: Job Event Backward Compatibility', () => {
    it('T7a — all original JobEvent values are covered in taxonomy', () => {
        // Original JobEvent values from job-logger.ts (Phase 31)
        const originalJobEvents = [
            'job.enqueued',
            'job.claimed',
            'job.heartbeat',
            'job.completed',
            'job.failed',
            'job.retried',
            'job.dead',
            'job.stuck',
            'job.reaped',
            'job.signature_bypass',
            'job.result_idempotent',
            'job.claim_idempotent',
            'job.reaper_run',
            'worker_signature_bypassed_dev_mode',
        ];

        // Map old → new
        const migrationMap: Record<string, string> = {
            'job.enqueued': AUDIT_EVENTS.JOB_ENQUEUED,
            'job.claimed': AUDIT_EVENTS.JOB_CLAIMED,
            'job.heartbeat': AUDIT_EVENTS.JOB_HEARTBEAT,
            'job.completed': AUDIT_EVENTS.JOB_COMPLETED,
            'job.failed': AUDIT_EVENTS.JOB_FAILED,
            'job.retried': AUDIT_EVENTS.JOB_RETRIED,
            'job.dead': AUDIT_EVENTS.JOB_DEAD,
            'job.stuck': AUDIT_EVENTS.JOB_STUCK,
            'job.reaped': AUDIT_EVENTS.JOB_REAPED,
            'job.signature_bypass': AUDIT_EVENTS.WORKER_SIGNATURE_BYPASS,
            'job.result_idempotent': AUDIT_EVENTS.JOB_RESULT_IDEMPOTENT,
            'job.claim_idempotent': AUDIT_EVENTS.JOB_CLAIM_IDEMPOTENT,
            'job.reaper_run': AUDIT_EVENTS.JOB_REAPER_RUN,
            worker_signature_bypassed_dev_mode:
                AUDIT_EVENTS.WORKER_SIGNATURE_BYPASSED_DEV,
        };

        // Every old event has a taxonomy mapping
        for (const oldEvent of originalJobEvents) {
            expect(migrationMap[oldEvent]).toBeDefined();
        }
    });
});
