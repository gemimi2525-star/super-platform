/**
 * SYNAPSE CAPABILITY REGISTRY
 * 
 * The authoritative list of capabilities known to the Policy Engine.
 * Replicated from Core OS Manifests to ensure independence.
 */

import { CapabilityManifest } from './types';

export const CORE_FINDER_MANIFEST: CapabilityManifest = {
    id: 'core.finder',
    title: 'Finder',
    icon: '🖥️',
    hasUI: false,
    windowMode: 'backgroundOnly',
    requiredPolicies: [],
    requiresStepUp: false,
    dependencies: [],
    contextsSupported: ['global'],
    showInDock: false,
    certificationTier: 'core',
};

export const CORE_SETTINGS_MANIFEST: CapabilityManifest = {
    id: 'core.settings',
    title: 'Settings',
    icon: '⚙️',
    hasUI: true,
    windowMode: 'single',
    requiredPolicies: [],
    requiresStepUp: false,
    dependencies: [],
    contextsSupported: ['global'],
    showInDock: true,
    certificationTier: 'core',
};

export const USER_MANAGE_MANIFEST: CapabilityManifest = {
    id: 'user.manage',
    title: 'User Management',
    icon: '👥',
    hasUI: true,
    windowMode: 'multi',
    requiredPolicies: ['admin.access'],
    requiresStepUp: true,
    stepUpMessage: 'Authenticate to manage users',
    dependencies: ['core.settings'],
    contextsSupported: ['global', 'organization'],
    showInDock: true,
    certificationTier: 'core',
};

export const ORG_MANAGE_MANIFEST: CapabilityManifest = {
    id: 'org.manage',
    title: 'Organization',
    icon: '🏢',
    hasUI: true,
    windowMode: 'multiByContext',
    requiredPolicies: ['org.admin'],
    requiresStepUp: false,
    dependencies: [],
    contextsSupported: ['organization'],
    showInDock: true,
    certificationTier: 'core',
};

export const AUDIT_VIEW_MANIFEST: CapabilityManifest = {
    id: 'audit.view',
    title: 'Audit Logs',
    icon: '🛡️',
    hasUI: true,
    windowMode: 'single',
    requiredPolicies: ['audit.read'],
    requiresStepUp: true,
    stepUpMessage: 'Security Audit Access',
    dependencies: [],
    contextsSupported: ['global', 'organization'],
    showInDock: true,
    certificationTier: 'core',
};

export const SYSTEM_CONFIGURE_MANIFEST: CapabilityManifest = {
    id: 'system.configure',
    title: 'System Config',
    icon: '🔧',
    hasUI: true,
    windowMode: 'single',
    requiredPolicies: ['sys.admin'],
    requiresStepUp: true,
    stepUpMessage: 'Sudo Access Required',
    dependencies: [],
    contextsSupported: ['global'],
    showInDock: false,
    certificationTier: 'core',
};

export const PLUGIN_ANALYTICS_MANIFEST: CapabilityManifest = {
    id: 'plugin.analytics',
    title: 'Analytics',
    icon: '📊',
    hasUI: true,
    windowMode: 'multi',
    requiredPolicies: [],
    requiresStepUp: false,
    dependencies: [],
    contextsSupported: ['global'],
    showInDock: true,
    certificationTier: 'experimental',
};

export const CAPABILITY_REGISTRY: Record<string, CapabilityManifest> = {
    'core.finder': CORE_FINDER_MANIFEST,
    'core.settings': CORE_SETTINGS_MANIFEST,
    'user.manage': USER_MANAGE_MANIFEST,
    'org.manage': ORG_MANAGE_MANIFEST,
    'audit.view': AUDIT_VIEW_MANIFEST,
    'system.configure': SYSTEM_CONFIGURE_MANIFEST,
    'plugin.analytics': PLUGIN_ANALYTICS_MANIFEST,
};
