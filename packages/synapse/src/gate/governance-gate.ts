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

import { ApprovalToken } from '../approval/types';
import { ApprovalService } from '../approval/service';

export class GovernanceGate {
    private static instance: GovernanceGate;
    private ledger: AuditLedger;
    private approvalService: ApprovalService;

    private constructor() {
        this.ledger = AuditLedger.getInstance();
        this.approvalService = ApprovalService.getInstance();
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
        proposedIntent: { action: string; target: string; params?: Record<string, unknown> },
        token?: ApprovalToken
    ): Promise<DecisionResult> {

        const verificationLog = {
            check_version: false,
            check_integrity: false,
            check_signature: false,
            check_scope: false,
            check_stepup: false,
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
            const payloadToVerify = JSON.stringify({ package: record.package, reason: record.reason });
            const isSigValid = this.ledger.verifySignature(payloadToVerify, record.audit.signature);
            if (!isSigValid) {
                verificationLog.reason = 'Invalid Signature';
                this.logDeny(record, verificationLog.reason);
                return 'DENY';
            }
            verificationLog.check_signature = true;
            verificationLog.check_integrity = true;

            // 3. Scope Match
            if (record.package.intent.action !== proposedIntent.action) {
                verificationLog.reason = `Action Mismatch: Authorized(${record.package.intent.action}) vs Proposed(${proposedIntent.action})`;
                this.logDeny(record, verificationLog.reason);
                return 'DENY';
            }
            verificationLog.check_scope = true;

            // 4. Final Decision Logic
            let verdict = record.package.decision;

            if (verdict === 'ESCALATE') {
                // STEP-UP ENFORCEMENT
                if (token) {
                    const isTokenValid = this.approvalService.verify(token, record.package.decisionId, proposedIntent);
                    if (isTokenValid) {
                        console.log(`[SYNAPSE GATE] Step-Up Verified: Token ${token.tokenId}`);
                        verdict = 'ALLOW'; // Override verdict to ALLOW
                        verificationLog.check_stepup = true;
                    } else {
                        verificationLog.reason = 'Invalid Step-Up Token';
                        this.logDeny(record, verificationLog.reason);
                        return 'DENY';
                    }
                } else {
                    // Pass validation but return ESCALATE to signal Step-Up needed
                    // (Caller must handle initiating the loop)
                    // Actually, strict gate says: "If ESCALATE and no token => Block execution, return ESCALATE status"
                    console.log(`[SYNAPSE GATE] ESCALATE: Step-Up Required`);
                    return 'ESCALATE';
                }
            }

            // Audit the successful check
            this.ledger.append('GATE_VERIFICATION', {
                decisionId: record.package.decisionId,
                verdict,
                status: 'PASSED_INTEGRITY_CHECKS',
                stepUp: verificationLog.check_stepup
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
