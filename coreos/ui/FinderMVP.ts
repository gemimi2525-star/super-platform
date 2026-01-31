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

import { getCapabilityGraph } from '../capability-graph';
import type { CapabilityManifest, CapabilityId } from '../types';

// ═══════════════════════════════════════════════════════════════════════════
// FINDER STATE
// ═══════════════════════════════════════════════════════════════════════════

export interface FinderState {
    readonly searchQuery: string;
    readonly isVisible: boolean;
}

export const createFinderState = (): FinderState => ({
    searchQuery: '',
    isVisible: false,
});

// ═══════════════════════════════════════════════════════════════════════════
// FINDER LOGIC (Contract-Faithful)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get capabilities visible in Finder (grid view)
 * Only showInDock=true capabilities
 * 
 * @see FINDER_CONTRACT_v1.md Section 4.1
 */
export function getFinderVisibleCapabilities(): readonly CapabilityManifest[] {
    const graph = getCapabilityGraph();
    return graph.getDockCapabilities()
        .filter(m => m.hasUI)
        .sort((a, b) => a.title.localeCompare(b.title)); // Alphabetical
}

/**
 * Get capabilities searchable in Finder
 * showInDock=false but hasUI=true => searchable only
 * 
 * @see FINDER_CONTRACT_v1.md Section 4.1
 */
export function getFinderSearchableCapabilities(): readonly CapabilityManifest[] {
    const graph = getCapabilityGraph();
    return graph.getAllManifests()
        .filter(m => m.hasUI && !m.showInDock)
        .sort((a, b) => a.title.localeCompare(b.title)); // Alphabetical
}

/**
 * Search Finder capabilities
 * Deterministic: filter by title or id, no fuzzy/AI
 * 
 * @see FINDER_CONTRACT_v1.md Section 4.3
 */
export function searchFinderCapabilities(query: string): readonly CapabilityManifest[] {
    if (!query.trim()) {
        return getFinderVisibleCapabilities();
    }

    const normalizedQuery = query.toLowerCase().trim();
    const graph = getCapabilityGraph();

    // Search in all UI capabilities (visible + searchable)
    return graph.getAllManifests()
        .filter(m => m.hasUI)
        .filter(m =>
            m.title.toLowerCase().includes(normalizedQuery) ||
            m.id.toLowerCase().includes(normalizedQuery)
        )
        .sort((a, b) => a.title.localeCompare(b.title)); // Alphabetical
}

/**
 * Check if sorted alphabetically (deterministic verification)
 */
export function isAlphabeticallySorted(capabilities: readonly CapabilityManifest[]): boolean {
    for (let i = 1; i < capabilities.length; i++) {
        if (capabilities[i - 1].title.localeCompare(capabilities[i].title) > 0) {
            return false;
        }
    }
    return true;
}

// ═══════════════════════════════════════════════════════════════════════════
// FINDER CLICK HANDLER (Intent Emission Only — Phase I)
// ═══════════════════════════════════════════════════════════════════════════

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
export function createFinderOpenIntent(
    capabilityId: CapabilityId,
    contextId?: string
): {
    type: 'OPEN_CAPABILITY';
    payload: { capabilityId: CapabilityId; contextId?: string };
} {
    return {
        type: 'OPEN_CAPABILITY',
        payload: contextId
            ? { capabilityId, contextId }
            : { capabilityId },
    };
}

/**
 * Create full intent with correlationId (for direct kernel.emit())
 * Uses IntentFactory pattern
 */
export function createFinderIntent(
    capabilityId: CapabilityId,
    contextId?: string
): {
    type: 'OPEN_CAPABILITY';
    correlationId: string;
    payload: { capabilityId: CapabilityId; contextId?: string };
} {
    // Generate deterministic correlation ID
    const correlationId = `finder-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    return {
        type: 'OPEN_CAPABILITY',
        correlationId,
        payload: contextId
            ? { capabilityId, contextId }
            : { capabilityId },
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// FINDER CONTRACT VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

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

export function validateFinderContract(): FinderContractValidation {
    const visible = getFinderVisibleCapabilities();

    return {
        alphabeticSort: isAlphabeticallySorted(visible),
        noRecentsSupport: true, // By design: no recent tracking
        noUsageSort: true,      // By design: no usage tracking
        noSuggestions: true,    // By design: no suggestion engine
        registrySourceOnly: true, // Uses capabilityGraph which reads registry
    };
}
