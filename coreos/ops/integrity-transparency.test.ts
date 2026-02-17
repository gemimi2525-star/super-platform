/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Phase 34 — Integrity Transparency Tests
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Unit tests for:
 *   1. IntegrityContract types & detectMismatch logic
 *   2. Evidence Pack assembly
 *   3. LedgerStatusResponse shape
 *
 * @module coreos/ops/integrity-transparency.test
 */

import { describe, it, expect } from 'vitest';
import {
    detectMismatch,
    LAYER_ORDER,
    LAYER_LABELS,
} from '../integrity/IntegrityContract';
import type {
    IntegritySnapshot,
    IntegrityMatrixRow,
    EvidencePack,
    LedgerStatusResponse,
    LocalSnapshotInput,
    IntegrityLayer,
    MatchStatus,
} from '../integrity/IntegrityContract';

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function makeSnapshot(overrides: Partial<IntegritySnapshot> & { layer: IntegrityLayer }): IntegritySnapshot {
    return {
        commit: 'abc1234deadbeef',
        version: '0.32.5',
        lockedTag: 'v0.32.5',
        shaResolved: true,
        governance: { kernelFrozen: true, hashValid: true },
        ledger: null,
        signature: 'sig123456789abcdef',
        status: 'OK',
        errorCodes: [],
        phase: '34',
        fetchedAt: new Date().toISOString(),
        ...overrides,
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. CONTRACT TYPES
// ═══════════════════════════════════════════════════════════════════════════

describe('IntegrityContract — types', () => {
    it('LAYER_ORDER has 5 layers in correct order', () => {
        expect(LAYER_ORDER).toEqual(['production', 'preview', 'ledger', 'local', 'github']);
    });

    it('LAYER_LABELS has human-readable labels for all layers', () => {
        for (const layer of LAYER_ORDER) {
            expect(LAYER_LABELS[layer]).toBeTruthy();
            expect(typeof LAYER_LABELS[layer]).toBe('string');
        }
    });

    it('IntegritySnapshot shape is valid', () => {
        const snap = makeSnapshot({ layer: 'production' });
        expect(snap.layer).toBe('production');
        expect(snap.commit).toBeTruthy();
        expect(snap.governance?.kernelFrozen).toBe(true);
        expect(snap.governance?.hashValid).toBe(true);
    });

    it('LedgerStatusResponse shape compiles', () => {
        const response: LedgerStatusResponse = {
            ok: true,
            ledgerRootHash: '0000000000000000',
            lastEntryHash: 'abc123',
            chainLength: 42,
            isValid: true,
            fetchedAt: new Date().toISOString(),
        };
        expect(response.ok).toBe(true);
        expect(response.chainLength).toBe(42);
    });

    it('LocalSnapshotInput shape compiles', () => {
        const input: LocalSnapshotInput = {
            commit: '5e1e493',
            version: '0.32.5',
            lockedTag: 'v0.32.5',
            phase: '34',
        };
        expect(input.commit).toBe('5e1e493');
    });

    it('EvidencePack shape compiles', () => {
        const pack: EvidencePack = {
            generatedAt: new Date().toISOString(),
            referenceLayer: 'production',
            phase: '34',
            layers: [],
        };
        expect(pack.referenceLayer).toBe('production');
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. MISMATCH DETECTION
// ═══════════════════════════════════════════════════════════════════════════

describe('detectMismatch()', () => {
    const reference = makeSnapshot({ layer: 'production' });

    it('returns OK when all fields match', () => {
        const target = makeSnapshot({ layer: 'preview' });
        const result = detectMismatch(reference, target);
        expect(result.match).toBe('OK');
        expect(result.reasons).toHaveLength(0);
    });

    it('returns MISMATCH on commit difference', () => {
        const target = makeSnapshot({ layer: 'preview', commit: 'fff9999deadbeef' });
        const result = detectMismatch(reference, target);
        expect(result.match).toBe('MISMATCH');
        expect(result.reasons.some(r => r.includes('Commit mismatch'))).toBe(true);
    });

    it('returns MISMATCH on version difference', () => {
        const target = makeSnapshot({ layer: 'preview', version: '0.33.0' });
        const result = detectMismatch(reference, target);
        expect(result.match).toBe('MISMATCH');
        expect(result.reasons.some(r => r.includes('Version mismatch'))).toBe(true);
    });

    it('normalizes version with/without v prefix', () => {
        const target = makeSnapshot({ layer: 'preview', version: 'v0.32.5' });
        const result = detectMismatch(reference, target);
        expect(result.match).toBe('OK');
    });

    it('returns MISMATCH on lockedTag difference', () => {
        const target = makeSnapshot({ layer: 'preview', lockedTag: 'v0.31.0' });
        const result = detectMismatch(reference, target);
        expect(result.match).toBe('MISMATCH');
        expect(result.reasons.some(r => r.includes('Tag mismatch'))).toBe(true);
    });

    it('returns MISMATCH on kernelFrozen difference', () => {
        const target = makeSnapshot({
            layer: 'preview',
            governance: { kernelFrozen: false, hashValid: true },
        });
        const result = detectMismatch(reference, target);
        expect(result.match).toBe('MISMATCH');
        expect(result.reasons.some(r => r.includes('Kernel frozen'))).toBe(true);
    });

    it('returns MISMATCH on hashValid difference', () => {
        const target = makeSnapshot({
            layer: 'preview',
            governance: { kernelFrozen: true, hashValid: false },
        });
        const result = detectMismatch(reference, target);
        expect(result.match).toBe('MISMATCH');
        expect(result.reasons.some(r => r.includes('Hash valid'))).toBe(true);
    });

    it('returns MISMATCH on signature difference', () => {
        const target = makeSnapshot({ layer: 'preview', signature: 'different_sig' });
        const result = detectMismatch(reference, target);
        expect(result.match).toBe('MISMATCH');
        expect(result.reasons.some(r => r.includes('Signature'))).toBe(true);
    });

    it('skips signature check for ledger layer', () => {
        const target = makeSnapshot({ layer: 'ledger', signature: 'different_sig' });
        const result = detectMismatch(reference, target);
        // should NOT have signature mismatch since ledger layer is excluded
        expect(result.reasons.every(r => !r.includes('Signature'))).toBe(true);
    });

    it('returns N/A for target with status N/A', () => {
        const target = makeSnapshot({ layer: 'github', status: 'N/A' });
        const result = detectMismatch(reference, target);
        expect(result.match).toBe('N/A');
        expect(result.reasons).toHaveLength(0);
    });

    it('returns N/A for target with status ERROR', () => {
        const target = makeSnapshot({ layer: 'preview', status: 'ERROR' });
        const result = detectMismatch(reference, target);
        expect(result.match).toBe('N/A');
    });

    it('handles multiple mismatches at once', () => {
        const target = makeSnapshot({
            layer: 'preview',
            commit: 'fff9999deadbeef',
            version: '0.33.0',
            lockedTag: 'v0.33.0',
        });
        const result = detectMismatch(reference, target);
        expect(result.match).toBe('MISMATCH');
        expect(result.reasons.length).toBeGreaterThanOrEqual(3);
    });

    it('handles null governance gracefully', () => {
        const target = makeSnapshot({ layer: 'local', governance: null });
        const result = detectMismatch(reference, target);
        // Should not throw, governance check skipped
        expect(result.reasons.every(r => !r.includes('Kernel'))).toBe(true);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. EVIDENCE PACK ASSEMBLY
// ═══════════════════════════════════════════════════════════════════════════

describe('EvidencePack assembly', () => {
    it('assembles a valid evidence pack from matrix rows', () => {
        const prod = makeSnapshot({ layer: 'production' });
        const preview = makeSnapshot({ layer: 'preview' });

        const rows: IntegrityMatrixRow[] = [
            { ...prod, match: 'OK', mismatchReasons: [] },
            { ...preview, match: 'OK', mismatchReasons: [] },
        ];

        const pack: EvidencePack = {
            generatedAt: new Date().toISOString(),
            referenceLayer: 'production',
            phase: prod.phase,
            layers: rows,
        };

        expect(pack.referenceLayer).toBe('production');
        expect(pack.layers).toHaveLength(2);
        expect(pack.layers[0].layer).toBe('production');
        expect(pack.layers[0].match).toBe('OK');
    });

    it('evidence pack serializes to valid JSON', () => {
        const pack: EvidencePack = {
            generatedAt: new Date().toISOString(),
            referenceLayer: 'production',
            phase: '34',
            layers: [{
                ...makeSnapshot({ layer: 'production' }),
                match: 'OK',
                mismatchReasons: [],
            }],
        };

        const json = JSON.stringify(pack, null, 2);
        const parsed = JSON.parse(json);
        expect(parsed.referenceLayer).toBe('production');
        expect(parsed.layers[0].commit).toBeTruthy();
    });
});
