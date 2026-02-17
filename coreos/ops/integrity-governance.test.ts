/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SYNAPSE Governance Integrity Tests — Phase 32.5
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Tests the governance wiring in checkGovernance.ts:
 *   1. kernelFrozen  — reads CORE_FREEZE.md
 *   2. hashValid     — verifies AuditLedger hash chain
 *
 * Uses file-system fixtures for freeze file and dependency injection for ledger.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

// ─── Subjects under test ─────────────────────────────────────────────────
import {
    checkKernelFrozen,
    checkHashChain,
    checkGovernance,
    type LedgerLike,
} from '../../lib/ops/integrity/checkGovernance';

// ─── Test helpers ────────────────────────────────────────────────────────

/** Create a mock ledger that returns a given verification report. */
function mockLedger(isValid: boolean, opts?: {
    brokenIndex?: number;
    totalEntries?: number;
}): LedgerLike {
    return {
        verifyChain: () => ({
            isValid,
            lastValidIndex: isValid
                ? (opts?.totalEntries ?? 1) - 1
                : (opts?.brokenIndex ?? 0) - 1,
            ...(opts?.brokenIndex !== undefined ? { brokenIndex: opts.brokenIndex } : {}),
            totalEntries: opts?.totalEntries ?? 1,
        }),
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. checkKernelFrozen — reads CORE_FREEZE.md
// ═══════════════════════════════════════════════════════════════════════════

describe('checkKernelFrozen', () => {
    const REAL_PROJECT_ROOT = process.cwd();
    const FREEZE_PATH = path.join(REAL_PROJECT_ROOT, 'vendor/synapse-core/CORE_FREEZE.md');

    it('returns frozen=true when CORE_FREEZE.md exists and declares FROZEN', () => {
        // Real CORE_FREEZE.md exists in the repo
        const exists = fs.existsSync(FREEZE_PATH);
        expect(exists).toBe(true);

        const result = checkKernelFrozen(REAL_PROJECT_ROOT);
        expect(result.frozen).toBe(true);
        expect(result.errorCode).toBeUndefined();
    });

    it('returns frozen=false with KERNEL_FREEZE_FILE_MISSING for non-existent path', () => {
        const result = checkKernelFrozen('/tmp/definitely-does-not-exist');
        expect(result.frozen).toBe(false);
        expect(result.errorCode).toBe('KERNEL_FREEZE_FILE_MISSING');
    });

    it('returns frozen=false with KERNEL_NOT_FROZEN if file exists but no FROZEN status', () => {
        const tmpDir = path.join('/tmp', `governance-test-${Date.now()}`);
        const freezeDir = path.join(tmpDir, 'vendor/synapse-core');
        fs.mkdirSync(freezeDir, { recursive: true });
        fs.writeFileSync(
            path.join(freezeDir, 'CORE_FREEZE.md'),
            '# SYNAPSE Core\n\nVersion: 1.0\nStatus: ACTIVE\n',
        );

        const result = checkKernelFrozen(tmpDir);
        expect(result.frozen).toBe(false);
        expect(result.errorCode).toBe('KERNEL_NOT_FROZEN');

        // Cleanup
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. checkHashChain — uses LedgerLike.verifyChain()
// ═══════════════════════════════════════════════════════════════════════════

describe('checkHashChain', () => {
    it('returns valid=true when hash chain is intact', () => {
        const result = checkHashChain(mockLedger(true, { totalEntries: 6 }));
        expect(result.valid).toBe(true);
        expect(result.errorCode).toBeUndefined();
    });

    it('returns valid=false with HASH_CHAIN_BROKEN when chain is broken', () => {
        const result = checkHashChain(mockLedger(false, { brokenIndex: 3, totalEntries: 6 }));
        expect(result.valid).toBe(false);
        expect(result.errorCode).toBe('HASH_CHAIN_BROKEN');
        expect(result.detail).toContain('index 3');
        expect(result.detail).toContain('6');
    });

    it('returns valid=false with LEDGER_INIT_FAILED if verifyChain throws', () => {
        const throwingLedger: LedgerLike = {
            verifyChain: () => { throw new Error('Crypto failure'); },
        };
        const result = checkHashChain(throwingLedger);
        expect(result.valid).toBe(false);
        expect(result.errorCode).toBe('LEDGER_INIT_FAILED');
        expect(result.detail).toContain('Crypto failure');
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. checkGovernance — combined check
// ═══════════════════════════════════════════════════════════════════════════

describe('checkGovernance', () => {
    const REAL_ROOT = process.cwd();

    it('returns ok=true when kernel is frozen AND hash chain is valid', () => {
        const result = checkGovernance(REAL_ROOT, mockLedger(true));
        expect(result.ok).toBe(true);
        expect(result.kernelFrozen).toBe(true);
        expect(result.hashValid).toBe(true);
        expect(result.errorCode).toBeUndefined();
    });

    it('returns ok=false when kernel is NOT frozen', () => {
        const result = checkGovernance('/tmp/no-such-project', mockLedger(true));
        expect(result.ok).toBe(false);
        expect(result.kernelFrozen).toBe(false);
        expect(result.hashValid).toBe(true);
        expect(result.errorCode).toBe('KERNEL_FREEZE_FILE_MISSING');
    });

    it('returns ok=false when hash chain is broken', () => {
        const result = checkGovernance(REAL_ROOT, mockLedger(false, { brokenIndex: 2, totalEntries: 5 }));
        expect(result.ok).toBe(false);
        expect(result.kernelFrozen).toBe(true);
        expect(result.hashValid).toBe(false);
        expect(result.errorCode).toBe('HASH_CHAIN_BROKEN');
    });

    it('returns ok=false when BOTH fail (picks first errorCode from kernel)', () => {
        const result = checkGovernance('/tmp/no-such-project', mockLedger(false, { brokenIndex: 0, totalEntries: 1 }));
        expect(result.ok).toBe(false);
        expect(result.kernelFrozen).toBe(false);
        expect(result.hashValid).toBe(false);
        expect(result.errorCode).toBe('KERNEL_FREEZE_FILE_MISSING');
    });

    it('NEVER returns "unknown" for kernelFrozen or hashValid', () => {
        const result = checkGovernance(REAL_ROOT, mockLedger(true));
        expect(result.kernelFrozen).not.toBe('unknown');
        expect(result.hashValid).not.toBe('unknown');
        expect(typeof result.kernelFrozen).toBe('boolean');
        expect(typeof result.hashValid).toBe('boolean');
    });

    it('does NOT produce GOVERNANCE_UNKNOWN errorCode', () => {
        const result = checkGovernance(REAL_ROOT, mockLedger(true));
        expect(result.errorCode).not.toBe('GOVERNANCE_UNKNOWN');
    });
});
