/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CORE OS KERNEL — Window Manager (HARDENED)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Window lifecycle management driven by capability manifest.
 *
 * @module coreos/window-manager
 * @version 2.0.0 (Hardened)
 */
import type { CapabilityId, Window, CorrelationId, SpaceId } from '../types/index.js';
/**
 * Window Manager - Manages window lifecycle
 */
export declare class CoreOSWindowManager {
    /**
     * Open a window for a capability
     * Returns the window ID if created, or existing window ID if single instance
     * Open a window for a capability (Phase I WindowMode semantics)
     * - single: reuse existing (within same space — Phase O)
     * - multi: always create new
     * - multiByContext: require contextId, focus same context (within same space — Phase O)
     * - backgroundOnly: return null (no window)
     *
     * Phase O: spaceId parameter for explicit space targeting
     */
    openWindow(capabilityId: CapabilityId, correlationId: CorrelationId, contextId?: string, spaceId?: SpaceId): string | null;
    /**
     * Get next z-index for new window
     */
    private getNextZIndex;
    /**
     * Close a window
     */
    closeWindow(windowId: string, correlationId: CorrelationId): void;
    /**
     * Focus a window
     */
    focusWindow(windowId: string, correlationId: CorrelationId): void;
    /**
     * Minimize a window
     */
    minimizeWindow(windowId: string, correlationId: CorrelationId): void;
    /**
     * Restore a minimized window
     */
    restoreWindow(windowId: string, correlationId: CorrelationId): void;
    /**
     * Minimize all windows
     */
    minimizeAll(correlationId: CorrelationId): void;
    /**
     * Get all windows for a capability
     */
    getWindowsForCapability(capabilityId: CapabilityId): readonly Window[];
    /**
     * Check if any window is open for capability
     */
    hasOpenWindow(capabilityId: CapabilityId): boolean;
    /**
     * Get unique capability IDs that have open windows in ACTIVE SPACE ONLY
     * Used by Dock to show "running" indicators
     * Phase P: Now space-scoped — does not show cross-space windows
     */
    getRunningCapabilityIds(): readonly CapabilityId[];
    /**
     * Get the primary window ID for a capability in ACTIVE SPACE (for Dock focus)
     * Returns the most recently focused window (highest zIndex) in active space
     * Phase P: Now space-scoped
     */
    getPrimaryWindowIdForCapability(capabilityId: CapabilityId): string | null;
    /**
     * Phase P: Get windows visible in active space
     * Used for visibility checks and discovery
     */
    getVisibleWindows(): readonly Window[];
    /**
     * Phase P: Check if a window is visible in active space
     */
    isWindowVisible(windowId: string): boolean;
    /**
     * Phase P: Get discoverable capabilities in active space
     * Returns capability IDs that can be opened in the current space
     * (respects space policy canOpenWindow)
     */
    getDiscoverableCapabilities(): readonly CapabilityId[];
    /**
     * Get the currently focused window ID
     * Returns null if no window has focus
     */
    getFocusedWindowId(): string | null;
    /**
     * Get all active (non-minimized, non-hidden) window IDs
     */
    getActiveWindowIds(): readonly string[];
    /**
     * Get all minimized window IDs
     */
    getMinimizedWindowIds(): readonly string[];
    /**
     * Get window lifecycle state
     */
    getWindowLifecycleState(windowId: string): 'active' | 'focused' | 'minimized' | 'hidden' | null;
    /**
     * Get count of windows by lifecycle state
     */
    getWindowCounts(): {
        total: number;
        active: number;
        focused: number;
        minimized: number;
        hidden: number;
    };
    /**
     * Phase Q: Get persisted (minimized) windows in active space
     * These are candidates for restore
     */
    getPersistedWindowsInActiveSpace(): readonly Window[];
    /**
     * Phase Q: Restore a specific window by ID
     * Only works for minimized windows in active space
     * @returns true if restored, false if not eligible
     */
    restoreWindowById(windowId: string, correlationId: CorrelationId): boolean;
    /**
     * Phase Q: Restore all minimized windows in active space
     * @returns count of windows restored
     */
    restoreAllInActiveSpace(correlationId: CorrelationId): number;
    /**
     * Get focusable windows in ACTIVE SPACE only (active only, sorted by z-index)
     * Used for next/prev focus cycling
     * Phase N: Now space-scoped
     */
    private getFocusableWindowIds;
    /**
     * Get next focusable window ID in ACTIVE SPACE (cycles)
     * Returns null if no focusable windows in current space
     */
    getNextFocusableWindowId(): string | null;
    /**
     * Get previous focusable window ID in ACTIVE SPACE (cycles)
     * Returns null if no focusable windows in current space
     */
    getPreviousFocusableWindowId(): string | null;
    /**
     * Get focusable window by index in ACTIVE SPACE
     * Returns null if index out of bounds
     */
    getFocusableWindowIdByIndex(index: number): string | null;
    /**
     * Get the last minimized window ID in ACTIVE SPACE (most recently minimized)
     * Used for restore-last shortcut
     * Phase N: Now space-scoped
     */
    getLastMinimizedWindowId(): string | null;
    /**
     * Minimize the focused window (must be in ACTIVE SPACE)
     * Returns the windowId that was minimized, or null
     */
    minimizeFocusedWindow(correlationId: CorrelationId): string | null;
    /**
     * Close the focused window (must be in ACTIVE SPACE)
     * Returns the windowId that was closed, or null
     */
    closeFocusedWindow(correlationId: CorrelationId): string | null;
    /**
     * Restore the last minimized window in ACTIVE SPACE
     * Returns the windowId that was restored, or null
     * Phase N: Now space-scoped
     */
    restoreLastMinimizedWindow(correlationId: CorrelationId): string | null;
    /**
     * Escape to calm — minimize all windows in ACTIVE SPACE only
     * Phase N: Now space-scoped (does not touch other spaces)
     */
    escapeToCalm(correlationId: CorrelationId): void;
    /**
     * Minimize all windows in ACTIVE SPACE only
     * Phase N: Space-scoped version of minimizeAll
     */
    minimizeAllInActiveSpace(correlationId: CorrelationId): void;
    /**
     * Get the active space ID
     */
    getActiveSpaceId(): SpaceId;
    /**
     * Get all windows in a specific space
     */
    getWindowsInSpace(spaceId: SpaceId): readonly Window[];
    /**
     * Get all windows in the active space
     */
    getWindowsInActiveSpace(): readonly Window[];
    /**
     * Get active (non-minimized) windows in the active space only
     * Used for focus navigation (Phase K) - respects space boundaries
     */
    getActiveWindowsInActiveSpace(): readonly Window[];
    /**
     * Move a window to a different space
     */
    moveWindowToSpace(windowId: string, spaceId: SpaceId, correlationId: CorrelationId): boolean;
    /**
     * Switch to a different space
     */
    switchSpace(spaceId: SpaceId, correlationId: CorrelationId): void;
    /**
     * Get all unique space IDs that have windows
     */
    getSpacesWithWindows(): readonly SpaceId[];
}
export declare function getWindowManager(): CoreOSWindowManager;
export declare function resetWindowManager(): void;
//# sourceMappingURL=window-manager.d.ts.map