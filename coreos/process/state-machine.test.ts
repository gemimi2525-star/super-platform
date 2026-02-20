/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PROCESS STATE MACHINE — Tests (Phase 15B)
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    canTransition,
    applyTransition,
    clampPriority,
    applyPriority,
    createProcess,
    generatePid,
    resetPidCounter,
} from './state-machine';
import type { ProcessRecord, ProcessCaps } from './types';

const NOW = '2026-02-20T12:00:00.000Z';
const CAPS: ProcessCaps = { vfsSchemesAllowed: ['user'] };

function makeRecord(overrides: Partial<ProcessRecord> = {}): ProcessRecord {
    return {
        pid: 'proc-test-0001',
        appId: 'core.notes',
        title: 'Notes',
        state: 'RUNNING',
        priority: 50,
        createdAt: NOW,
        updatedAt: NOW,
        lastTransition: null,
        wakeReason: 'user',
        caps: CAPS,
        integrity: { argsHash: 'abc123' },
        ...overrides,
    };
}

// ─── canTransition ──────────────────────────────────────────────────────

describe('canTransition', () => {
    // RUNNING →
    it('RUNNING → background = valid', () => {
        const r = canTransition('RUNNING', 'background');
        expect(r.valid).toBe(true);
        expect(r.toState).toBe('BACKGROUND');
    });

    it('RUNNING → suspend = valid', () => {
        const r = canTransition('RUNNING', 'suspend');
        expect(r.valid).toBe(true);
        expect(r.toState).toBe('SUSPENDED');
    });

    it('RUNNING → terminate = valid', () => {
        const r = canTransition('RUNNING', 'terminate');
        expect(r.valid).toBe(true);
        expect(r.toState).toBe('TERMINATED');
    });

    it('RUNNING → resume = INVALID', () => {
        const r = canTransition('RUNNING', 'resume');
        expect(r.valid).toBe(false);
    });

    // BACKGROUND →
    it('BACKGROUND → resume = valid', () => {
        const r = canTransition('BACKGROUND', 'resume');
        expect(r.valid).toBe(true);
        expect(r.toState).toBe('RUNNING');
    });

    it('BACKGROUND → suspend = valid', () => {
        const r = canTransition('BACKGROUND', 'suspend');
        expect(r.valid).toBe(true);
        expect(r.toState).toBe('SUSPENDED');
    });

    it('BACKGROUND → terminate = valid', () => {
        const r = canTransition('BACKGROUND', 'terminate');
        expect(r.valid).toBe(true);
        expect(r.toState).toBe('TERMINATED');
    });

    it('BACKGROUND → background = INVALID (already background)', () => {
        const r = canTransition('BACKGROUND', 'background');
        expect(r.valid).toBe(false);
    });

    // SUSPENDED →
    it('SUSPENDED → resume = valid', () => {
        const r = canTransition('SUSPENDED', 'resume');
        expect(r.valid).toBe(true);
        expect(r.toState).toBe('RUNNING');
    });

    it('SUSPENDED → terminate = valid', () => {
        const r = canTransition('SUSPENDED', 'terminate');
        expect(r.valid).toBe(true);
        expect(r.toState).toBe('TERMINATED');
    });

    it('SUSPENDED → background = INVALID', () => {
        const r = canTransition('SUSPENDED', 'background');
        expect(r.valid).toBe(false);
    });

    it('SUSPENDED → suspend = INVALID (already suspended)', () => {
        const r = canTransition('SUSPENDED', 'suspend');
        expect(r.valid).toBe(false);
    });

    // TERMINATED →
    it('TERMINATED → resume = INVALID (terminal)', () => {
        const r = canTransition('TERMINATED', 'resume');
        expect(r.valid).toBe(false);
    });

    it('TERMINATED → background = INVALID (terminal)', () => {
        const r = canTransition('TERMINATED', 'background');
        expect(r.valid).toBe(false);
    });

    it('TERMINATED → suspend = INVALID (terminal)', () => {
        const r = canTransition('TERMINATED', 'suspend');
        expect(r.valid).toBe(false);
    });

    it('TERMINATED → terminate = INVALID (already terminated)', () => {
        const r = canTransition('TERMINATED', 'terminate');
        expect(r.valid).toBe(false);
    });
});

// ─── applyTransition ────────────────────────────────────────────────────

