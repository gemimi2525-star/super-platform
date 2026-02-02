/**
 * SYNAPSE AUTHORITY
 * The sovereign issuer of Decision Records.
 * 
 * In a real system, this would be a separate service.
 * Here, it is an isolated module that acts as the source of truth.
 */

import { DecisionRecord, DecisionPackage, ReasonCore, SCHEMA_VERSION } from './reason-core/schema';
import { AuditLedger } from './audit-ledger/ledger';
import { SynapsePolicyEngine } from './policy-engine/engine';

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

        // 1. Policy Evaluation (REAL)
        const engine = SynapsePolicyEngine.getInstance();

        // Map context to Synapse Security Context
        const securityContext = {
            authenticated: true, // Mock for v1
            userId: context.actorId,
            role: context.userRole as any, // Cast to internal type
            stepUpActive: false, // Mock
            stepUpExpiry: null,
            policies: context.userRole === 'admin' ? ['admin.access', 'sys.admin', 'audit.read'] : []
        };

        const evaluationResult = engine.evaluate(intent, { security: securityContext });

        // Destructure result
        const { decision, policy } = evaluationResult;

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

            // Policy Binding (Immutable Governance)
            policyId: policy.id,
            policyVersion: policy.version,

            intent: {
                action: intent.action,
                target: intent.target,
                params: intent.params
            },
            context: {
                systemState: 'nominal',
                userRole: context.userRole,
                resourceSensitivity: 'low',
                activeConstraints: []
            },
            decision: decision
        };

        const reason: ReasonCore = {
            reason_codes: [],
            policy_refs: [`${policy.id}@${policy.version}`],
            rule_hits: [],
            evidence: { source: 'SynapsePolicyEngine', policyIdentity: policy },
            missing_requirements: []
        };

        // 3. Serialize and Sign
        const payloadToSign = JSON.stringify({ package: pkg, reason });
        const signature = this.ledger.sign(payloadToSign);

        // 4. Create Record
        const record: DecisionRecord = {
            package: pkg,
            reason,
            audit: {
                ledger_ref: 'pending-log',
                previous_hash: 'chained-in-ledger',
                signature,
                signerId: this.ledger.getAuthorityId()
            }
        };

        // 5. Log to Ledger
        const entry = this.ledger.append('DECISION_RECORDED', record);

        return {
            ...record,
            audit: {
                ...record.audit,
                ledger_ref: entry.hash,
                previous_hash: entry.previousHash
            }
        };
    }
}
