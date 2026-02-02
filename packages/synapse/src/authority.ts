/**
 * SYNAPSE AUTHORITY
 * The sovereign issuer of Decision Records.
 * 
 * In a real system, this would be a separate service.
 * Here, it is an isolated module that acts as the source of truth.
 */

import { DecisionRecord, DecisionPackage, ReasonCore, SCHEMA_VERSION } from './reason-core/schema';
import { AuditLedger } from './audit-ledger/ledger';

export class SynapseAuthority {
    private static instance: SynapseAuthority;
    private ledger: AuditLedger;

    private constructor() {
        this.ledger = AuditLedger.getInstance();
    }

    public static getInstance(): SynapseAuthority {
        if (!SynapseAuthority.instance) {
            SynapseAuthority.instance = new SynapseAuthority();
        }
        return SynapseAuthority.instance;
    }

    /**
     * Request a decision for an intent.
     * The Authority evaluates the intent against policies and issues a Signed Record.
     */
    public async requestDecision(
        intent: { action: string; target: string; params: Record<string, unknown> },
        context: { actorId: string; userRole: string }
    ): Promise<DecisionRecord> {

        // 1. Policy Evaluation (Simulation)
        // In real system, this calls PolicyEngine.evaluate()
        const decisionResult = this.evaluatePolicy(intent, context);

        // 2. Construct Package
        const timestamp = Date.now();
        const decisionId = `dec-${timestamp}-${Math.random().toString(36).substr(2, 9)}`;
        const traceId = `trace-${timestamp}`;

        const pkg: DecisionPackage = {
            decisionId,
            traceId,
            timestamp,
            actorId: context.actorId,
            schemaVersion: SCHEMA_VERSION,
            intent: {
                action: intent.action,
                target: intent.target,
                params: intent.params
            },
            context: {
                systemState: 'nominal', // Mock
                userRole: context.userRole,
                resourceSensitivity: 'low',
                activeConstraints: []
            },
            decision: decisionResult
        };

        const reason: ReasonCore = {
            reason_codes: [],
            policy_refs: ['policy-root'],
            rule_hits: [],
            evidence: {},
            missing_requirements: []
        };

        // 3. Serialize and Sign
        // The signature covers the Package + Reason
        const payloadToSign = JSON.stringify({ package: pkg, reason });
        const signature = this.ledger.sign(payloadToSign);

        // 4. Create Record
        const record: DecisionRecord = {
            package: pkg,
            reason,
            audit: {
                ledger_ref: 'pending-log', // Will be updated on append or referenced by hash
                previous_hash: 'chained-in-ledger',
                signature,
                signerId: this.ledger.getAuthorityId()
            }
        };

        // 5. Log to Ledger (Authority Level Logging)
        const entry = this.ledger.append('DECISION_RECORDED', record);

        // Return the full record (with audit trail potentially updated)
        return {
            ...record,
            audit: {
                ...record.audit,
                ledger_ref: entry.hash, // Link to the specific ledger entry
                previous_hash: entry.previousHash // Link to chain
            }
        };
    }

    /**
     * Internal Policy Logic (Stub for v1)
     */
    private evaluatePolicy(intent: any, context: any): 'ALLOW' | 'DENY' {
        // [GOVERNANCE] Fail-safe default
        if (!intent || !intent.action) return 'DENY';

        // Example: Forbidden action
        if (intent.action === 'NUKE_SYSTEM') return 'DENY';
        if (intent.action === 'WRITE_KERNEL' && context.userRole !== 'admin') return 'DENY';

        // Default Allow for verified intents in this v1 simulation
        return 'ALLOW';
    }
}
