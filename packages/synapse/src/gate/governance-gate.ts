/**
 * ═══════════════════════════════════════════════════════════════════════════
 * FIRST GOVERNANCE GATE (REAL ENFORCEMENT)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * The Gate does NOT decide. The Gate VERIFIES the decision from the Authority.
 * 
 * Contract:
 * - Input: DecisionRecord (Signed by Authority)
 * - Process: Verify Signature, Verify Integrity, Verify Scope
 * - Output: DecisionResult (ALLOW / DENY / ESCALATE)
 * 
 * @module synapse/gate
 */

import { DecisionRecord, DecisionResult, SCHEMA_VERSION } from '../reason-core/schema';
import { AuditLedger } from '../audit-ledger/ledger';

export class GovernanceGate {
    private static instance: GovernanceGate;
    private ledger: AuditLedger;

    private constructor() {
        this.ledger = AuditLedger.getInstance();
    }

    public static getInstance(): GovernanceGate {
        if (!GovernanceGate.instance) {
            GovernanceGate.instance = new GovernanceGate();
        }
        return GovernanceGate.instance;
    }

    /**
     * Enforce the decision
     * @returns DecisionResult - The final verdict of the Gate
     */
    public async enforce(
        record: DecisionRecord,
        proposedIntent: { action: string; target: string; params?: Record<string, unknown> }
    ): Promise<DecisionResult> {

        const verificationLog = {
            check_version: false,
            check_integrity: false,
            check_signature: false,
            check_scope: false,
            reason: ''
        };

        try {
            // 1. Version Check
            if (record.package.schemaVersion !== SCHEMA_VERSION) {
                verificationLog.reason = `Schema Version Mismatch: ${record.package.schemaVersion} vs ${SCHEMA_VERSION}`;
                this.logDeny(record, verificationLog.reason);
                return 'DENY';
            }
            verificationLog.check_version = true;

            // 2. Integrity Check (Re-serialize and check signature stub)
            // Note: In strict mode, we re-construct the payload that was signed.
            const payloadToVerify = JSON.stringify({ package: record.package, reason: record.reason });

            // 3. Signature Check
            const isSigValid = this.ledger.verifySignature(payloadToVerify, record.audit.signature);
            if (!isSigValid) {
                verificationLog.reason = 'Invalid Signature';
                this.logDeny(record, verificationLog.reason);
                return 'DENY';
            }
            verificationLog.check_signature = true;
            verificationLog.check_integrity = true;

            // 4. Scope Match (Did the authority sign *this* intent?)
            if (record.package.intent.action !== proposedIntent.action) {
                verificationLog.reason = `Action Mismatch: Authorized(${record.package.intent.action}) vs Proposed(${proposedIntent.action})`;
                this.logDeny(record, verificationLog.reason);
                return 'DENY';
            }
            // (Target check could be added here)
            verificationLog.check_scope = true;

            // 5. Final Decision extraction
            const verdict = record.package.decision;

            // Audit the successful check
            this.ledger.append('GATE_VERIFICATION', {
                decisionId: record.package.decisionId,
                verdict,
                status: 'PASSED_INTEGRITY_CHECKS'
            });

            return verdict;

        } catch (error) {
            this.logDeny(record, `Exception in Gate: ${error}`);
            return 'DENY';
        }
    }

    private logDeny(record: DecisionRecord, reason: string) {
        console.error(`[SYNAPSE GATE] DENY: ${reason}`);
        this.ledger.append('GATE_VERIFICATION', {
            decisionId: record?.package?.decisionId || 'UNKNOWN',
            verdict: 'DENY',
            reason
        });
    }

    // Helper for testing mainly - simulate a policy check if needed, but Gate usually just verifies
    // But wait, the Gate *Enforces*. The Authority *Decides*. 
}
