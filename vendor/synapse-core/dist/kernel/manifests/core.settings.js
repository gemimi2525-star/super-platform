"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CORE_SETTINGS_MANIFEST = void 0;
/**
 * Core Settings Manifest
 */
exports.CORE_SETTINGS_MANIFEST = {
    id: 'core.settings',
    title: 'System Settings',
    icon: '⚙️',
    hasUI: true,
    windowMode: 'single', // Only one settings window at a time
    requiredPolicies: [], // Available to all authenticated users
    requiresStepUp: false,
    dependencies: [],
    contextsSupported: ['global'],
    showInDock: false,
    // Certification (Phase E)
    certificationTier: 'core',
};
exports.default = exports.CORE_SETTINGS_MANIFEST;
//# sourceMappingURL=core.settings.js.map