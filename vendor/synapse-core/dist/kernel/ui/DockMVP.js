"use strict";
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SYNAPSE — Dock MVP (Phase H)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Dock = Calm Presence Surface
 *
 * CONTRACT COMPLIANCE:
 * @see /docs/contracts/DOCK_CONTRACT_v1.md
 *
 * CONTAINS:
 * - ✅ Pinned capabilities (user explicit choice)
 * - ✅ Running windows (minimized presence)
 *
 * MUST NOT:
 * - ❌ No badges
 * - ❌ No counts
 * - ❌ No bouncing
 * - ❌ No progress indicators
 * - ❌ No sound
 * - ❌ No auto-pin on launch
 *
 * @module coreos/ui/DockMVP
 * @version 1.0.0 (Phase H)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDockState = void 0;
exports.getDockItems = getDockItems;
exports.pinToDock = pinToDock;
exports.unpinFromDock = unpinFromDock;
exports.updateRunningCapabilities = updateRunningCapabilities;
exports.getDockClickAction = getDockClickAction;
exports.getDockClickActionLegacy = getDockClickActionLegacy;
exports.validateDockContract = validateDockContract;
const capability_graph_js_1 = require("../capability-graph.js");
const createDockState = () => ({
    pinnedCapabilities: [],
    runningCapabilities: [],
});
exports.createDockState = createDockState;
// ═══════════════════════════════════════════════════════════════════════════
// DOCK LOGIC (Contract-Faithful)
// ═══════════════════════════════════════════════════════════════════════════
/**
 * Get dock items = union(pinned, running)
 * Order: pinned first (stable user order), then running (not pinned)
 *
 * @see DOCK_CONTRACT_v1.md Section 2
 */
function getDockItems(state) {
    const graph = (0, capability_graph_js_1.getCapabilityGraph)();
    const items = [];
    const added = new Set();
    // 1. Pinned capabilities first (user-defined order)
    for (const id of state.pinnedCapabilities) {
        const manifest = graph.getManifest(id);
        if (manifest && manifest.hasUI) {
            items.push({
                capabilityId: id,
                manifest,
                isPinned: true,
                isRunning: state.runningCapabilities.includes(id),
            });
            added.add(id);
        }
    }
    // 2. Running capabilities (not already in pinned)
    for (const id of state.runningCapabilities) {
        if (!added.has(id)) {
            const manifest = graph.getManifest(id);
            if (manifest && manifest.hasUI) {
                items.push({
                    capabilityId: id,
                    manifest,
                    isPinned: false,
                    isRunning: true,
                });
            }
        }
    }
    return items;
}
// ═══════════════════════════════════════════════════════════════════════════
// DOCK ACTIONS (User-Initiated Only)
// ═══════════════════════════════════════════════════════════════════════════
/**
 * Pin capability to dock (user explicit action)
 */
function pinToDock(state, capabilityId) {
    if (state.pinnedCapabilities.includes(capabilityId)) {
        return state; // Already pinned
    }
    return {
        ...state,
        pinnedCapabilities: [...state.pinnedCapabilities, capabilityId],
    };
}
/**
 * Unpin capability from dock (user explicit action)
 */
function unpinFromDock(state, capabilityId) {
    return {
        ...state,
        pinnedCapabilities: state.pinnedCapabilities.filter(id => id !== capabilityId),
    };
}
/**
 * Update running capabilities (from WindowManager)
 * Internal update, not user action
 */
function updateRunningCapabilities(state, running) {
    return {
        ...state,
        runningCapabilities: running,
    };
}
/**
 * Get click action for dock item
 * Requires windowId resolver for focus action
 *
 * @param item - The dock item clicked
 * @param getPrimaryWindowId - Resolver function (from WindowManager)
 */
function getDockClickAction(item, getPrimaryWindowId) {
    if (item.isRunning && getPrimaryWindowId) {
        const windowId = getPrimaryWindowId(item.capabilityId);
        if (windowId) {
            return { type: 'FOCUS_WINDOW', windowId };
        }
    }
    // Fallback: open capability (will focus if single mode)
    return {
        type: 'OPEN_CAPABILITY',
        payload: { capabilityId: item.capabilityId }
    };
}
/**
 * Legacy-compatible: get action without windowId resolver
 * (Uses capabilityId only, let WindowManager resolve)
 */
function getDockClickActionLegacy(item) {
    if (item.isRunning) {
        return { type: 'FOCUS_CAPABILITY', capabilityId: item.capabilityId };
    }
    return { type: 'OPEN_CAPABILITY', capabilityId: item.capabilityId };
}
function validateDockContract(state) {
    const items = getDockItems(state);
    // Verify all items are either pinned or running
    const allPinnedOrRunning = items.every(item => item.isPinned || item.isRunning);
    return {
        itemsArePinnedOrRunningOnly: allPinnedOrRunning,
        noBadges: true, // By design: no badge support
        noCounts: true, // By design: no count support
        noBouncingAnimations: true, // By design: no animation support
        noProgressIndicators: true, // By design: no progress support
        noAutoPin: true, // By design: pin requires user action
    };
}
//# sourceMappingURL=DockMVP.js.map