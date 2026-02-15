/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SYNAPSE — Capability Manifest: system.hub
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * CERTIFICATION: CORE (Built-in)
 * STATUS: ACTIVE
 * 
 * System Hub capability for consolidated Control Plane management.
 * Phase 27A: Consolidates Settings, Configuration, Users, Organization.
 * 
 * ACCESS: Owner + Admin only
 * 
 * @module coreos/manifests/system.hub
 */

import type { CapabilityManifest } from '../types';

/**
 * System Hub Manifest
 */
export const SYSTEM_HUB_MANIFEST: CapabilityManifest = {
    id: 'system.hub',
    title: 'System Hub',
    icon: '🖥️',
    hasUI: true,
    windowMode: 'single',
    requiredPolicies: ['admin.access'],
    requiresStepUp: false,
    dependencies: [],
    contextsSupported: ['global'],
    showInDock: true,

    // Certification (Phase E)
    certificationTier: 'core',

    // Phase 27A: owner/admin only
    requiredRole: 'admin',
};

export default SYSTEM_HUB_MANIFEST;
