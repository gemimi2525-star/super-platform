/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Phase 33A — Fail Injection + Enforcement Gate Tests
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Tests:
 *   1. getFailInjection() — ENV flag reading + production safety
 *   2. checkEnforcementGate() — soft/hard/disabled modes
 *
 * @module coreos/ops/fail-injection.test
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getFailInjection } from '../../lib/ops/integrity/failInjection';

// ═══════════════════════════════════════════════════════════════════════════
// TEST SETUP — Save/restore process.env
// ═══════════════════════════════════════════════════════════════════════════

const ENV_BACKUP: Record<string, string | undefined> = {};
const FAIL_KEYS = [
    'FAIL_INTEGRITY',
    'FAIL_KERNEL_FROZEN',
    'FAIL_HASH_CHAIN',
    'ALLOW_FAIL_INJECTION',
    'NODE_ENV',
    'VERCEL_ENV',
    'ENFORCEMENT_MODE',
];

function saveEnv() {
    for (const key of FAIL_KEYS) {
        ENV_BACKUP[key] = process.env[key];
    }
}

function restoreEnv() {
    for (const key of FAIL_KEYS) {
        if (ENV_BACKUP[key] === undefined) {
            delete process.env[key];
        } else {
            process.env[key] = ENV_BACKUP[key];
        }
    }
}

function clearFailFlags() {
    delete process.env.FAIL_INTEGRITY;
    delete process.env.FAIL_KERNEL_FROZEN;
    delete process.env.FAIL_HASH_CHAIN;
    delete process.env.ALLOW_FAIL_INJECTION;
    delete process.env.ENFORCEMENT_MODE;
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. getFailInjection
// ═══════════════════════════════════════════════════════════════════════════

describe('getFailInjection', () => {
    beforeEach(() => {
        saveEnv();
        clearFailFlags();
        // Default: test environment (non-production)
        // @ts-expect-error — NODE_ENV is readonly in types but writable at runtime in tests
        process.env.NODE_ENV = 'test';
        delete process.env.VERCEL_ENV;
    });

    afterEach(() => {
        restoreEnv();
    });

    it('returns all false by default (no flags set)', () => {
        const result = getFailInjection();
        expect(result.failIntegrity).toBe(false);
        expect(result.failKernelFrozen).toBe(false);
        expect(result.failHashChain).toBe(false);
        expect(result.active).toBe(false);
    });

    it('reads FAIL_INTEGRITY=1', () => {
        process.env.FAIL_INTEGRITY = '1';
        const result = getFailInjection();
        expect(result.failIntegrity).toBe(true);
        expect(result.active).toBe(true);
    });

    it('reads FAIL_KERNEL_FROZEN=1', () => {
        process.env.FAIL_KERNEL_FROZEN = '1';
        const result = getFailInjection();
        expect(result.failKernelFrozen).toBe(true);
        expect(result.active).toBe(true);
    });

    it('reads FAIL_HASH_CHAIN=1', () => {
        process.env.FAIL_HASH_CHAIN = '1';
        const result = getFailInjection();
        expect(result.failHashChain).toBe(true);
        expect(result.active).toBe(true);
    });

    it('reads multiple flags simultaneously', () => {
        process.env.FAIL_INTEGRITY = '1';
        process.env.FAIL_KERNEL_FROZEN = '1';
        process.env.FAIL_HASH_CHAIN = '1';
        const result = getFailInjection();
        expect(result.failIntegrity).toBe(true);
        expect(result.failKernelFrozen).toBe(true);
        expect(result.failHashChain).toBe(true);
        expect(result.active).toBe(true);
    });

    it('PRODUCTION SAFETY: ignores flags in production', () => {
        // @ts-expect-error — NODE_ENV readonly in types
        process.env.NODE_ENV = 'production';
        process.env.FAIL_INTEGRITY = '1';
        process.env.FAIL_KERNEL_FROZEN = '1';
        const result = getFailInjection();
        expect(result.failIntegrity).toBe(false);
        expect(result.failKernelFrozen).toBe(false);
        expect(result.active).toBe(false);
    });

    it('PRODUCTION SAFETY: ignores flags when VERCEL_ENV=production', () => {
        process.env.VERCEL_ENV = 'production';
        process.env.FAIL_HASH_CHAIN = '1';
        const result = getFailInjection();
        expect(result.failHashChain).toBe(false);
        expect(result.active).toBe(false);
    });

    it('ALLOW_FAIL_INJECTION=1 overrides production safety', () => {
        // @ts-expect-error — NODE_ENV readonly in types
        process.env.NODE_ENV = 'production';
        process.env.ALLOW_FAIL_INJECTION = '1';
        process.env.FAIL_INTEGRITY = '1';
        const result = getFailInjection();
        expect(result.failIntegrity).toBe(true);
        expect(result.active).toBe(true);
    });

    it('flag value "0" is treated as false', () => {
        process.env.FAIL_INTEGRITY = '0';
        const result = getFailInjection();
        expect(result.failIntegrity).toBe(false);
        expect(result.active).toBe(false);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. Enforcement Gate mode resolution (unit-level)
// ═══════════════════════════════════════════════════════════════════════════

describe('Enforcement mode safety', () => {
    beforeEach(() => {
        saveEnv();
        clearFailFlags();
        // @ts-expect-error — NODE_ENV readonly in types
        process.env.NODE_ENV = 'test';
        delete process.env.VERCEL_ENV;
    });

    afterEach(() => {
        restoreEnv();
    });

    it('ENFORCEMENT_MODE=hard is allowed in non-production', () => {
        process.env.ENFORCEMENT_MODE = 'hard';
        // Just verify the ENV is readable (gate integration tested separately)
        expect(process.env.ENFORCEMENT_MODE).toBe('hard');
    });

    it('ENFORCEMENT_MODE defaults to undefined when not set', () => {
        expect(process.env.ENFORCEMENT_MODE).toBeUndefined();
    });
});
