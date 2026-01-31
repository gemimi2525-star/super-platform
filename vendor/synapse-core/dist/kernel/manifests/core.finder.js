"use strict";
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SYNAPSE — Capability Manifest: core.finder
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * CERTIFICATION: CORE (Built-in)
 * STATUS: ACTIVE
 *
 * This is the Finder capability — the desktop itself.
 * It has no separate window because it IS the desktop.
 *
 * @module coreos/manifests/core.finder
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CORE_FINDER_MANIFEST = void 0;
/**
 * Core Finder Manifest
 *
 * Finder IS the desktop, not a window on the desktop.
 */
exports.CORE_FINDER_MANIFEST = {
    id: 'core.finder',
    title: 'Finder',
    icon: '🖥️',
    hasUI: false, // Finder IS the desktop, no separate window
    windowMode: 'backgroundOnly',
    requiredPolicies: [], // Always available
    requiresStepUp: false,
    dependencies: [],
    contextsSupported: ['global'],
    showInDock: false, // Not shown in dock (it's the desktop)
    // Certification (Phase E)
    certificationTier: 'core',
};
exports.default = exports.CORE_FINDER_MANIFEST;
//# sourceMappingURL=core.finder.js.map