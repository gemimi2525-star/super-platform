/**
 * ═══════════════════════════════════════════════════════════════════════════
 * EXECUTION ENGINE TESTS (Phase 21A — Immutable Audit Chain)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Verifies that the audit chain remains valid after undo operations.
 * Tests: chain integrity, ROLLBACK semantics, double-undo protection,
 *        and original entry immutability.
 * 
 * @module coreos/brain/execution.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock crypto before importing execution engine
vi.mock('crypto', () => ({
    createHash: (algo: string) => ({
        update: (data: string) => ({
            digest: (enc: string) => {
                // Deterministic simple hash for tests
                let hash = 0;
                for (let i = 0; i < data.length; i++) {
                    const char = data.charCodeAt(i);
                    hash = ((hash << 5) - hash) + char;
                    hash |= 0;
                }
                return Math.abs(hash).toString(16).padStart(16, '0').substring(0, 16);
            },
        }),
    }),
}));

// Mock attestation modules
vi.mock('../attestation/signer', () => ({
    verifySignature: () => true,
}));

vi.mock('../attestation/keys', () => ({
    getDefaultKeyProvider: () => ({
        getPublicKey: () => 'mock-public-key',
    }),
}));

import type { SignedApproval, ResourceTarget, ExecutionAuditEntry } from './types';

// We need a fresh engine for each test, so we import the class indirectly
// by re-requiring the module
function createFreshEngine() {
    // Reset module cache to get a fresh ExecutionEngine instance
    vi.resetModules();

    // Re-mock after reset
    vi.doMock('crypto', () => ({
        createHash: (algo: string) => ({
            update: (data: string) => ({
                digest: (enc: string) => {
                    let hash = 0;
                    for (let i = 0; i < data.length; i++) {
                        const char = data.charCodeAt(i);
                        hash = ((hash << 5) - hash) + char;
                        hash |= 0;
                    }
                    return Math.abs(hash).toString(16).padStart(16, '0').substring(0, 16);
                },
            }),
        }),
    }));

    vi.doMock('../attestation/signer', () => ({
        verifySignature: () => true,
    }));

    vi.doMock('../attestation/keys', () => ({
        getDefaultKeyProvider: () => ({
            getPublicKey: () => 'mock-public-key',
        }),
    }));
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST HELPERS
// ═══════════════════════════════════════════════════════════════════════════

const mockTarget: ResourceTarget = {
    resourceId: 'note-001',
    resourceType: 'note',
    path: '/notes/test.md',
    displayName: 'Test Note',
};

function createMockApproval(overrides?: Partial<SignedApproval>): SignedApproval {
    return {
        approvalId: `approval-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        intentId: `intent-${Date.now()}`,
        actionType: 'NOTE_REWRITE',
        scope: 'core.notes',
        target: mockTarget,
        diff: {
            before: 'Hello World',
            after: 'Hello Phase 21A',
            summary: 'Rewrite note content',
        },
        approvedBy: 'OWNER_AUTHORITY',
        approvedAt: Date.now(),
        expiresAt: Date.now() + 15 * 60 * 1000,
        nonce: `nonce-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        signature: 'mock-valid-signature',
        signedFields: ['approvalId', 'intentId', 'actionType', 'scope', 'target', 'diff', 'approvedBy', 'approvedAt', 'expiresAt', 'nonce'],
        ...overrides,
    };
}

const mockReadResource = async (_target: ResourceTarget) => 'current state content';
const mockApplyChange = async (_target: ResourceTarget, _diff: { before: string; after: string }) => { };
const mockApplyRestore = async (_target: ResourceTarget, _state: string) => { };

// ═══════════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('Phase 21A: Immutable Audit Chain', () => {

    let engine: any;

    beforeEach(async () => {
        createFreshEngine();
        const mod = await import('./execution');
        engine = mod.executionEngine;
        engine.setKillSwitch('EXECUTE_ENABLED');
    });

    // ─── Test 1: execute → undo → verifyAuditChain() = valid ───────────
    it('T1: execute → undo → verifyAuditChain() returns valid: true', async () => {
        const approval = createMockApproval();
        const result = await engine.executeWithApproval(approval, mockReadResource, mockApplyChange);

        expect(result.status).toBe('COMPLETED');

        // Undo
        await engine.undo(result.executionId, mockApplyRestore);

        // Verify chain
        const chainResult = engine.verifyAuditChain();
        expect(chainResult.valid).toBe(true);
    });

    // ─── Test 2: execute x2 → undo #2 → verify valid ──────────────────
    it('T2: execute x2 → undo second → verifyAuditChain() valid (2 EXEC + 1 ROLLBACK)', async () => {
        const approval1 = createMockApproval();
        const result1 = await engine.executeWithApproval(approval1, mockReadResource, mockApplyChange);

        const approval2 = createMockApproval();
        const result2 = await engine.executeWithApproval(approval2, mockReadResource, mockApplyChange);

        expect(result1.status).toBe('COMPLETED');
        expect(result2.status).toBe('COMPLETED');

        // Undo only the second execution
        await engine.undo(result2.executionId, mockApplyRestore);

        // Chain should be valid
        const chainResult = engine.verifyAuditChain();
        expect(chainResult.valid).toBe(true);

        // Should have 3 entries: 2 EXECUTION + 1 ROLLBACK
        const log: ExecutionAuditEntry[] = engine.getAuditLog();
        expect(log).toHaveLength(3);
        expect(log[0].entryType).toBe('EXECUTION');
        expect(log[1].entryType).toBe('EXECUTION');
        expect(log[2].entryType).toBe('ROLLBACK');
    });

    // ─── Test 3: double undo blocked ───────────────────────────────────
    it('T3: double undo is blocked (throws error)', async () => {
        const approval = createMockApproval();
        const result = await engine.executeWithApproval(approval, mockReadResource, mockApplyChange);

        // First undo succeeds
        await engine.undo(result.executionId, mockApplyRestore);

        // Second undo should throw
        await expect(
            engine.undo(result.executionId, mockApplyRestore)
        ).rejects.toThrow('already rolled back');
    });

    // ─── Test 4: ROLLBACK referencesEntryId correct ────────────────────
    it('T4: ROLLBACK entry has correct referencesEntryId', async () => {
        const approval = createMockApproval();
        const result = await engine.executeWithApproval(approval, mockReadResource, mockApplyChange);

        await engine.undo(result.executionId, mockApplyRestore);

        const log: ExecutionAuditEntry[] = engine.getAuditLog();
        const execEntry = log.find(e => e.entryType === 'EXECUTION');
        const rollbackEntry = log.find(e => e.entryType === 'ROLLBACK');

        expect(execEntry).toBeDefined();
        expect(rollbackEntry).toBeDefined();
        expect(rollbackEntry!.referencesEntryId).toBe(execEntry!.entryId);
        expect(rollbackEntry!.auditVersion).toBe(2);
    });

    // ─── Test 5: chain prevHash linkage correct ────────────────────────
    it('T5: every entry prevHash matches previous recordHash', async () => {
        const approval1 = createMockApproval();
        await engine.executeWithApproval(approval1, mockReadResource, mockApplyChange);

        const approval2 = createMockApproval();
        const result2 = await engine.executeWithApproval(approval2, mockReadResource, mockApplyChange);

        await engine.undo(result2.executionId, mockApplyRestore);

        const log: ExecutionAuditEntry[] = engine.getAuditLog();

        // First entry should reference genesis hash
        expect(log[0].prevHash).toBe('0000000000000000');

        // Each subsequent entry should chain to previous
        for (let i = 1; i < log.length; i++) {
            expect(log[i].prevHash).toBe(log[i - 1].recordHash);
        }
    });

    // ─── Test 6: original EXECUTION entry is immutable after undo ──────
    it('T6: original EXECUTION entry status remains COMPLETED after undo', async () => {
        const approval = createMockApproval();
        const result = await engine.executeWithApproval(approval, mockReadResource, mockApplyChange);

        const logBefore: ExecutionAuditEntry[] = engine.getAuditLog();
        const execEntryBefore = logBefore.find(e => e.entryType === 'EXECUTION');
        const hashBefore = execEntryBefore!.recordHash;
        const statusBefore = execEntryBefore!.status;

        // Undo
        await engine.undo(result.executionId, mockApplyRestore);

        // Original entry should NOT be mutated
        const logAfter: ExecutionAuditEntry[] = engine.getAuditLog();
        const execEntryAfter = logAfter.find(e => e.entryType === 'EXECUTION');

        expect(execEntryAfter!.status).toBe('COMPLETED');
        expect(execEntryAfter!.status).toBe(statusBefore);
        expect(execEntryAfter!.recordHash).toBe(hashBefore);
    });
});
