/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Capability Package Types (Phase 25)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * JSON contract for capability packages.
 * No dynamic code execution — metadata only.
 */

/** Trust levels allowed for dev packages (SYSTEM is FORBIDDEN) */
export type PackageTrustLevel = 'VERIFIED' | 'COMMUNITY' | 'DEV_ONLY';

/** The JSON contract for a capability package */
export interface CapabilityPackage {
    /** Unique package ID (e.g. "plugin.notes.extra") */
    id: string;
    /** Semver version */
    version: string;
    /** Capability manifest */
    manifest: {
        capabilityId: string;
        trustLevel: PackageTrustLevel;
        permissions: string[];
    };
    /** UI metadata */
    ui: {
        title: string;
        icon: string;
    };
}

/** Package with install metadata */
export interface InstalledPackage extends CapabilityPackage {
    installedAt: string; // ISO timestamp
    argsHash: string;    // SHA-256 of package JSON
}

/** Validation result */
export interface PackageValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}

/** Maximum number of dev packages allowed */
export const MAX_DEV_PACKAGES = 10;

/** Forbidden trust levels */
export const FORBIDDEN_TRUST: string[] = ['SYSTEM'];

/** Core capability IDs that cannot be overwritten */
export const PROTECTED_IDS: string[] = [
    'core.finder', 'core.settings', 'core.notes',
    'brain.assist', 'user.manage', 'audit.view',
    'org.manage', 'system.configure', 'system.hub',
    'system.notifications', 'system.devconsole',
    'ops.center', 'intent.browser',
];
