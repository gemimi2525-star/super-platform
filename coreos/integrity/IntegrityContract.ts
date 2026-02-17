/**
 * ═══════════════════════════════════════════════════════════════════════════
 * INTEGRITY CONTRACT — Phase 34 (Core Standard)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Shared types for the Integrity Transparency Layer.
 * Used by: UI components, server endpoints, future apps.
 *
 * This is the single source of truth for integrity data shapes across
 * the entire platform.
 *
 * @module coreos/integrity/IntegrityContract
 * @version 1.0.0
 */

// ═══════════════════════════════════════════════════════════════════════════
// LAYER ENUM
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Represents a verification layer in the integrity matrix.
 * Each layer corresponds to a deployment target or data source.
 */
export type IntegrityLayer = 'production' | 'preview' | 'ledger' | 'local' | 'github';

/** Ordered for display */
export const LAYER_ORDER: IntegrityLayer[] = ['production', 'preview', 'ledger', 'local', 'github'];

/** Human-readable labels */
export const LAYER_LABELS: Record<IntegrityLayer, string> = {
    production: 'Production',
    preview: 'Preview',
    ledger: 'Ledger / Firestore',
    local: 'Local (Pasted)',
    github: 'GitHub',
};

// ═══════════════════════════════════════════════════════════════════════════
// INTEGRITY SNAPSHOT
// ═══════════════════════════════════════════════════════════════════════════

/** Data captured from a single integrity layer. */
export interface IntegritySnapshot {
    layer: IntegrityLayer;
    commit: string | null;
    version: string | null;
    lockedTag: string | null;
    shaResolved: boolean | null;
    governance: {
        kernelFrozen: boolean;
        hashValid: boolean;
    } | null;
    ledger: {
        rootHash: string;
        lastHash: string;
        chainLength: number;
        ok: boolean;
    } | null;
    signature: string | null;
    status: string;           // 'OK' | 'DEGRADED' | 'N/A' | 'ERROR'
    errorCodes: string[];
    phase: string | null;
    fetchedAt: string;         // ISO timestamp
}

// ═══════════════════════════════════════════════════════════════════════════
// MATRIX ROW  (snapshot + comparison result)
// ═══════════════════════════════════════════════════════════════════════════

export type MatchStatus = 'OK' | 'MISMATCH' | 'N/A';

/** A row in the Integrity Matrix — snapshot data + comparison result. */
export interface IntegrityMatrixRow extends IntegritySnapshot {
    match: MatchStatus;
    mismatchReasons: string[];
}

// ═══════════════════════════════════════════════════════════════════════════
// EVIDENCE PACK
// ═══════════════════════════════════════════════════════════════════════════

/** Exportable evidence bundle for audit/phase-close. */
export interface EvidencePack {
    generatedAt: string;       // ISO timestamp
    referenceLayer: 'production';
    phase: string | null;
    layers: IntegrityMatrixRow[];
}

// ═══════════════════════════════════════════════════════════════════════════
// LEDGER STATUS (endpoint response shape)
// ═══════════════════════════════════════════════════════════════════════════

/** Response shape of GET /api/ops/ledger-status */
export interface LedgerStatusResponse {
    ok: boolean;
    ledgerRootHash: string;
    lastEntryHash: string;
    chainLength: number;
    isValid: boolean;
    fetchedAt: string;         // ISO timestamp
}

// ═══════════════════════════════════════════════════════════════════════════
// LOCAL SNAPSHOT (paste format)
// ═══════════════════════════════════════════════════════════════════════════

/** Shape that a user pastes for local comparison. */
export interface LocalSnapshotInput {
    commit: string;
    version: string;
    lockedTag?: string;
    phase?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// MISMATCH DETECTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Compare a layer snapshot against the reference (production) snapshot.
 * Returns match status and a list of human-readable mismatch reasons.
 */
export function detectMismatch(
    reference: IntegritySnapshot,
    target: IntegritySnapshot,
): { match: MatchStatus; reasons: string[] } {
    // Layers that don't have real data → N/A
    if (target.status === 'N/A' || target.status === 'ERROR') {
        return { match: 'N/A', reasons: [] };
    }

    const reasons: string[] = [];

    // Commit check (short-sha comparison, 7 chars)
    if (reference.commit && target.commit) {
        const refShort = reference.commit.slice(0, 7);
        const tgtShort = target.commit.slice(0, 7);
        if (refShort !== tgtShort) {
            reasons.push(`Commit mismatch: ${refShort} ≠ ${tgtShort}`);
        }
    }

    // Version check
    if (reference.version && target.version) {
        const normalize = (v: string) => v.replace(/^v/, '');
        if (normalize(reference.version) !== normalize(target.version)) {
            reasons.push(`Version mismatch: ${reference.version} ≠ ${target.version}`);
        }
    }

    // LockedTag check
    if (reference.lockedTag && target.lockedTag) {
        if (reference.lockedTag !== target.lockedTag) {
            reasons.push(`Tag mismatch: ${reference.lockedTag} ≠ ${target.lockedTag}`);
        }
    }

    // Governance checks
    if (reference.governance && target.governance) {
        if (reference.governance.kernelFrozen !== target.governance.kernelFrozen) {
            reasons.push(`Kernel frozen mismatch: ${reference.governance.kernelFrozen} ≠ ${target.governance.kernelFrozen}`);
        }
        if (reference.governance.hashValid !== target.governance.hashValid) {
            reasons.push(`Hash valid mismatch: ${reference.governance.hashValid} ≠ ${target.governance.hashValid}`);
        }
    }

    // Signature check (only if both present)
    if (reference.signature && target.signature && target.layer !== 'ledger' && target.layer !== 'local') {
        if (reference.signature !== target.signature) {
            reasons.push(`Signature mismatch`);
        }
    }

    return {
        match: reasons.length === 0 ? 'OK' : 'MISMATCH',
        reasons,
    };
}
