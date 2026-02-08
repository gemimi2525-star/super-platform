/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MANIFEST: Utility Tools (core.tools)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Floating utility window for quick access to system tools.
 * Uses the 'UTILITY' role (movable, always-on-top, non-resizable).
 */

import type { CapabilityManifest } from '../types';

export const CORE_TOOLS_MANIFEST: CapabilityManifest = {
    id: 'core.tools',
    title: 'Utility Tools',
    icon: 'hammer', // Matches Lucide 'hammer' or similar, simplistic icon string

    // Window Behavior
    windowMode: 'single', // One instance
    hasUI: true,
    showInDock: false, // Don't show in dock, it's a utility

    // Governance
    certificationTier: 'core', // System component

    // Security
    requiredPolicies: [],
    requiresStepUp: false,

    // Dependencies & Context
    dependencies: [],
    contextsSupported: ['global'],
};
