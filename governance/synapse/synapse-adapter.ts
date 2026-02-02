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
        const verdict = await gate.enforce(
            decisionRecord,
            { action: intent.type, target: 'system' }
        );

        if (verdict !== 'ALLOW') {
            console.error(`[SYNAPSE] Governance Gate Verdict: ${verdict}`);
            throw new Error(`Governance Policy Violation: Action ${intent.type} resulted in ${verdict}`);
        }

        // 4. Proceed to Kernel (Executor)
        console.log(`[SYNAPSE] Gate Passed. Forwarding to Kernel...`);
        const kernel = _getKernel();
        kernel.emit(intent);
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
