/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SYNAPSE — Capability Manifest: core.finder
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * CERTIFICATION: CORE (Built-in)
 * STATUS: ACTIVE
 * 
 * This is the Finder capability — the desktop itself.
 * It has no separate window because it IS the desktop.
 * 
 * @module coreos/manifests/core.finder
 */

import type { CapabilityManifest, CertificationTier } from '../../types/index.js';

/**
 * Core Finder Manifest
 * 
 * Finder IS the desktop, not a window on the desktop.
 */
export const CORE_FINDER_MANIFEST: CapabilityManifest = {
    id: 'core.finder',
    title: 'Finder',
    icon: '🖥️',
    hasUI: false,                    // Finder IS the desktop, no separate window
    windowMode: 'backgroundOnly',
    requiredPolicies: [],            // Always available
    requiresStepUp: false,
    dependencies: [],
    contextsSupported: ['global'],
    showInDock: false,               // Not shown in dock (it's the desktop)

    // Certification (Phase E)
    certificationTier: 'core',
};

export default CORE_FINDER_MANIFEST;
