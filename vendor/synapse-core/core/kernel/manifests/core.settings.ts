/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SYNAPSE — Capability Manifest: core.settings
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * CERTIFICATION: CORE (Built-in)
 * STATUS: ACTIVE
 * 
 * System settings capability.
 * Single instance window — only one settings window at a time.
 * 
 * @module coreos/manifests/core.settings
 */

import type { CapabilityManifest } from '../../types/index.js';

/**
 * Core Settings Manifest
 */
export const CORE_SETTINGS_MANIFEST: CapabilityManifest = {
    id: 'core.settings',
    title: 'System Settings',
    icon: '⚙️',
    hasUI: true,
    windowMode: 'single',            // Only one settings window at a time
    requiredPolicies: [],            // Available to all authenticated users
    requiresStepUp: false,
    dependencies: [],
    contextsSupported: ['global'],
    showInDock: false,               // Phase 39D: accessible via System Hub → General tab

    // Certification (Phase E)
    certificationTier: 'core',
};

export default CORE_SETTINGS_MANIFEST;
