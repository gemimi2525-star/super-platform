/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SYNAPSE — Capability Manifest: audit.view
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * CERTIFICATION: CORE (Built-in)
 * STATUS: ACTIVE
 * 
 * Audit logs viewing capability.
 * Supports multiple windows by context (one per organization).
 * 
 * @module coreos/manifests/audit.view
 */

import type { CapabilityManifest } from '../../types/index.js';

/**
 * Audit View Manifest
 */
export const AUDIT_VIEW_MANIFEST: CapabilityManifest = {
    id: 'audit.view',
    title: 'Audit Logs',
    icon: '📋',
    hasUI: true,
    windowMode: 'multiByContext',    // One window per organization context
    requiredPolicies: ['audit.view'],
    requiresStepUp: false,
    dependencies: [],
    contextsSupported: ['global', 'organization'],
    showInDock: false,               // Phase 39D: accessible via System Hub → Audit tab

    // Certification (Phase E)
    certificationTier: 'core',
};

export default AUDIT_VIEW_MANIFEST;
