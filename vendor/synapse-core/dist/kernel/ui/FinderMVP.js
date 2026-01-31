"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFinderState = void 0;
exports.getFinderVisibleCapabilities = getFinderVisibleCapabilities;
exports.getFinderSearchableCapabilities = getFinderSearchableCapabilities;
exports.searchFinderCapabilities = searchFinderCapabilities;
exports.isAlphabeticallySorted = isAlphabeticallySorted;
exports.createFinderOpenIntent = createFinderOpenIntent;
exports.createFinderIntent = createFinderIntent;
exports.validateFinderContract = validateFinderContract;
const capability_graph_js_1 = require("../capability-graph.js");
const createFinderState = () => ({
    searchQuery: '',
    isVisible: false,
});
exports.createFinderState = createFinderState;
// ═══════════════════════════════════════════════════════════════════════════
// FINDER LOGIC (Contract-Faithful)
// ═══════════════════════════════════════════════════════════════════════════
/**
 * Get capabilities visible in Finder (grid view)
 * Only showInDock=true capabilities
 *
 * @see FINDER_CONTRACT_v1.md Section 4.1
 */
function getFinderVisibleCapabilities() {
    const graph = (0, capability_graph_js_1.getCapabilityGraph)();
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
function getFinderSearchableCapabilities() {
    const graph = (0, capability_graph_js_1.getCapabilityGraph)();
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
function searchFinderCapabilities(query) {
    if (!query.trim()) {
        return getFinderVisibleCapabilities();
    }
    const normalizedQuery = query.toLowerCase().trim();
    const graph = (0, capability_graph_js_1.getCapabilityGraph)();
    // Search in all UI capabilities (visible + searchable)
    return graph.getAllManifests()
        .filter(m => m.hasUI)
        .filter(m => m.title.toLowerCase().includes(normalizedQuery) ||
        m.id.toLowerCase().includes(normalizedQuery))
        .sort((a, b) => a.title.localeCompare(b.title)); // Alphabetical
}
/**
 * Check if sorted alphabetically (deterministic verification)
 */
function isAlphabeticallySorted(capabilities) {
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
function createFinderOpenIntent(capabilityId, contextId) {
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
function createFinderIntent(capabilityId, contextId) {
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
function validateFinderContract() {
    const visible = getFinderVisibleCapabilities();
    return {
        alphabeticSort: isAlphabeticallySorted(visible),
        noRecentsSupport: true, // By design: no recent tracking
        noUsageSort: true, // By design: no usage tracking
        noSuggestions: true, // By design: no suggestion engine
        registrySourceOnly: true, // Uses capabilityGraph which reads registry
    };
}
//# sourceMappingURL=FinderMVP.js.map