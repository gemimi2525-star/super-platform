/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SYNAPSE — Capability Manifest: brain.dashboard
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * CERTIFICATION: CORE (Built-in)
 * STATUS: ACTIVE
 * 
 * Brain Dashboard capability for owner-only governance dashboard.
 * Phase 25B: OS Shell Integration — proposal engine + trust indicator.
 * 
 * @module coreos/manifests/brain.dashboard
 */

import type { CapabilityManifest } from '../types';

/**
 * Brain Dashboard Manifest (Owner-only)
 */
export const BRAIN_DASHBOARD_MANIFEST: CapabilityManifest = {
    id: 'brain.dashboard',
    title: 'Brain Dashboard',
    icon: '🧪',
    hasUI: true,
    windowMode: 'single',
    requiredPolicies: ['admin.access'],
    requiresStepUp: false,
    dependencies: [],
    contextsSupported: ['global'],
    showInDock: true,

    // Certification (Phase E)
    certificationTier: 'core',

    // Phase 25B: Owner-only access
    requiredRole: 'owner',
};

export default BRAIN_DASHBOARD_MANIFEST;
