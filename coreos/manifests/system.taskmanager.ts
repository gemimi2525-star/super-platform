/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SYNAPSE — Capability Manifest: system.taskmanager
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * CERTIFICATION: CORE (Built-in)
 * STATUS: ACTIVE
 *
 * Task Manager capability for process lifecycle management.
 * Phase 15B: Deterministic process model.
 *
 * ACCESS: Owner + Admin only
 *
 * @module coreos/manifests/system.taskmanager
 */

import type { CapabilityManifest } from '../types';

/**
 * Task Manager Manifest
 */
export const SYSTEM_TASKMANAGER_MANIFEST: CapabilityManifest = {
    id: 'system.taskmanager',
    title: 'Task Manager',
    icon: '📊',
    hasUI: true,
    windowMode: 'single',
    requiredPolicies: ['admin.access'],
    requiresStepUp: false,
    dependencies: [],
    contextsSupported: ['global'],
    showInDock: false, // accessible via System Hub or Spotlight

    // Certification (Phase E)
    certificationTier: 'core',

    // Phase 15B: owner/admin only
    requiredRole: 'admin',
};

export default SYSTEM_TASKMANAGER_MANIFEST;
