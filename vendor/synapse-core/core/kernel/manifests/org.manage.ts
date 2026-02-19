/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SYNAPSE — Capability Manifest: org.manage
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * CERTIFICATION: CORE (Built-in)
 * STATUS: ACTIVE
 * 
 * Organization management capability.
 * 
 * @module coreos/manifests/org.manage
 */

import type { CapabilityManifest } from '../../types/index.js';

/**
 * Organization Management Manifest
 */
export const ORG_MANAGE_MANIFEST: CapabilityManifest = {
    id: 'org.manage',
    title: 'Organizations',
    icon: '🏢',
    hasUI: true,
    windowMode: 'multi',
    requiredPolicies: ['orgs.read'],
    requiresStepUp: false,
    dependencies: [],
    contextsSupported: ['global'],
    showInDock: false,               // Phase 39D: accessible via System Hub → Organization tab

    // Certification (Phase E)
    certificationTier: 'core',
};

export default ORG_MANAGE_MANIFEST;
