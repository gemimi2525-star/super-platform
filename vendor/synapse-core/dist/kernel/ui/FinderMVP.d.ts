/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SYNAPSE — Finder MVP (Phase H)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Finder = Intent Origin Surface
 *
 * CONTRACT COMPLIANCE:
 * @see /docs/contracts/FINDER_CONTRACT_v1.md
 *
 * RULES:
 * - ✅ List from CapabilityGraph (registry-only)
 * - ✅ Deterministic alphabetical sort by title
 * - ✅ Search: filter by title or id (no fuzzy/AI)
 * - ✅ showInDock=true => always visible
 * - ✅ showInDock=false + hasUI=true => searchable only
 * - ✅ hasUI=false => never shown
 *
 * MUST NOT:
 * - ❌ No recents
 * - ❌ No frequency sorting
 * - ❌ No suggestions
 * - ❌ No notifications
 * - ❌ No auto-open
 *
 * @module coreos/ui/FinderMVP
 * @version 1.0.0 (Phase H)
 */
import type { CapabilityManifest, CapabilityId } from '../../types/index.js';
export interface FinderState {
    readonly searchQuery: string;
    readonly isVisible: boolean;
}
export declare const createFinderState: () => FinderState;
/**
 * Get capabilities visible in Finder (grid view)
 * Only showInDock=true capabilities
 *
 * @see FINDER_CONTRACT_v1.md Section 4.1
 */
export declare function getFinderVisibleCapabilities(): readonly CapabilityManifest[];
/**
 * Get capabilities searchable in Finder
 * showInDock=false but hasUI=true => searchable only
 *
 * @see FINDER_CONTRACT_v1.md Section 4.1
 */
export declare function getFinderSearchableCapabilities(): readonly CapabilityManifest[];
/**
 * Search Finder capabilities
 * Deterministic: filter by title or id, no fuzzy/AI
 *
 * @see FINDER_CONTRACT_v1.md Section 4.3
 */
export declare function searchFinderCapabilities(query: string): readonly CapabilityManifest[];
/**
 * Check if sorted alphabetically (deterministic verification)
 */
export declare function isAlphabeticallySorted(capabilities: readonly CapabilityManifest[]): boolean;
/**
 * Create intent for Finder item click
 * MUST be emitted via kernel.emit(), never window.open()
 *
 * @param capabilityId - The capability to open
 * @param contextId - Optional context for multiByContext capabilities
 * @returns Intent descriptor
 *
 * @see /docs/contracts/FINDER_CONTRACT_v1.md Section 5
 */
export declare function createFinderOpenIntent(capabilityId: CapabilityId, contextId?: string): {
    type: 'OPEN_CAPABILITY';
    payload: {
        capabilityId: CapabilityId;
        contextId?: string;
    };
};
/**
 * Create full intent with correlationId (for direct kernel.emit())
 * Uses IntentFactory pattern
 */
export declare function createFinderIntent(capabilityId: CapabilityId, contextId?: string): {
    type: 'OPEN_CAPABILITY';
    correlationId: string;
    payload: {
        capabilityId: CapabilityId;
        contextId?: string;
    };
};
/**
 * Validate Finder compliance with contract
 */
export interface FinderContractValidation {
    readonly alphabeticSort: boolean;
    readonly noRecentsSupport: boolean;
    readonly noUsageSort: boolean;
    readonly noSuggestions: boolean;
    readonly registrySourceOnly: boolean;
}
export declare function validateFinderContract(): FinderContractValidation;
//# sourceMappingURL=FinderMVP.d.ts.map