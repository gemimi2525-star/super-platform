/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SYNAPSE — Capability Manifest: core.files
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * CERTIFICATION: CORE (Built-in)
 * STATUS: ACTIVE
 * 
 * File Explorer for accessing VFS.
 * 
 * @module coreos/manifests/core.files
 */

import type { CapabilityManifest } from '../types';

export const CORE_FILES_MANIFEST: CapabilityManifest = {
    id: 'core.files',
    title: 'Files',
    icon: '📁',
    hasUI: true,
    windowMode: 'windowed',
    requiredPolicies: [],
    requiresStepUp: false,
    dependencies: [],
    contextsSupported: ['global'],
    showInDock: true, // Visible in Dock

    certificationTier: 'core',
};

export default CORE_FILES_MANIFEST;
