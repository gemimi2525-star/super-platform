/**
 * SYNAPSE CAPABILITY GRAPH
 * 
 * Logic to inspect capability traits for policy decisions.
 * Source of Truth: ./registry.ts
 */

import { CAPABILITY_REGISTRY } from './registry';
import { CapabilityManifest, CapabilityId } from './types';

export class SynapseCapabilityGraph {
    private static instance: SynapseCapabilityGraph;

    private constructor() { }

    public static getInstance(): SynapseCapabilityGraph {
        if (!SynapseCapabilityGraph.instance) {
            SynapseCapabilityGraph.instance = new SynapseCapabilityGraph();
        }
        return SynapseCapabilityGraph.instance;
    }

    public getManifest(id: string): CapabilityManifest | undefined {
        return CAPABILITY_REGISTRY[id];
    }

    public exists(id: string): boolean {
        return !!CAPABILITY_REGISTRY[id];
    }

    /**
     * Check if specific permission policy is required
     */
    public requiresPolicy(id: string, policyName: string): boolean {
        const manifest = this.getManifest(id);
        if (!manifest) return false;
        return manifest.requiredPolicies.includes(policyName);
    }

    /**
     * Check certification tier
     */
    public isCertified(id: string): boolean {
        const manifest = this.getManifest(id);
        if (!manifest) return false;
        return manifest.certificationTier === 'core' || manifest.certificationTier === 'certified';
    }

    /**
     * Check for explicit Blocked IDs (Governance Rule)
     */
    public isBlocked(id: string): boolean {
        const BLOCKED_IDS = ['core.dashboard', 'core.chat'];
        return BLOCKED_IDS.includes(id);
    }

    /**
     * Check if step-up authentication is required
     */
    public requiresStepUp(id: string): boolean {
        return this.getManifest(id)?.requiresStepUp ?? false;
    }
}
