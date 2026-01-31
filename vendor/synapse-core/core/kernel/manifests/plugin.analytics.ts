/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SYNAPSE — Capability Manifest: plugin.analytics
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * CERTIFICATION: EXPERIMENTAL (Phase F Pipeline Validation)
 * STATUS: ACTIVE
 * 
 * Analytics capability for viewing system usage data.
 * This is the first capability added via the Phase F pipeline.
 * 
 * GOVERNANCE:
 * - ❌ No background tasks
 * - ❌ No auto-trigger
 * - ❌ No push notifications
 * - ✅ Read-only report view of usage data
 * - ✅ User-initiated only
 * - ✅ Removal-safe
 * 
 * @module coreos/manifests/plugin.analytics
 */

import type { CapabilityManifest } from '../../types/index.js';

/**
 * Plugin Analytics Manifest
 * 
 * EXPERIMENTAL tier — Added via Phase F pipeline validation.
 */
export const PLUGIN_ANALYTICS_MANIFEST: CapabilityManifest = {
    id: 'plugin.analytics',
    title: 'Analytics',
    icon: '📊',
    hasUI: true,
    windowMode: 'single',            // Single analytics window
    requiredPolicies: ['audit.view'], // Requires audit view permission
    requiresStepUp: false,           // No step-up needed (read-only)
    dependencies: [],
    contextsSupported: ['global'],
    showInDock: true,

    // Certification (Phase F - EXPERIMENTAL)
    certificationTier: 'experimental',
    certifiedAt: '2026-01-30T16:23:18+07:00',
    certifiedBy: 'System Architect (Phase F Pipeline)',
};

export default PLUGIN_ANALYTICS_MANIFEST;
