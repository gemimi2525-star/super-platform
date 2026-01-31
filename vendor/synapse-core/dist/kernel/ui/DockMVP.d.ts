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
import type { CapabilityId, CapabilityManifest } from '../../types/index.js';
export interface DockItem {
    readonly capabilityId: CapabilityId;
    readonly manifest: CapabilityManifest;
    readonly isPinned: boolean;
    readonly isRunning: boolean;
}
export interface DockState {
    /** User-pinned capability IDs (explicit user choice) */
    readonly pinnedCapabilities: readonly CapabilityId[];
    /** Running capability IDs (from WindowManager) */
    readonly runningCapabilities: readonly CapabilityId[];
}
export declare const createDockState: () => DockState;
/**
 * Get dock items = union(pinned, running)
 * Order: pinned first (stable user order), then running (not pinned)
 *
 * @see DOCK_CONTRACT_v1.md Section 2
 */
export declare function getDockItems(state: DockState): readonly DockItem[];
/**
 * Pin capability to dock (user explicit action)
 */
export declare function pinToDock(state: DockState, capabilityId: CapabilityId): DockState;
/**
 * Unpin capability from dock (user explicit action)
 */
export declare function unpinFromDock(state: DockState, capabilityId: CapabilityId): DockState;
/**
 * Update running capabilities (from WindowManager)
 * Internal update, not user action
 */
export declare function updateRunningCapabilities(state: DockState, running: readonly CapabilityId[]): DockState;
/**
 * Click action for dock item (Phase I)
 * - Running → FOCUS_WINDOW with resolved windowId
 * - Not running → OPEN_CAPABILITY
 *
 * @see /docs/contracts/DOCK_CONTRACT_v1.md Section 5
 */
export type DockClickAction = {
    type: 'FOCUS_WINDOW';
    windowId: string;
} | {
    type: 'OPEN_CAPABILITY';
    payload: {
        capabilityId: CapabilityId;
    };
};
/**
 * Get click action for dock item
 * Requires windowId resolver for focus action
 *
 * @param item - The dock item clicked
 * @param getPrimaryWindowId - Resolver function (from WindowManager)
 */
export declare function getDockClickAction(item: DockItem, getPrimaryWindowId?: (capabilityId: CapabilityId) => string | null): DockClickAction;
/**
 * Legacy-compatible: get action without windowId resolver
 * (Uses capabilityId only, let WindowManager resolve)
 */
export declare function getDockClickActionLegacy(item: DockItem): {
    type: 'FOCUS_CAPABILITY' | 'OPEN_CAPABILITY';
    capabilityId: CapabilityId;
};
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
export declare function validateDockContract(state: DockState): DockContractValidation;
//# sourceMappingURL=DockMVP.d.ts.map