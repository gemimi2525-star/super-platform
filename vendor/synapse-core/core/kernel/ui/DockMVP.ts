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

import { getCapabilityGraph } from '../capability-graph.js';
import type { CapabilityId, CapabilityManifest } from '../../types/index.js';

// ═══════════════════════════════════════════════════════════════════════════
// DOCK ITEM
// ═══════════════════════════════════════════════════════════════════════════

export interface DockItem {
    readonly capabilityId: CapabilityId;
    readonly manifest: CapabilityManifest;
    readonly isPinned: boolean;
    readonly isRunning: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// DOCK STATE (User-Owned)
// ═══════════════════════════════════════════════════════════════════════════

export interface DockState {
    /** User-pinned capability IDs (explicit user choice) */
    readonly pinnedCapabilities: readonly CapabilityId[];
    /** Running capability IDs (from WindowManager) */
    readonly runningCapabilities: readonly CapabilityId[];
}

export const createDockState = (): DockState => ({
    pinnedCapabilities: [],
    runningCapabilities: [],
});

// ═══════════════════════════════════════════════════════════════════════════
// DOCK LOGIC (Contract-Faithful)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get dock items = union(pinned, running)
 * Order: pinned first (stable user order), then running (not pinned)
 * 
 * @see DOCK_CONTRACT_v1.md Section 2
 */
export function getDockItems(state: DockState): readonly DockItem[] {
    const graph = getCapabilityGraph();
    const items: DockItem[] = [];
    const added = new Set<CapabilityId>();

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
export function pinToDock(state: DockState, capabilityId: CapabilityId): DockState {
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
export function unpinFromDock(state: DockState, capabilityId: CapabilityId): DockState {
    return {
        ...state,
        pinnedCapabilities: state.pinnedCapabilities.filter(id => id !== capabilityId),
    };
}

/**
 * Update running capabilities (from WindowManager)
 * Internal update, not user action
 */
export function updateRunningCapabilities(
    state: DockState,
    running: readonly CapabilityId[]
): DockState {
    return {
        ...state,
        runningCapabilities: running,
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// DOCK CLICK HANDLER (Intent Emission Only)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Click action for dock item (Phase I)
 * - Running → FOCUS_WINDOW with resolved windowId
 * - Not running → OPEN_CAPABILITY
 * 
 * @see /docs/contracts/DOCK_CONTRACT_v1.md Section 5
 */
export type DockClickAction =
    | { type: 'FOCUS_WINDOW'; windowId: string }
    | { type: 'OPEN_CAPABILITY'; payload: { capabilityId: CapabilityId } };

/**
 * Get click action for dock item
 * Requires windowId resolver for focus action
 * 
 * @param item - The dock item clicked
 * @param getPrimaryWindowId - Resolver function (from WindowManager)
 */
export function getDockClickAction(
    item: DockItem,
    getPrimaryWindowId?: (capabilityId: CapabilityId) => string | null
): DockClickAction {
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
export function getDockClickActionLegacy(item: DockItem): {
    type: 'FOCUS_CAPABILITY' | 'OPEN_CAPABILITY';
    capabilityId: CapabilityId;
} {
    if (item.isRunning) {
        return { type: 'FOCUS_CAPABILITY', capabilityId: item.capabilityId };
    }
    return { type: 'OPEN_CAPABILITY', capabilityId: item.capabilityId };
}

// ═══════════════════════════════════════════════════════════════════════════
// DOCK CONTRACT VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Validate Dock compliance with contract
 */
export interface DockContractValidation {
    readonly itemsArePinnedOrRunningOnly: boolean;
    readonly noBadges: boolean;
    readonly noCounts: boolean;
    readonly noBouncingAnimations: boolean;
    readonly noProgressIndicators: boolean;
    readonly noAutoPin: boolean;
}

export function validateDockContract(state: DockState): DockContractValidation {
    const items = getDockItems(state);

    // Verify all items are either pinned or running
    const allPinnedOrRunning = items.every(item => item.isPinned || item.isRunning);

    return {
        itemsArePinnedOrRunningOnly: allPinnedOrRunning,
        noBadges: true,              // By design: no badge support
        noCounts: true,              // By design: no count support
        noBouncingAnimations: true,  // By design: no animation support
        noProgressIndicators: true,  // By design: no progress support
        noAutoPin: true,             // By design: pin requires user action
    };
}
