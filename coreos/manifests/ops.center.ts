/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SYNAPSE — Capability Manifest: ops.center
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * CERTIFICATION: CORE (Built-in)
 * STATUS: ACTIVE
 * 
 * Ops Center capability for operational visibility.
 * Phase 5: Admin observability dashboard.
 * 
 * @module coreos/manifests/ops.center
 */

import type { CapabilityManifest } from '../types';

/**
 * Ops Center Manifest
 */
export const OPS_CENTER_MANIFEST: CapabilityManifest = {
    id: 'ops.center',
    title: 'Ops Center',
    icon: '🎛️',
    hasUI: true,
    windowMode: 'single',
    requiredPolicies: ['audit.view'],
    requiresStepUp: false,
    dependencies: [],
    contextsSupported: ['global'],
    showInDock: true,

    // Certification (Phase E)
    certificationTier: 'core',
};

export default OPS_CENTER_MANIFEST;
