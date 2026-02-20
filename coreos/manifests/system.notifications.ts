/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SYNAPSE — Capability Manifest: system.notifications
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * CERTIFICATION: CORE (Built-in)
 * STATUS: ACTIVE
 *
 * Notification Center capability for OS event surface.
 * Phase 18: Deterministic notification model.
 *
 * ACCESS: All authenticated users
 *
 * @module coreos/manifests/system.notifications
 */

import type { CapabilityManifest } from '../types';

/**
 * Notification Center Manifest
 */
export const SYSTEM_NOTIFICATIONS_MANIFEST: CapabilityManifest = {
    id: 'system.notifications',
    title: 'Notification Center',
    icon: '🔔',
    hasUI: true,
    windowMode: 'single',
    requiredPolicies: [],
    requiresStepUp: false,
    dependencies: [],
    contextsSupported: ['global'],
    showInDock: false, // accessible via TopBar bell icon

    // Certification (Phase 18)
    certificationTier: 'core',

    // Phase 18: accessible to all authenticated users
    requiredRole: 'user',
};

export default SYSTEM_NOTIFICATIONS_MANIFEST;
