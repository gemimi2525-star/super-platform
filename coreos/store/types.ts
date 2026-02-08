/**
 * ═══════════════════════════════════════════════════════════════════════════
 * APP STORE TYPES (Phase 24B.1)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Data models for the App Store, Catalog, and Distribution Channels.
 * 
 * @module coreos/store/types
 */

import type { AppPackage } from '../manifests/spec';
import type { TrustLevel } from '../policy/trust';
import type { CapabilityId } from '../types';

/**
 * Distribution Channel
 */
export type DistributionChannel = 'official' | 'enterprise' | 'dev';

/**
 * App Category
 */
export type AppCategory =
    | 'productivity'
    | 'utilities'
    | 'development'
    | 'business'
    | 'finance'
    | 'system';

/**
 * Store Catalog Item (Metadata Only)
 */
export interface StoreItem {
    readonly appId: string;

    /** Display Info */
    readonly info: {
        readonly name: string;
        readonly publisher: string;
        readonly description: string;
        readonly shortDescription: string;
        readonly icon: string; // URL or Base64
        readonly screenshots: readonly string[];
        readonly category: AppCategory;
        readonly releaseDate: number;
        readonly website?: string;
    };

    /** Governance Info */
    readonly trustLevel: TrustLevel;
    readonly requiredCapabilities: readonly CapabilityId[];

    /** Versions available per channel */
    readonly versions: {
        readonly [K in DistributionChannel]?: AppPackage;
    };

    /** Release Notes */
    readonly releaseNotes?: Record<string, string>; // version -> notes
}

/**
 * Store Search Query
 */
export interface StoreQuery {
    readonly term?: string;
    readonly category?: AppCategory;
    readonly channel?: DistributionChannel;
}
