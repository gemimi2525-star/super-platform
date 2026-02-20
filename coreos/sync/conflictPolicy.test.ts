/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Conflict Policy Tests — Phase 15D.C
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { describe, it, expect } from 'vitest';
import { resolveJobConflict, type JobConflictState } from './conflictPolicy';

const base: JobConflictState = {
    updatedAt: 1000,
    priority: 50,
    deviceId: 'dev_aaa',
    status: 'PENDING',
};

describe('resolveJobConflict', () => {
    // ─── Tier 1: Timestamp ───────────────────────────────────────────

    it('newer timestamp wins (local newer)', () => {
        const local = { ...base, updatedAt: 2000 };
        const remote = { ...base, updatedAt: 1000 };
        expect(resolveJobConflict(local, remote)).toBe('local');
    });

    it('newer timestamp wins (remote newer)', () => {
        const local = { ...base, updatedAt: 1000 };
        const remote = { ...base, updatedAt: 2000 };
        expect(resolveJobConflict(local, remote)).toBe('remote');
    });

    // ─── Tier 2: Priority (equal timestamps) ─────────────────────────

    it('higher priority wins (local higher)', () => {
        const local = { ...base, updatedAt: 1000, priority: 90 };
        const remote = { ...base, updatedAt: 1000, priority: 50 };
        expect(resolveJobConflict(local, remote)).toBe('local');
    });

    it('higher priority wins (remote higher)', () => {
        const local = { ...base, updatedAt: 1000, priority: 10 };
        const remote = { ...base, updatedAt: 1000, priority: 80 };
        expect(resolveJobConflict(local, remote)).toBe('remote');
    });

    // ─── Tier 3: Lexical deviceId (equal timestamps + priority) ──────

    it('lexical deviceId comparison (local wins)', () => {
        const local = { ...base, deviceId: 'dev_aaa' };
        const remote = { ...base, deviceId: 'dev_zzz' };
        expect(resolveJobConflict(local, remote)).toBe('local');
    });

    it('lexical deviceId comparison (remote wins)', () => {
        const local = { ...base, deviceId: 'dev_zzz' };
        const remote = { ...base, deviceId: 'dev_aaa' };
        expect(resolveJobConflict(local, remote)).toBe('remote');
    });

    // ─── Edge: identical state → remote wins ─────────────────────────

    it('identical state → remote wins (server authoritative)', () => {
        const local = { ...base };
        const remote = { ...base };
        expect(resolveJobConflict(local, remote)).toBe('remote');
    });

    // ─── Determinism: same inputs → same output ──────────────────────

    it('deterministic across calls', () => {
        const local = { ...base, updatedAt: 500, priority: 60, deviceId: 'dev_x' };
        const remote = { ...base, updatedAt: 500, priority: 60, deviceId: 'dev_y' };
        const r1 = resolveJobConflict(local, remote);
        const r2 = resolveJobConflict(local, remote);
        const r3 = resolveJobConflict(local, remote);
        expect(r1).toBe(r2);
        expect(r2).toBe(r3);
        expect(r1).toBe('local'); // 'dev_x' < 'dev_y'
    });
});
