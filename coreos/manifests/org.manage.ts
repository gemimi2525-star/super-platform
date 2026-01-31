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

import type { CapabilityManifest } from '../types';

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
    showInDock: true,

    // Certification (Phase E)
    certificationTier: 'core',
};

export default ORG_MANAGE_MANIFEST;
