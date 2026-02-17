/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Phase Ledger — Unit Tests (Phase 34.3 — Hardened)
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { describe, it, expect } from 'vitest';
import {
    generateDocId,
    validateUpsertPayload,
    COLLECTION_PHASE_LEDGER,
    DEFAULT_PAGE_LIMIT,
    MAX_PAGE_LIMIT,
} from './phaseLedger/types';
import type { PhaseLedgerUpsertPayload, DeployEnvironment } from './phaseLedger/types';
import {
    signBody,
    verifyLedgerSignature,
    buildSignatureBase,
    validateTimestamp,
    validateNonce,
    MAX_TIMESTAMP_SKEW_MS,
    MIN_NONCE_HEX_LENGTH,
    COLLECTION_NONCES,
    NONCE_TTL_MS,
    ERR_MISSING_SIGNATURE,
    ERR_MISSING_TIMESTAMP,
    ERR_MISSING_NONCE,
    ERR_INVALID_NONCE,
    ERR_TIMESTAMP_SKEW,
    ERR_REPLAY,
    ERR_INVALID_SIGNATURE,
    ERR_SECRET_NOT_SET,
} from './phaseLedger/signer';

// ─── Test Fixtures ───────────────────────────────────────────────────────────

function makeValidPayload(overrides?: Partial<PhaseLedgerUpsertPayload>): PhaseLedgerUpsertPayload {
    return {
        phaseId: '34',
        commit: '628f2edc1c1effeacc994e44f890c8bb1334fbc3',
        tag: 'v0.32.5',
        version: '0.32.5',
        environment: 'production',
        integrity: {
            status: 'OK',
            governance: { kernelFrozen: true, hashValid: true, ok: true },
            errorCodes: [],
            signature: 'abc123',
            buildSha: '628f2ed',
        },
        buildInfo: { shaResolved: true, branch: 'main' },
        ...overrides,
    };
}

const TEST_SECRET = 'test-phase-ledger-secret-34';
const TEST_NONCE = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4'; // 32 hex chars

// ═══════════════════════════════════════════════════════════════════════════
// T1: Constants
// ═══════════════════════════════════════════════════════════════════════════