describe('applyTransition', () => {
    it('RUNNING → background produces correct record', () => {
        const rec = makeRecord({ state: 'RUNNING' });
        const result = applyTransition(rec, 'background', 'lost focus', NOW);

        expect(result.state).toBe('BACKGROUND');
        expect(result.updatedAt).toBe(NOW);
        expect(result.lastTransition).toEqual({
            from: 'RUNNING',
            to: 'BACKGROUND',
            action: 'background',
            reason: 'lost focus',
            ts: NOW,
        });
        // Original not mutated
        expect(rec.state).toBe('RUNNING');
    });

    it('resume sets wakeReason to "resume"', () => {
        const rec = makeRecord({ state: 'BACKGROUND', wakeReason: 'user' });
        const result = applyTransition(rec, 'resume', 'user clicked', NOW);

        expect(result.state).toBe('RUNNING');
        expect(result.wakeReason).toBe('resume');
    });

    it('throws on invalid transition', () => {
        const rec = makeRecord({ state: 'TERMINATED' });
        expect(() => applyTransition(rec, 'resume', 'test', NOW)).toThrow('INVALID_TRANSITION');
    });

    it('is deterministic: same inputs → same output', () => {
        const rec = makeRecord({ state: 'RUNNING' });
        const a = applyTransition(rec, 'suspend', 'test', NOW);
        const b = applyTransition(rec, 'suspend', 'test', NOW);
        expect(a).toEqual(b);
    });
});

// ─── Priority ───────────────────────────────────────────────────────────

describe('clampPriority', () => {
    it('clamps negative to 0', () => expect(clampPriority(-10)).toBe(0));
    it('clamps > 100 to 100', () => expect(clampPriority(150)).toBe(100));
    it('rounds float', () => expect(clampPriority(50.7)).toBe(51));
    it('keeps valid value', () => expect(clampPriority(75)).toBe(75));
    it('keeps 0', () => expect(clampPriority(0)).toBe(0));
    it('keeps 100', () => expect(clampPriority(100)).toBe(100));
});

describe('applyPriority', () => {
    it('sets priority and updatedAt', () => {
        const rec = makeRecord({ priority: 50 });
        const result = applyPriority(rec, 80, NOW);
        expect(result.priority).toBe(80);
        expect(result.updatedAt).toBe(NOW);
        // Original not mutated
        expect(rec.priority).toBe(50);
    });

    it('clamps out-of-range', () => {
        const rec = makeRecord({ priority: 50 });
        expect(applyPriority(rec, 200, NOW).priority).toBe(100);
        expect(applyPriority(rec, -5, NOW).priority).toBe(0);
    });

    it('throws for TERMINATED process', () => {
        const rec = makeRecord({ state: 'TERMINATED' });
        expect(() => applyPriority(rec, 50, NOW)).toThrow('INVALID_OPERATION');
    });
});

// ─── createProcess ──────────────────────────────────────────────────────

describe('createProcess', () => {
    beforeEach(() => resetPidCounter());

    it('creates foreground process with RUNNING state', () => {
        const p = createProcess('core.notes', 'Notes', 'foreground', 50, CAPS, 'hash1', NOW);
        expect(p.state).toBe('RUNNING');
        expect(p.appId).toBe('core.notes');
        expect(p.title).toBe('Notes');
        expect(p.priority).toBe(50);
        expect(p.wakeReason).toBe('user');
        expect(p.caps).toEqual(CAPS);
        expect(p.lastTransition).toBeNull();
    });

    it('creates background process with BACKGROUND state', () => {
        const p = createProcess('core.notes', 'Notes', 'background', 30, CAPS, 'hash2', NOW);
        expect(p.state).toBe('BACKGROUND');
        expect(p.priority).toBe(30);
    });

    it('clamps priority on creation', () => {
        const p = createProcess('core.notes', 'Notes', 'foreground', 200, CAPS, 'hash3', NOW);
        expect(p.priority).toBe(100);
    });
});

// ─── generatePid ────────────────────────────────────────────────────────

describe('generatePid', () => {
    beforeEach(() => resetPidCounter());

    it('generates pid with proc- prefix', () => {
        const pid = generatePid(1000);
        expect(pid.startsWith('proc-')).toBe(true);
    });

    it('generates unique pids', () => {
        const a = generatePid(1000);
        const b = generatePid(1000);
        expect(a).not.toBe(b);
    });

    it('format is proc-{ts36}-{seq36}', () => {
        const pid = generatePid(1000);
        const parts = pid.split('-');
        expect(parts.length).toBe(3);
        expect(parts[0]).toBe('proc');
    });
});
