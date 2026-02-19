/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SYNAPSE — Capability Manifest: system.configure
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * CERTIFICATION: CORE (Built-in)
 * STATUS: ACTIVE
 * 
 * System configuration capability.
 * Very sensitive — requires step-up authentication and admin policy.
 * 
 * @module coreos/manifests/system.configure
 */

import type { CapabilityManifest } from '../types';

/**
 * System Configure Manifest
 */
export const SYSTEM_CONFIGURE_MANIFEST: CapabilityManifest = {
    id: 'system.configure',
    title: 'System Configuration',
    icon: '🔧',
    hasUI: true,
    windowMode: 'single',
    requiredPolicies: ['system.admin'],
    requiresStepUp: true,            // Very sensitive — requires step-up
    stepUpMessage: 'Verify your identity to access system configuration',
    dependencies: [],
    contextsSupported: ['global'],
    showInDock: false, // Phase 39D: accessible via System Hub 'Configuration' tab

    // Certification (Phase E)
    certificationTier: 'core',
};

export default SYSTEM_CONFIGURE_MANIFEST;
