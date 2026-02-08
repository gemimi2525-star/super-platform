/**
 * Core OS Subscription Manager (Phase 32)
 * Enforces Go-To-Market Tiers and Feature Gates.
 */

export enum Tier {
    FREE = 'FREE',
    PRO = 'PRO',
    ENTERPRISE = 'ENTERPRISE'
}

export const TIER_FEATURES = {
    [Tier.FREE]: { aiDraft: false, sod: false, auditExport: false },
    [Tier.PRO]: { aiDraft: true, sod: false, auditExport: false },
    [Tier.ENTERPRISE]: { aiDraft: true, sod: true, auditExport: true }
};

class SubscriptionManager {
    private tenantTiers: Map<string, Tier> = new Map();

    constructor() {
        // Mock Tenants
        this.setTenantTier('tenant-sme', Tier.PRO);
        this.setTenantTier('tenant-corp', Tier.ENTERPRISE);
        this.setTenantTier('tenant-free', Tier.FREE);
    }

    setTenantTier(tenantId: string, tier: Tier) {
        this.tenantTiers.set(tenantId, tier);
    }

    checkFeature(tenantId: string, feature: keyof typeof TIER_FEATURES[Tier.ENTERPRISE]) {
        const tier = this.tenantTiers.get(tenantId) || Tier.FREE;
        const features = TIER_FEATURES[tier];

        if (!features[feature]) {
            throw new Error(`SUBSCRIPTION BLOCK: Feature '${feature}' requires higher tier (Current: ${tier})`);
        }
    }
}

export const subscriptionManager = new SubscriptionManager();
