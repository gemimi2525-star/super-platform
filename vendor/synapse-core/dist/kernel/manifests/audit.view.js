"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AUDIT_VIEW_MANIFEST = void 0;
/**
 * Audit View Manifest
 */
exports.AUDIT_VIEW_MANIFEST = {
    id: 'audit.view',
    title: 'Audit Logs',
    icon: '📋',
    hasUI: true,
    windowMode: 'multiByContext', // One window per organization context
    requiredPolicies: ['audit.view'],
    requiresStepUp: false,
    dependencies: [],
    contextsSupported: ['global', 'organization'],
    showInDock: false,
    // Certification (Phase E)
    certificationTier: 'core',
};
exports.default = exports.AUDIT_VIEW_MANIFEST;
//# sourceMappingURL=audit.view.js.map