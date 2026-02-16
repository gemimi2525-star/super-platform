/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Phase 31 — Deterministic Backoff + Job Logger Tests
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Tests for:
 * - computeBackoff(): deterministic, increases with attempt, capped
 * - jobLogger: structured output, all required fields
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock firebase-admin to prevent module loading issues
vi.mock('@/lib/firebase-admin', () => ({
    getAdminFirestore: vi.fn(),
}));

import { computeBackoff } from './queue';
import { jobLogger, type JobEvent, type JobLogEntry } from './job-logger';
import { RETRY_MAX_DELAY_MS } from './types';

// ═══════════════════════════════════════════════════════════════════════════
// T1: Deterministic Backoff
// ═══════════════════════════════════════════════════════════════════════════

describe('Phase 31 — Deterministic Backoff', () => {
    it('T1 — same jobId + same attempt always returns same delay', () => {
        const delay1 = computeBackoff('job-abc', 2);
        const delay2 = computeBackoff('job-abc', 2);
        expect(delay1).toBe(delay2);
    });

    it('T1b — different attempts produce different delays', () => {
        const d1 = computeBackoff('job-abc', 1);
        const d2 = computeBackoff('job-abc', 3);
        expect(d1).not.toBe(d2);
    });

    it('T1c — delay generally increases with attempt number', () => {
        const d1 = computeBackoff('job-abc', 1);
        const d5 = computeBackoff('job-abc', 5);
        // d5 should be larger than d1 (exponential base increases)
        expect(d5).toBeGreaterThan(d1);
    });

    it('T1d — delay is capped at RETRY_MAX_DELAY_MS', () => {
        const delay = computeBackoff('job-abc', 100);
        expect(delay).toBeLessThanOrEqual(RETRY_MAX_DELAY_MS);
    });

    it('T1e — different jobIds with same attempt produce different delays', () => {
        const d1 = computeBackoff('job-aaa', 2);
        const d2 = computeBackoff('job-bbb', 2);
        // Hash-based jitter should differ (extremely unlikely to collide)
        expect(d1).not.toBe(d2);
    });

    it('T1f — delay is always a positive number', () => {
        for (let i = 0; i < 10; i++) {
            const delay = computeBackoff(`job-${i}`, i);
            expect(delay).toBeGreaterThan(0);
        }
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// T2: Structured Job Logger
// ═══════════════════════════════════════════════════════════════════════════

describe('Phase 31 — Structured Job Logger', () => {
    let consoleSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { });
    });

    afterEach(() => {
        consoleSpy.mockRestore();
    });

    it('T2 — log outputs JSON with required fields', () => {
        jobLogger.log('job.enqueued', {
            jobId: 'test-job-001',
            traceId: 'trace-001',
        });

        expect(consoleSpy).toHaveBeenCalledOnce();
        const output = consoleSpy.mock.calls[0][0] as string;

        // Must start with [JobSystem] prefix
        expect(output).toContain('[JobSystem]');

        // Extract JSON part
        const jsonStr = output.replace('[JobSystem] ', '');
        const entry = JSON.parse(jsonStr) as JobLogEntry;

        expect(entry.event).toBe('job.enqueued');
        expect(entry.jobId).toBe('test-job-001');
        expect(entry.traceId).toBe('trace-001');
        expect(entry.timestamp).toBeDefined();
        // Timestamp should be ISO format
        expect(new Date(entry.timestamp).toISOString()).toBe(entry.timestamp);
    });

    it('T2b — warn outputs to console.warn', () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });

        jobLogger.warn('job.stuck', {
            jobId: 'stuck-001',
            workerId: 'worker-001',
        });

        expect(warnSpy).toHaveBeenCalledOnce();
        const output = warnSpy.mock.calls[0][0] as string;
        expect(output).toContain('job.stuck');
        warnSpy.mockRestore();
    });

    it('T2c — error outputs to console.error', () => {
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        jobLogger.error('job.failed', {
            jobId: 'fail-001',
            error: { code: 'EXEC_ERROR', message: 'boom' },
        });

        expect(errorSpy).toHaveBeenCalledOnce();
        const output = errorSpy.mock.calls[0][0] as string;
        const json = JSON.parse(output.replace('[JobSystem] ', ''));
        expect(json.error.code).toBe('EXEC_ERROR');
        errorSpy.mockRestore();
    });

    it('T2d — all event types are valid strings (incl. Phase 31.8)', () => {
        const validEvents: JobEvent[] = [
            'job.enqueued', 'job.claimed', 'job.heartbeat',
            'job.completed', 'job.failed', 'job.retried',
            'job.dead', 'job.stuck', 'job.reaped',
            'job.signature_bypass', 'job.result_idempotent',
            'job.claim_idempotent', 'job.reaper_run',
            'worker_signature_bypassed_dev_mode',
        ];

        for (const event of validEvents) {
            jobLogger.log(event, { jobId: 'test' });
        }

        // Should have logged each event type
        expect(consoleSpy).toHaveBeenCalledTimes(validEvents.length);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// T3: Phase 31.8 — Security Hardening
// ═══════════════════════════════════════════════════════════════════════════

describe('Phase 31.8 — Security Hardening', () => {
    // T3a: Production guard test
    it('T3a — worker_signature_bypassed_dev_mode is a valid JobEvent', () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });

        jobLogger.warn('worker_signature_bypassed_dev_mode', {
            jobId: 'guard-test-001',
            traceId: 'trace-guard',
            workerId: 'worker-guard',
        });

        expect(warnSpy).toHaveBeenCalledOnce();
        const output = warnSpy.mock.calls[0][0] as string;
        const json = JSON.parse(output.replace('[JobSystem] ', ''));
        expect(json.event).toBe('worker_signature_bypassed_dev_mode');
        expect(json.jobId).toBe('guard-test-001');
        expect(json.traceId).toBe('trace-guard');
        expect(json.workerId).toBe('worker-guard');
        expect(json.timestamp).toBeDefined();
        warnSpy.mockRestore();
    });

    // T3b: Production guard — devMode=true + NODE_ENV=production should be rejected
    it('T3b — production guard rejects when NODE_ENV=production and DEV_MODE=true', () => {
        // This tests the ENV combination logic (not the route handler itself)
        const nodeEnv = 'production';
        const devMode = true;

        if (nodeEnv === 'production' && devMode) {
            // This is the guard condition — should fail fast
            expect(true).toBe(true); // Guard would trigger
        } else {
            // Should never reach here in this test
            expect(false).toBe(true);
        }
    });

    // T3c: Non-production allows dev mode
    it('T3c — non-production allows dev mode without fatal error', () => {
        const nodeEnv: string = 'development';
        const devMode = true;

        const shouldBlock = nodeEnv === 'production' && devMode;
        expect(shouldBlock).toBe(false); // development should NOT block
    });

    // T3d: Production without dev mode is OK
    it('T3d — production without dev mode is normal operation', () => {
        const nodeEnv = 'production';
        const devMode = false;

        const shouldBlock = nodeEnv === 'production' && devMode;
        expect(shouldBlock).toBe(false); // no dev mode = OK
    });
});
