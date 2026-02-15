/**
 * ═══════════════════════════════════════════════════════════════════════════
 * POLICY ENFORCEMENT (Phase 24A.2)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Enforces security policies based on App Trust Level.
 * Prevents low-trust apps from requesting dangerous capabilities.
 * 
 * @module coreos/policy/enforcement
 */

import { TrustLevel } from './trust';
import type { CapabilityId } from '../types';
import type { AppManifest } from '../manifests/spec';

/**
 * Capabilities that require specific trust levels
 */
const CAPABILITY_TIERS: Record<CapabilityId, TrustLevel> = {
    // CORE SYSTEM (System Only)
    'system.configure': TrustLevel.SYSTEM,
    'core.permissions': TrustLevel.SYSTEM,
    'core.settings': TrustLevel.SYSTEM, // Settings is privileged

    // UTILITIES (Verified+)
    'core.tools': TrustLevel.VERIFIED,
    'core.store': TrustLevel.VERIFIED, // App Store Access
    'audit.view': TrustLevel.ENTERPRISE, // Only Enterprise apps can view audit logs

    // MANAGED (Verified/Enterprise)
    'user.manage': TrustLevel.ENTERPRISE,
    'org.manage': TrustLevel.ENTERPRISE,
    'ops.center': TrustLevel.ENTERPRISE,

    // BASIC (Unverified Allowed)
    'core.finder': TrustLevel.UNVERIFIED, // Finder access (scoped) is basic
    'core.files': TrustLevel.VERIFIED, // File Explorer (scoped) requires Verification
    'core.notes': TrustLevel.VERIFIED, // Notes App (Phase 16A: VFS Consumer)
    'plugin.analytics': TrustLevel.UNVERIFIED, // Analytics is generally safe (outbound only)

    // Phase 39: AI Governance Brain
    'core.admin': TrustLevel.SYSTEM,
    'core.finance': TrustLevel.ENTERPRISE,
    'brain.assist': TrustLevel.SYSTEM,
    'brain.dashboard': TrustLevel.SYSTEM, // Phase 25B: Owner-only

    // Phase 27A: System Hub
    'system.hub': TrustLevel.SYSTEM,
};

/**
 * Validate an app's requested capabilities against its trust level
 * @returns Array of denied capabilities
 */
export function validateAppCapabilities(manifest: AppManifest, trustLevel: TrustLevel): CapabilityId[] {
    const denied: CapabilityId[] = [];

    for (const cap of manifest.capabilitiesRequested) {
        const requiredTier = CAPABILITY_TIERS[cap] ?? TrustLevel.SYSTEM; // Default to SYSTEM for unknown caps

        if (trustLevel < requiredTier) {
            console.warn(`[Policy] DENIED: ${manifest.appId} (Tier ${trustLevel}) requested ${cap} (Requires Tier ${requiredTier})`);
            denied.push(cap);
        }
    }

    return denied;
}

/**
 * Check if an app is allowed to be installed
 */
export function validateInstallPolicy(manifest: AppManifest, trustLevel: TrustLevel): { allowed: boolean; reason?: string } {
    // 1. Check Capabilities
    const deniedCaps = validateAppCapabilities(manifest, trustLevel);
    if (deniedCaps.length > 0) {
        return {
            allowed: false,
            reason: `Insufficient Trust Level for capabilities: ${deniedCaps.join(', ')}`
        };
    }

    // 2. Check Storage Scopes (Phase 24A.2)
    // Example: Only SYSTEM/ENTERPRISE can request 'system://' scopes
    for (const scope of (manifest.storageScopes || [])) {
        if (scope.startsWith('system://') && trustLevel < TrustLevel.SYSTEM) {
            return { allowed: false, reason: `Insufficient Trust Level for system storage scope` };
        }
    }

    return { allowed: true };
}

/**
 * Calculate the minimum Trust Level required for a set of capabilities
 */
export function calculateRequiredTrustLevel(capabilities: readonly CapabilityId[]): TrustLevel {
    let maxLevel = TrustLevel.UNVERIFIED;
    for (const cap of capabilities) {
        const required = CAPABILITY_TIERS[cap] ?? TrustLevel.SYSTEM;
        if (required > maxLevel) {
            maxLevel = required;
        }
    }
    return maxLevel;
}

import type { AppPackage } from '../manifests/spec';

/**
 * Determine the Trust Level of a package based on its signature (Mock)
 */
export function determineTrustLevel(pkg: AppPackage): TrustLevel {
    if (!pkg.signature) return TrustLevel.UNVERIFIED;
    if (pkg.signature.includes('enterprise')) return TrustLevel.ENTERPRISE;
    if (pkg.signature.includes('store')) return TrustLevel.VERIFIED;
    if (pkg.signature.includes('system')) return TrustLevel.SYSTEM;
    return TrustLevel.UNVERIFIED;
}
