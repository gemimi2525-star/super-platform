/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SYNAPSE — Capability Manifest: brain.assist
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * CERTIFICATION: CORE (Built-in)
 * STATUS: ACTIVE (Phase 39)
 * 
 * AI Assistant for OS-level help and automation.
 * 
 * @module coreos/manifests/brain.assist
 */

import type { CapabilityManifest } from '../types';

export const BRAIN_ASSIST_MANIFEST: CapabilityManifest = {
    id: 'brain.assist',
    title: 'Brain',
    icon: '🧠',
    hasUI: true,
    windowMode: 'single',
    requiredPolicies: [],
    requiresStepUp: false,
    dependencies: [],
    contextsSupported: ['global'],
    showInDock: true, // Visible in Dock

    certificationTier: 'core',
};

export default BRAIN_ASSIST_MANIFEST;
