"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.USER_MANAGE_MANIFEST = void 0;
/**
 * User Management Manifest
 */
exports.USER_MANAGE_MANIFEST = {
    id: 'user.manage',
    title: 'User Management',
    icon: '👤',
    hasUI: true,
    windowMode: 'multi', // Can have multiple user windows
    requiredPolicies: ['users.read'],
    requiresStepUp: true, // REQUIRES STEP-UP for sensitive operation
    stepUpMessage: 'Verify your identity to access user management',
    dependencies: [],
    contextsSupported: ['global', 'organization'],
    showInDock: true,
    // Certification (Phase E)
    certificationTier: 'core',
};
exports.default = exports.USER_MANAGE_MANIFEST;
//# sourceMappingURL=user.manage.js.map