describe('Phase Ledger — Constants', () => {
    it('T1a — collection name is coreos_phase_ledger', () => {
        expect(COLLECTION_PHASE_LEDGER).toBe('coreos_phase_ledger');
    });

    it('T1b — default page limit is 20', () => {
        expect(DEFAULT_PAGE_LIMIT).toBe(20);
    });

    it('T1c — max page limit is 100', () => {
        expect(MAX_PAGE_LIMIT).toBe(100);
    });

    it('T1d — nonce collection is coreos_phase_ledger_nonces', () => {
        expect(COLLECTION_NONCES).toBe('coreos_phase_ledger_nonces');
    });

    it('T1e — timestamp skew is 5 minutes', () => {
        expect(MAX_TIMESTAMP_SKEW_MS).toBe(5 * 60 * 1000);
    });

    it('T1f — nonce TTL is 10 minutes', () => {
        expect(NONCE_TTL_MS).toBe(10 * 60 * 1000);
    });

    it('T1g — min nonce hex length is 32', () => {
        expect(MIN_NONCE_HEX_LENGTH).toBe(32);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// T2: generateDocId
// ═══════════════════════════════════════════════════════════════════════════

describe('Phase Ledger — generateDocId()', () => {
    it('T2a — generates {phaseId}_{environment}_{commitShort}', () => {
        expect(generateDocId('34', 'production', '628f2ed')).toBe('34_production_628f2ed');
    });

    it('T2b — preview environment', () => {
        expect(generateDocId('34.1', 'preview', 'abc1234')).toBe('34.1_preview_abc1234');
    });

    it('T2c — special chars in phaseId', () => {
        expect(generateDocId('33A', 'production', '5e1e493')).toBe('33A_production_5e1e493');
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// T3: validateUpsertPayload
// ═══════════════════════════════════════════════════════════════════════════

describe('Phase Ledger — validateUpsertPayload()', () => {
    it('T3a — valid payload passes', () => {
        const result = validateUpsertPayload(makeValidPayload());
        expect(result.valid).toBe(true);
    });

    it('T3b — null payload fails', () => {
        const result = validateUpsertPayload(null);
        expect(result.valid).toBe(false);
    });

    it('T3c — missing phaseId fails', () => {
        const p = makeValidPayload();
        (p as unknown as Record<string, unknown>).phaseId = '';
        const result = validateUpsertPayload(p);
        expect(result.valid).toBe(false);
    });

    it('T3d — invalid environment fails', () => {
        const p = makeValidPayload({ environment: 'staging' as DeployEnvironment });
        const result = validateUpsertPayload(p);
        expect(result.valid).toBe(false);
    });

    it('T3e — missing integrity fails', () => {
        const p = { ...makeValidPayload(), integrity: undefined };
        const result = validateUpsertPayload(p);
        expect(result.valid).toBe(false);
    });

    it('T3f — missing buildInfo fails', () => {
        const p = { ...makeValidPayload(), buildInfo: undefined };
        const result = validateUpsertPayload(p);
        expect(result.valid).toBe(false);
    });

    it('T3g — missing integrity.governance fails', () => {
        const p = makeValidPayload();
        (p.integrity as unknown as Record<string, unknown>).governance = undefined;
        const result = validateUpsertPayload(p);
        expect(result.valid).toBe(false);
    });

    it('T3h — preview environment passes', () => {
        const result = validateUpsertPayload(makeValidPayload({ environment: 'preview' }));
        expect(result.valid).toBe(true);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// T4: Signature Base (Phase 34.3)
// ═══════════════════════════════════════════════════════════════════════════

describe('Phase Ledger — buildSignatureBase()', () => {
    const body = JSON.stringify(makeValidPayload());

    it('T4a — format is timestamp.nonce.body', () => {
        const base = buildSignatureBase('1700000000000', TEST_NONCE, body);
        expect(base).toBe(`1700000000000.${TEST_NONCE}.${body}`);
    });

    it('T4b — different timestamps produce different bases', () => {
        const a = buildSignatureBase('1700000000000', TEST_NONCE, body);
        const b = buildSignatureBase('1700000000001', TEST_NONCE, body);
        expect(a).not.toBe(b);
    });

    it('T4c — different nonces produce different bases', () => {
        const a = buildSignatureBase('1700000000000', TEST_NONCE, body);
        const nonceB = 'ff'.repeat(16);
        const b = buildSignatureBase('1700000000000', nonceB, body);
        expect(a).not.toBe(b);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// T5: HMAC Signer (Phase 34.3 — with timestamp+nonce base)
// ═══════════════════════════════════════════════════════════════════════════

describe('Phase Ledger — HMAC Signer (hardened)', () => {
    const body = JSON.stringify(makeValidPayload());
    const ts = Date.now().toString();
    const base = buildSignatureBase(ts, TEST_NONCE, body);

    it('T5a — signBody produces 64-char hex string', () => {
        const sig = signBody(base, TEST_SECRET);
        expect(sig).toBeTruthy();
        expect(sig!.length).toBe(64);
        expect(/^[a-f0-9]+$/.test(sig!)).toBe(true);
    });

    it('T5b — same input + same secret → same signature', () => {
        expect(signBody(base, TEST_SECRET)).toBe(signBody(base, TEST_SECRET));
    });

    it('T5c — different secret → different signature', () => {
        expect(signBody(base, 'secret-a')).not.toBe(signBody(base, 'secret-b'));
    });

    it('T5d — different body → different signature', () => {
        const other = JSON.stringify({ ...makeValidPayload(), phaseId: '35' });
        const otherBase = buildSignatureBase(ts, TEST_NONCE, other);
        expect(signBody(base, TEST_SECRET)).not.toBe(signBody(otherBase, TEST_SECRET));
    });

    it('T5e — signBody returns null without secret', () => {
        const origEnv = process.env.OPS_PHASE_LEDGER_SECRET;
        delete process.env.OPS_PHASE_LEDGER_SECRET;
        expect(signBody(base)).toBeNull();
        if (origEnv) process.env.OPS_PHASE_LEDGER_SECRET = origEnv;
    });

    it('T5f — verifyLedgerSignature passes with correct HMAC', () => {
        const sig = signBody(base, TEST_SECRET)!;
        expect(verifyLedgerSignature(base, sig, TEST_SECRET)).toBe(true);
    });

    it('T5g — verifyLedgerSignature rejects wrong signature', () => {
        expect(verifyLedgerSignature(base, 'wrong'.repeat(16), TEST_SECRET)).toBe(false);
    });

    it('T5h — verifyLedgerSignature rejects tampered body', () => {
        const sig = signBody(base, TEST_SECRET)!;
        const tampered = buildSignatureBase(ts, TEST_NONCE, body.replace('34', '99'));
        expect(verifyLedgerSignature(tampered, sig, TEST_SECRET)).toBe(false);
    });

    it('T5i — verifyLedgerSignature rejects tampered timestamp', () => {
        const sig = signBody(base, TEST_SECRET)!;
        const tampered = buildSignatureBase('9999999999999', TEST_NONCE, body);
        expect(verifyLedgerSignature(tampered, sig, TEST_SECRET)).toBe(false);
    });

    it('T5j — verifyLedgerSignature rejects tampered nonce', () => {
        const sig = signBody(base, TEST_SECRET)!;
        const tampered = buildSignatureBase(ts, 'ee'.repeat(16), body);
        expect(verifyLedgerSignature(tampered, sig, TEST_SECRET)).toBe(false);
    });

    it('T5k — verifyLedgerSignature rejects different-length signature', () => {
        expect(verifyLedgerSignature(base, 'short', TEST_SECRET)).toBe(false);
    });

    it('T5l — verifyLedgerSignature returns false without secret', () => {
        const origEnv = process.env.OPS_PHASE_LEDGER_SECRET;
        delete process.env.OPS_PHASE_LEDGER_SECRET;
        expect(verifyLedgerSignature(base, 'x'.repeat(64))).toBe(false);
        if (origEnv) process.env.OPS_PHASE_LEDGER_SECRET = origEnv;
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// T6: Timestamp Validation (Phase 34.3)
// ═══════════════════════════════════════════════════════════════════════════

describe('Phase Ledger — validateTimestamp()', () => {
    it('T6a — current timestamp passes', () => {
        expect(validateTimestamp(Date.now())).toBe(true);
    });

    it('T6b — 1 minute ago passes', () => {
        expect(validateTimestamp(Date.now() - 60_000)).toBe(true);
    });

    it('T6c — 4 minutes ago passes', () => {
        expect(validateTimestamp(Date.now() - 4 * 60_000)).toBe(true);
    });

    it('T6d — 6 minutes ago fails (> 5 min skew)', () => {
        expect(validateTimestamp(Date.now() - 6 * 60_000)).toBe(false);
    });

    it('T6e — 1 hour ago fails', () => {
        expect(validateTimestamp(Date.now() - 60 * 60_000)).toBe(false);
    });

    it('T6f — future by 1 minute passes', () => {
        expect(validateTimestamp(Date.now() + 60_000)).toBe(true);
    });

    it('T6g — future by 6 minutes fails', () => {
        expect(validateTimestamp(Date.now() + 6 * 60_000)).toBe(false);
    });

    it('T6h — NaN fails', () => {
        expect(validateTimestamp(NaN)).toBe(false);
    });

    it('T6i — 0 fails', () => {
        expect(validateTimestamp(0)).toBe(false);
    });

    it('T6j — negative fails', () => {
        expect(validateTimestamp(-1)).toBe(false);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// T7: Nonce Validation (Phase 34.3)
// ═══════════════════════════════════════════════════════════════════════════

describe('Phase Ledger — validateNonce()', () => {
    it('T7a — 32-char hex passes', () => {
        expect(validateNonce('a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4')).toBe(true);
    });

    it('T7b — 64-char hex passes (openssl rand -hex 32)', () => {
        expect(validateNonce('a'.repeat(64))).toBe(true);
    });

    it('T7c — 31-char hex fails (< 32)', () => {
        expect(validateNonce('a'.repeat(31))).toBe(false);
    });

    it('T7d — empty string fails', () => {
        expect(validateNonce('')).toBe(false);
    });

    it('T7e — non-hex chars fail', () => {
        expect(validateNonce('g'.repeat(32))).toBe(false);
    });

    it('T7f — mixed case hex passes', () => {
        expect(validateNonce('A1B2C3D4E5F6a1b2c3d4e5f6A1B2C3D4')).toBe(true);
    });

    it('T7g — spaces fail', () => {
        expect(validateNonce('a1b2 c3d4 e5f6 a1b2 c3d4 e5f6 a1b2')).toBe(false);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// T8: Error Code Constants
// ═══════════════════════════════════════════════════════════════════════════

describe('Phase Ledger — Error Codes', () => {
    it('T8a — all error codes are defined strings', () => {
        const codes = [
            ERR_MISSING_SIGNATURE,
            ERR_MISSING_TIMESTAMP,
            ERR_MISSING_NONCE,
            ERR_INVALID_NONCE,
            ERR_TIMESTAMP_SKEW,
            ERR_REPLAY,
            ERR_INVALID_SIGNATURE,
            ERR_SECRET_NOT_SET,
        ];
        codes.forEach(c => {
            expect(typeof c).toBe('string');
            expect(c.startsWith('OPS_LEDGER_')).toBe(true);
        });
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// T9: UI Tooltip Strings (sanity check)
// ═══════════════════════════════════════════════════════════════════════════

describe('Phase Ledger — UI Tooltip Strings', () => {
    const previewTooltip = 'No snapshot yet (CI write-back not run or OPS_PHASE_LEDGER_SECRET not set). Snapshots available in History after first CI write.';
    const githubTooltip = 'Not collected in runtime (no GitHub token by policy). Provided via CI write-back only.';
    const genericTooltip = 'N/A — no snapshot written yet. Enable CI write-back.';
    const helperText = 'Hover N/A badges for details';

    it('T9a — preview tooltip contains CI write-back explanation', () => {
        expect(previewTooltip).toContain('CI write-back');
        expect(previewTooltip).toContain('OPS_PHASE_LEDGER_SECRET');
    });

    it('T9b — github tooltip explains policy', () => {
        expect(githubTooltip).toContain('no GitHub token by policy');
        expect(githubTooltip).toContain('CI write-back only');
    });

    it('T9c — generic tooltip is concise', () => {
        expect(genericTooltip.length).toBeLessThan(60);
    });

    it('T9d — helper text mentions N/A badges', () => {
        expect(helperText).toContain('N/A');
    });
});
