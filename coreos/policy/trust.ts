/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TRUST LEVELS (Phase 24A.2)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Defines the trust tiers for applications running on Core OS.
 * Determines the maximum capabilities an app can request.
 * 
 * @module coreos/policy/trust
 */

/**
 * Trust Level Hierarchy
 * Higher value = More trust = More capabilities
 */
export enum TrustLevel {
    /**
     * UNVERIFIED (0)
     * - Sideloaded apps, unknown publisher
     * - Sandbox: STRICT
     * - Capabilities: Minimal (cannot access network, sensitive data)
     */
    UNVERIFIED = 0,

    /**
     * ENTERPRISE (1)
     * - Signed by Organization's internal CA
     * - Sandbox: STANDARD
     * - Capabilities: Corporate resources allowed
     */
    ENTERPRISE = 1,

    /**
     * VERIFIED (2)
     * - Signed by App Store / Trusted Publisher
     * - Sandbox: STANDARD
     * - Capabilities: Standard set
     */
    VERIFIED = 2,

    /**
     * SYSTEM (3)
     * - Core OS Components
     * - Sandbox: RELAXED
     * - Capabilities: Full System Access (if requested)
     */
    SYSTEM = 3
}

/**
 * Get the trust level of an app based on its signature/origin
 * (Mock implementation for Phase 24A)
 */
export function determineTrustLevel(appId: string, signature?: string): TrustLevel {
    // 1. System Components
    if (appId.startsWith('core.') || appId.startsWith('system.')) {
        return TrustLevel.SYSTEM;
    }

    // 2. Enterprise Signed (Phase 24A Mock)
    if (signature === 'sig_enterprise_valid') {
        return TrustLevel.ENTERPRISE;
    }

    // 3. Verified Publisher (Phase 24A Mock)
    if (signature === 'sig_store_valid') {
        return TrustLevel.VERIFIED;
    }

    // Default: Unverified
    return TrustLevel.UNVERIFIED;
}
