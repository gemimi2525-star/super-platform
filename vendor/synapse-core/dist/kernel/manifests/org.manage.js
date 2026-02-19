"use strict";
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SYNAPSE — Capability Manifest: org.manage
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * CERTIFICATION: CORE (Built-in)
 * STATUS: ACTIVE
 *
 * Organization management capability.
 *
 * @module coreos/manifests/org.manage
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ORG_MANAGE_MANIFEST = void 0;
/**
 * Organization Management Manifest
 */
exports.ORG_MANAGE_MANIFEST = {
    id: 'org.manage',
    title: 'Organizations',
    icon: '🏢',
    hasUI: true,
    windowMode: 'multi',
    requiredPolicies: ['orgs.read'],
    requiresStepUp: false,
    dependencies: [],
    contextsSupported: ['global'],
    showInDock: false,
    // Certification (Phase E)
    certificationTier: 'core',
};
exports.default = exports.ORG_MANAGE_MANIFEST;
//# sourceMappingURL=org.manage.js.map