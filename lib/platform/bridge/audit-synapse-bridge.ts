/**
 * Audit → SYNAPSE Bridge
 * 
 * Phase 12.2: Bridges Platform Audit Logs to SYNAPSE Ledger
 * 
 * SYNAPSE Kernel: FROZEN ❄️ - Uses existing ledger.ts (no modification)
 * 
 * Purpose:
 * - Forward audit events to SYNAPSE Ledger (append-only)
 * - Preserve traceId from Platform
 * - Generate cryptographic attestation (hash + signature)
 * - Enable cross-boundary verification
 */

import type { AuditLog } from '../data/audit.repo';

// ============================================================================
// Types
// ============================================================================

export interface BridgeResult {
    ok: boolean;
    ledgerIndex?: number;
    hash?: string;
    signature?: string;
    error?: string;
}

export interface VerificationResult {
    found: boolean;
    verified: boolean;
    ledgerIndex?: number;
    hash?: string;
    chainValid?: boolean;
    error?: string;
}

export interface AttestationProof {
    platformId: string;
    traceId: string;
    ledgerIndex: number;
    hash: string;
    previousHash: string;
    signature: string;
    timestamp: number;
    authorityId: string;
}

// ============================================================================
// Ledger Access (Dynamic Import for Monorepo Compatibility)
// ============================================================================

// Cached ledger instance
let _ledgerModule: typeof import('@/packages/synapse/src/audit-ledger/ledger') | null = null;

async function getLedgerModule() {
    if (!_ledgerModule) {
        _ledgerModule = await import('@/packages/synapse/src/audit-ledger/ledger');
    }
    return _ledgerModule;
}

async function getLedger() {
    const { AuditLedger } = await getLedgerModule();
    return AuditLedger.getInstance();
}

// ============================================================================
// Bridge Functions
// ============================================================================

/**
 * Bridge an audit log from Platform to SYNAPSE Ledger.
 * 
 * This function:
 * 1. Takes Platform audit log
 * 2. Appends to SYNAPSE Ledger (hash chain)
 * 3. Signs the entry
 * 4. Returns attestation proof
 * 
 * DETERMINISTIC: Same audit data → Same hash (given same previous hash)
 */
export async function bridgeAuditToSynapse(auditLog: AuditLog): Promise<BridgeResult> {
    try {
        const ledger = await getLedger();

        // Prepare audit data for ledger (preserve traceId)
        const auditData = {
            platformId: auditLog.id,
            traceId: auditLog.traceId,
            actorId: auditLog.actorId,
            actorRole: auditLog.actorRole,
            action: auditLog.action,
            target: auditLog.target,
            decision: auditLog.decision,
            policyId: auditLog.policyId,
            ts: auditLog.ts,
        };

        // Append to ledger (SHA-256 hash chain)
        const entry = ledger.append('DECISION_RECORDED', auditData);

        // Sign the hash for attestation
        const signature = ledger.sign(entry.hash);

        return {
            ok: true,
            ledgerIndex: entry.index,
            hash: entry.hash,
            signature,
        };
    } catch (error) {
        return {
            ok: false,
            error: (error as Error).message,
        };
    }
}

/**
 * Verify an audit log exists in SYNAPSE Ledger by traceId.
 * 
 * Returns verification result including chain integrity status.
 */
export async function verifyAuditInLedger(traceId: string): Promise<VerificationResult> {
    try {
        const ledger = await getLedger();
        const chain = ledger.getChain();

        // Search for entry with matching traceId
        const entry = chain.find((e: { data: unknown }) => {
            const data = e.data as { traceId?: string };
            return data?.traceId === traceId;
        });

        if (!entry) {
            return {
                found: false,
                verified: false,
                error: `No ledger entry found for traceId: ${traceId}`,
            };
        }

        // Verify chain integrity up to this entry
        const verification = ledger.verifyChain();
        const isEntryValid = verification.isValid ||
            (verification.lastValidIndex >= entry.index);

        return {
            found: true,
            verified: isEntryValid,
            ledgerIndex: entry.index,
            hash: entry.hash,
            chainValid: verification.isValid,
        };
    } catch (error) {
        return {
            found: false,
            verified: false,
            error: (error as Error).message,
        };
    }
}

/**
 * Generate a complete attestation proof for an audit entry.
 * 
 * This proof can be used for external verification.
 */
export async function generateAttestationProof(traceId: string): Promise<AttestationProof | null> {
    const ledger = await getLedger();
    const chain = ledger.getChain();

    const entry = chain.find((e: { data: unknown }) => {
        const data = e.data as { traceId?: string; platformId?: string };
        return data?.traceId === traceId;
    });

    if (!entry) {
        return null;
    }

    const data = entry.data as { platformId?: string; traceId?: string };
    const signature = ledger.sign(entry.hash);

    return {
        platformId: data.platformId || '',
        traceId: data.traceId || traceId,
        ledgerIndex: entry.index,
        hash: entry.hash,
        previousHash: entry.previousHash,
        signature,
        timestamp: entry.timestamp,
        authorityId: ledger.getAuthorityId(),
    };
}

/**
 * Verify a signature against the ledger's authority.
 */
export async function verifySignature(hash: string, signature: string): Promise<boolean> {
    const ledger = await getLedger();
    return ledger.verifySignature(hash, signature);
}

/**
 * Get ledger verification summary.
 */
export async function getLedgerSummary(): Promise<{
    totalEntries: number;
    chainValid: boolean;
    authorityId: string;
    publicKey: string;
}> {
    const ledger = await getLedger();
    const snapshot = ledger.exportSnapshot();

    return {
        totalEntries: snapshot.totalEntries,
        chainValid: snapshot.chainValid,
        authorityId: snapshot.authorityId,
        publicKey: snapshot.publicKey,
    };
}
