import { CapabilityManifest } from './types';

// Legacy / Default definitions
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

// ═══════════════════════════════════════════════════════════════════════════
// POLICY REGISTRY (Versioned)
// ═══════════════════════════════════════════════════════════════════════════

export class PolicyRegistry {
    private static instance: PolicyRegistry;
    // Map<PolicyId, Map<Version, Manifest>>
    private registry: Map<string, Map<string, CapabilityManifest>> = new Map();
    // Map<PolicyId, Version>
    private activeVersions: Map<string, string> = new Map();

    private constructor() {
        this.initializeDefaults();
    }

    public static getInstance(): PolicyRegistry {
        if (!PolicyRegistry.instance) {
            PolicyRegistry.instance = new PolicyRegistry();
        }
        return PolicyRegistry.instance;
    }

    private initializeDefaults() {
        // Register initial versions (v1.0.0)
        this.register('core.finder', '1.0.0', CORE_FINDER_MANIFEST);
        this.register('core.settings', '1.0.0', CORE_SETTINGS_MANIFEST);
        this.register('user.manage', '1.0.0', USER_MANAGE_MANIFEST);
        this.register('org.manage', '1.0.0', ORG_MANAGE_MANIFEST);
        this.register('audit.view', '1.0.0', AUDIT_VIEW_MANIFEST);
        this.register('system.configure', '1.0.0', SYSTEM_CONFIGURE_MANIFEST);
        this.register('plugin.analytics', '1.0.0', PLUGIN_ANALYTICS_MANIFEST);
    }

    public register(id: string, version: string, manifest: CapabilityManifest): void {
        if (!this.registry.has(id)) {
            this.registry.set(id, new Map());
        }
        this.registry.get(id)!.set(version, manifest);

        // Auto-activate latest (simple semantic logic or just overwrite for now)
        // In real semver we compare, here we assume registration order or force active.
        this.activeVersions.set(id, version);
    }

    public getLatest(id: string): { manifest: CapabilityManifest; version: string } | null {
        if (!this.registry.has(id)) return null;

        const activeVersion = this.activeVersions.get(id);
        if (!activeVersion) return null;

        const manifest = this.registry.get(id)!.get(activeVersion);
        return manifest ? { manifest, version: activeVersion } : null;
    }

    public getVersion(id: string, version: string): CapabilityManifest | null {
        return this.registry.get(id)?.get(version) || null;
    }

    /**
     * @deprecated Use getLatest() or getVersion()
     */
    public getLegacy(id: string): CapabilityManifest | null {
        return this.getLatest(id)?.manifest || null;
    }
}

// Backward Compatibility Export (Deprecated)
export const CAPABILITY_REGISTRY: Record<string, CapabilityManifest> = {
    'core.finder': CORE_FINDER_MANIFEST,
    'core.settings': CORE_SETTINGS_MANIFEST,
    'user.manage': USER_MANAGE_MANIFEST,
    'org.manage': ORG_MANAGE_MANIFEST,
    'audit.view': AUDIT_VIEW_MANIFEST,
    'system.configure': SYSTEM_CONFIGURE_MANIFEST,
    'plugin.analytics': PLUGIN_ANALYTICS_MANIFEST,
};
