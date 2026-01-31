/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SYNAPSE — Capability Manifest: user.manage
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * CERTIFICATION: CORE (Built-in)
 * STATUS: ACTIVE
 * 
 * User management capability.
 * Requires step-up authentication due to sensitive data access.
 * 
 * @module coreos/manifests/user.manage
 */

import type { CapabilityManifest } from '../types';

/**
 * User Management Manifest
 */
export const USER_MANAGE_MANIFEST: CapabilityManifest = {
    id: 'user.manage',
    title: 'User Management',
    icon: '👤',
    hasUI: true,
    windowMode: 'multi',             // Can have multiple user windows
    requiredPolicies: ['users.read'],
    requiresStepUp: true,            // REQUIRES STEP-UP for sensitive operation
    stepUpMessage: 'Verify your identity to access user management',
    dependencies: [],
    contextsSupported: ['global', 'organization'],
    showInDock: true,

    // Certification (Phase E)
    certificationTier: 'core',
};

export default USER_MANAGE_MANIFEST;
