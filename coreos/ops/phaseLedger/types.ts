/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Phase Ledger — Data Model (Phase 34.1)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Append-only Firestore collection to record every Phase deployment snapshot.
 * Each document captures build-info, integrity, governance, and ledger state
 * at the time of deployment — creating an immutable history of all releases.
 *
 * Collection: coreos_phase_ledger
 */

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

export const COLLECTION_PHASE_LEDGER = 'coreos_phase_ledger';

/** Max results per page */
export const DEFAULT_PAGE_LIMIT = 20;
export const MAX_PAGE_LIMIT = 100;

// ═══════════════════════════════════════════════════════════════════════════
// CORE TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type DeployEnvironment = 'preview' | 'production';
export type IntegrityStatus = 'OK' | 'DEGRADED';

export interface GovernanceState {
    kernelFrozen: boolean;
    hashValid: boolean;
    ok: boolean;
}

export interface IntegritySnapshot {
    status: IntegrityStatus;
    governance: GovernanceState;
    errorCodes: string[];
    signature: string;
    buildSha: string;
}

export interface BuildInfoSnapshot {
    shaResolved: boolean;
    branch?: string;
}

export interface LedgerState {
    rootHash?: string;
    lastEntryHash?: string;
    chainLength?: number;
    ok?: boolean;
}

export interface EvidenceLinks {
    previewUrl?: string;
    productionUrl?: string;
    ciRunUrl?: string;
}

/**
 * Core Phase Ledger Snapshot — one document in Firestore.
 * Written by CI or manually via the upsert endpoint.
 */
export interface PhaseLedgerSnapshot {
    phaseId: string;
    commit: string;
    commitShort: string;
    tag: string;
    version: string;
    environment: DeployEnvironment;
    integrity: IntegritySnapshot;
    buildInfo: BuildInfoSnapshot;
    ledger?: LedgerState;
    evidence?: EvidenceLinks;
    createdAt: unknown; // FirebaseFirestore.Timestamp | FieldValue
}

// ═══════════════════════════════════════════════════════════════════════════
// UPSERT PAYLOAD (inbound from CI)
// ═══════════════════════════════════════════════════════════════════════════

/** Payload accepted by POST /api/ops/phase-ledger/upsert */
export interface PhaseLedgerUpsertPayload {
    phaseId: string;
    commit: string;
    tag: string;
    version: string;
    environment: DeployEnvironment;
    integrity: IntegritySnapshot;
    buildInfo: BuildInfoSnapshot;
    ledger?: LedgerState;
    evidence?: EvidenceLinks;
}

// ═══════════════════════════════════════════════════════════════════════════
// API RESPONSE TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface PhaseLedgerListResponse {
    ok: boolean;
    data: {
        items: (PhaseLedgerSnapshot & { id: string })[];
        nextCursor: string | null;
        total: number;
    };
}

export interface PhaseLedgerDetailResponse {
    ok: boolean;
    data: {
        phaseId: string;
        snapshots: (PhaseLedgerSnapshot & { id: string })[];
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate deterministic document ID for upsert deduplication.
 * Format: {phaseId}_{environment}_{commitShort}
 */
export function generateDocId(
    phaseId: string,
    environment: DeployEnvironment,
    commitShort: string,
): string {
    return `${phaseId}_${environment}_${commitShort}`;
}

/**
 * Validate a PhaseLedgerUpsertPayload has all required fields.
 * Returns null if valid, or an error message string.
 */
export function validateUpsertPayload(
    payload: unknown,
): { valid: true; data: PhaseLedgerUpsertPayload } | { valid: false; error: string } {
    if (!payload || typeof payload !== 'object') {
        return { valid: false, error: 'Payload must be a JSON object' };
    }

    const p = payload as Record<string, unknown>;

    // Required string fields
    const requiredStrings = ['phaseId', 'commit', 'tag', 'version', 'environment'] as const;
    for (const field of requiredStrings) {
        if (typeof p[field] !== 'string' || !(p[field] as string).trim()) {
            return { valid: false, error: `Missing or invalid field: ${field}` };
        }
    }

    // Environment must be preview or production
    if (p.environment !== 'preview' && p.environment !== 'production') {
        return { valid: false, error: 'environment must be "preview" or "production"' };
    }

    // Integrity object
    if (!p.integrity || typeof p.integrity !== 'object') {
        return { valid: false, error: 'Missing integrity object' };
    }

    const integrity = p.integrity as Record<string, unknown>;
    if (typeof integrity.status !== 'string') {
        return { valid: false, error: 'Missing integrity.status' };
    }
    if (!integrity.governance || typeof integrity.governance !== 'object') {
        return { valid: false, error: 'Missing integrity.governance' };
    }

    // BuildInfo object
    if (!p.buildInfo || typeof p.buildInfo !== 'object') {
        return { valid: false, error: 'Missing buildInfo object' };
    }

    return { valid: true, data: payload as PhaseLedgerUpsertPayload };
}
