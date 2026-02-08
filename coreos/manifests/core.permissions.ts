import type { CapabilityManifest } from '../types';

export const CORE_PERMISSIONS_MANIFEST: CapabilityManifest = {
    id: 'core.permissions',
    title: 'System Permissions',
    icon: 'shield-alert',
    hasUI: true,

    // Window Behavior
    windowMode: 'multi', // Can have multiple permission requests
    windowDisplay: 'modal', // Phase 19: Modal UI
    showInDock: false, // Hidden system window

    // Governance
    certificationTier: 'core',

    // Security
    requiredPolicies: [],
    requiresStepUp: false,

    // Dependencies & Context
    dependencies: [],
    contextsSupported: ['global'],
};
