/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SYNAPSE Governance Check — Phase 32.5
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Verifies two governance invariants:
 *   1. kernelFrozen — CORE_FREEZE.md exists and declares FROZEN status
 *   2. hashValid    — AuditLedger hash chain passes integrity verification
 *
 * Source of truth:
 *   - vendor/synapse-core/CORE_FREEZE.md  (canonical freeze declaration)
 *   - packages/synapse AuditLedger        (SHA-256 hash chain)
 *
 * @module lib/ops/integrity/checkGovernance
 */

import fs from 'fs';
import path from 'path';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface GovernanceResult {
    kernelFrozen: boolean;
    hashValid: boolean;
    ok: boolean;
    errorCode?: string;
    detail?: string;
}

/** Minimal interface for hash chain verification (duck-typed for DI). */
export interface VerificationReport {
    isValid: boolean;
    lastValidIndex: number;
    brokenIndex?: number;
    totalEntries: number;
}

/** Ledger interface — satisfied by AuditLedger.getInstance(). */
export interface LedgerLike {
    verifyChain(): VerificationReport;
}

// ═══════════════════════════════════════════════════════════════════════════
// FREEZE CHECK — reads vendor/synapse-core/CORE_FREEZE.md
// ═══════════════════════════════════════════════════════════════════════════

const FREEZE_FILE_RELATIVE = 'vendor/synapse-core/CORE_FREEZE.md';
const FROZEN_STATUS_PATTERN = /\*{0,2}Status:?\*{0,2}\s*FROZEN/i;

/**
 * Check if the SYNAPSE kernel is declared FROZEN.
 * Reads the canonical freeze declaration file — no hardcoded values.
 */
export function checkKernelFrozen(projectRoot?: string): {
    frozen: boolean;
    errorCode?: string;
    detail?: string;
} {
    try {
        const root = projectRoot ?? process.cwd();
        const freezePath = path.join(root, FREEZE_FILE_RELATIVE);

        if (!fs.existsSync(freezePath)) {
            return {
                frozen: false,
                errorCode: 'KERNEL_FREEZE_FILE_MISSING',
                detail: `Expected at ${FREEZE_FILE_RELATIVE}`,
            };
        }

        const content = fs.readFileSync(freezePath, 'utf8');

        if (!FROZEN_STATUS_PATTERN.test(content)) {
            return {
                frozen: false,
                errorCode: 'KERNEL_NOT_FROZEN',
                detail: 'CORE_FREEZE.md exists but does not declare FROZEN status',
            };
        }

        return { frozen: true };
    } catch (err) {
        return {
            frozen: false,
            errorCode: 'KERNEL_FREEZE_READ_ERROR',
            detail: err instanceof Error ? err.message : String(err),
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// HASH CHAIN CHECK — uses AuditLedger.verifyChain()
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Verify the AuditLedger hash chain integrity.
 * Accepts an optional ledger instance for testability (dependency injection).
 * In production, resolves the real AuditLedger from packages/synapse.
 */
export function checkHashChain(ledger?: LedgerLike): {
    valid: boolean;
    errorCode?: string;
    detail?: string;
} {
    try {
        let instance: LedgerLike;

        if (ledger) {
            instance = ledger;
        } else {
            // Production path — dynamic import to avoid circular/build issues.
            // AuditLedger is a singleton — getInstance() is safe to call repeatedly.
            try {
                // Try workspace-linked package name first
                // eslint-disable-next-line @typescript-eslint/no-require-imports
                const mod = require('@synapse/core');
                instance = mod.AuditLedger.getInstance();
            } catch {
                // Fallback: direct relative path to the synapse package source
                // eslint-disable-next-line @typescript-eslint/no-require-imports
                const { AuditLedger } = require('../../../packages/synapse/src/audit-ledger/ledger');
                instance = AuditLedger.getInstance();
            }
        }

        const report = instance.verifyChain();

        if (report.isValid) {
            return { valid: true };
        }

        return {
            valid: false,
            errorCode: 'HASH_CHAIN_BROKEN',
            detail: `Chain broken at index ${report.brokenIndex ?? '?'} of ${report.totalEntries}`,
        };
    } catch (err) {
        return {
            valid: false,
            errorCode: 'LEDGER_INIT_FAILED',
            detail: err instanceof Error ? err.message : String(err),
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// COMBINED CHECK — used by getIntegrity()
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Run all governance checks and return a unified result.
 * Returns `ok: true` only when BOTH kernel is frozen AND hash chain is valid.
 */
export function checkGovernance(projectRoot?: string, ledger?: LedgerLike): GovernanceResult {
    const freeze = checkKernelFrozen(projectRoot);
    const hash = checkHashChain(ledger);

    const ok = freeze.frozen && hash.valid;

    // Pick the first error code if any
    const errorCode = freeze.errorCode ?? hash.errorCode;
    const detail = freeze.detail ?? hash.detail;

    return {
        kernelFrozen: freeze.frozen,
        hashValid: hash.valid,
        ok,
        ...(errorCode ? { errorCode } : {}),
        ...(detail ? { detail } : {}),
    };
}
