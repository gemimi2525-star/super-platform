"use strict";
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SYNAPSE — Capability Manifest: system.configure
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * CERTIFICATION: CORE (Built-in)
 * STATUS: ACTIVE
 *
 * System configuration capability.
 * Very sensitive — requires step-up authentication and admin policy.
 *
 * @module coreos/manifests/system.configure
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SYSTEM_CONFIGURE_MANIFEST = void 0;
/**
 * System Configure Manifest
 */
exports.SYSTEM_CONFIGURE_MANIFEST = {
    id: 'system.configure',
    title: 'System Configuration',
    icon: '🔧',
    hasUI: true,
    windowMode: 'single',
    requiredPolicies: ['system.admin'],
    requiresStepUp: true, // Very sensitive — requires step-up
    stepUpMessage: 'Verify your identity to access system configuration',
    dependencies: [],
    contextsSupported: ['global'],
    showInDock: false,
    // Certification (Phase E)
    certificationTier: 'core',
};
exports.default = exports.SYSTEM_CONFIGURE_MANIFEST;
//# sourceMappingURL=system.configure.js.map