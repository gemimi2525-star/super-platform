/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SYNAPSE Adapter — APICOREDATA → SYNAPSE Interface
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * All SYNAPSE interactions MUST go through this adapter layer.
 * APICOREDATA must not call SYNAPSE directly.
 * 
 * The adapter:
 * 1. Maps UI/system actions to SYNAPSE intents
 * 2. Receives decisions (ALLOW / DENY / SKIP)
 * 3. Translates decisions into OS behavior
 * 
 * APICOREDATA MUST NOT override or mutate SYNAPSE decisions.
 * 
 * @module governance/synapse
 * @version 1.0.0
 */

// ═══════════════════════════════════════════════════════════════════════════
// IMPORTS FROM COREOS MODULES
// ═══════════════════════════════════════════════════════════════════════════

// Kernel exports
export {
    getKernel,
    resetAll,
    isCalmState
} from '../../coreos/index';

// State exports
export { getStateStore } from '../../coreos/state';

// Event Bus exports
export { getEventBus } from '../../coreos/event-bus';

// Capability Graph exports
export {
    getCapabilityGraph,
    validateManifestRegistry
} from '../../coreos/capability-graph';

// Policy Engine exports
export {
    getPolicyEngine,
    resetPolicyEngine
} from '../../coreos/policy-engine';

// Window Manager exports
export { getWindowManager } from '../../coreos/window-manager';

// Cognitive Deriver exports
export {
    deriveCognitiveMode,
    explainCognitiveMode
} from '../../coreos/cognitive-deriver';

// Types
export type {
    Intent,
    CapabilityId,
    SpaceId,
    CognitiveMode,
    SecurityContext
} from '../../coreos/types';

// Intent Factory and correlation ID
export { IntentFactory, createCorrelationId } from '../../coreos/types';


// Note: DecisionExplanation is used internally in SYNAPSE, not needed in adapter

// ═══════════════════════════════════════════════════════════════════════════
// ADAPTER INTERFACE
// ═══════════════════════════════════════════════════════════════════════════

import { getKernel as _getKernel } from '../../coreos/index';
import { getStateStore as _getStateStore } from '../../coreos/state';
import { getEventBus as _getEventBus } from '../../coreos/event-bus';
import type { Intent } from '../../coreos/types';

/**
 * Single entry point for SYNAPSE kernel operations.
 * Product layer should use this instead of direct kernel access.
 */
export class SynapseAdapter {
    private static instance: SynapseAdapter;

    static getInstance(): SynapseAdapter {
        if (!SynapseAdapter.instance) {
            SynapseAdapter.instance = new SynapseAdapter();
        }
        return SynapseAdapter.instance;
    }

    /**
     * Emit an intent to SYNAPSE kernel with Governance Gate Enforcement
     */
    async emit(intent: Intent): Promise<void> {
        // [GOVERNANCE]
        // 1. Import Synapse Services (Client-side usage of the Separation)
        const { SynapseAuthority /*, GovernanceGate */ } = await import('../../packages/synapse/src/index');
        const { GovernanceGate } = await import('../../packages/synapse/src/gate/governance-gate'); // Explicit import or via index

        const authority = SynapseAuthority.getInstance();
        const gate = GovernanceGate.getInstance();

        // 2. Request Decision from Authority (Issuer)
        console.log(`[SYNAPSE ADAPTER] Requesting decision for ${intent.type}...`);

        // Context snapshot (Mock data for v1)
        const context = {
            actorId: 'user-current',
            userRole: 'admin'
        };

        const decisionRecord = await authority.requestDecision(
            {
                action: intent.type,
                target: 'system', // could be granular
                params: { intent }
            },
            context
        );

        // 3. Enforce via Gate (Verifier)
        console.log(`[SYNAPSE ADAPTER] Verifying decision ${decisionRecord.package.decisionId}...`);

        // 1. Request Decision from Authority (which calls SynapsePolicyEngine)
        // The Authority acts as the Issuer.
        // The 'authority' and 'decisionRecord' variables are already declared above.
        // Re-using the existing 'authority' and 'decisionRecord' from the previous step.
        // The 'gate' variable is also already declared above.

        // Context mapping
        const authContext = {
            actorId: 'user-01', // Mock
            userRole: 'admin'  // Mock
        };
        // The decisionRecord was already requested above, so this re-request is redundant.
        // We will use the existing decisionRecord.
        // const decisionRecord = await authority.requestDecision({
        //     action: intent.type,
        //     target: intent.type === 'OPEN_CAPABILITY' ? (intent as any).payload.capabilityId : 'system',
        //     params: { intent }
        // }, authContext);

        // 2. Gate Verification (The Guard)
        // The Gate verifies the Integrity and Signature of the Record.
        const verificationResult = await gate.enforce(
            decisionRecord, // Arg 1: The Record
            {               // Arg 2: The Proposed Intent
                action: intent.type,
                target: intent.type === 'OPEN_CAPABILITY' ? (intent as any).payload.capabilityId : 'system',
                params: { intent }
            }
        );

        // 3. Enforce Decision Semantics
        const kernel = _getKernel();

        if (verificationResult === 'ALLOW') {
            console.log(`[SYNAPSE] ALLOW: ${intent.type} -> Executing.`);
            kernel.emit(intent);
        } else if (verificationResult === 'ESCALATE') {
            console.warn(`[SYNAPSE] ESCALATE: ${intent.type} -> Initiating Step-Up.`);
            if (intent.type === 'OPEN_CAPABILITY') {
                const capId = (intent as any).payload.capabilityId;
                kernel.initiateStepUp(capId, 'Governance verification required.', intent.correlationId);
            } else {
                throw new Error(`Governance Violation: Action ${intent.type} requires escalation but no handler exists.`);
            }
        } else {
            console.error(`[SYNAPSE] DENY: ${intent.type}`);
            throw new Error(`Governance Policy Violation: Action ${intent.type} DENIED by Synapse Authority.`);
        }
    }

    /**
     * Bootstrap the kernel with user credentials
     */
    bootstrap(userId: string, role: 'admin' | 'user' | 'guest', policies: string[]): void {
        const kernel = _getKernel();
        kernel.bootstrap(userId, role, policies);
    }

    /**
     * Get current system state (read-only)
     */
    getState() {
        return _getStateStore().getState();
    }

    /**
     * Subscribe to events
     */
    subscribe(handler: (event: unknown) => void): () => void {
        return _getEventBus().subscribe(handler);
    }
}

// Export singleton
export const synapseAdapter = SynapseAdapter.getInstance();
