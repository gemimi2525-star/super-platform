/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SYNAPSE — Capability Manifest: core.notes
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * CERTIFICATION: CORE (Built-in)
 * STATUS: ACTIVE
 * PHASE: 16A — First VFS Consumer App
 * 
 * Notes app with VFS integration for reading and writing user files.
 * 
 * @module coreos/manifests/core.notes
 */

import type { CapabilityManifest } from '../types';

/**
 * Core Notes Manifest
 * 
 * First app to integrate with VFS via AppVFSAdapter.
 * Uses user:// scheme for file storage.
 */
export const CORE_NOTES_MANIFEST: CapabilityManifest = {
    id: 'core.notes',
    title: 'Notes',
    icon: '📝',
    hasUI: true,
    windowMode: 'single',
    windowDisplay: 'window',
    requiredPolicies: [],
    requiresStepUp: false,
    dependencies: [],
    contextsSupported: ['global'],
    showInDock: true,
    certificationTier: 'core',
};

export default CORE_NOTES_MANIFEST;
