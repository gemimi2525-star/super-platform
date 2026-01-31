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

import type {
    CapabilityId,
    Window,
    SystemState,
    CorrelationId,
    SpaceId,
} from '../types/index.js';
import { DEFAULT_SPACE_ID } from '../types/index.js';
import { getStateStore, type StateAction } from './state.js';
import { getEventBus } from './event-bus.js';
import { getCapabilityGraph } from './capability-graph.js';
import { getPolicyEngine } from '../policy-engine/index.js';

/**
 * Window Manager - Manages window lifecycle
 */
export class CoreOSWindowManager {

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
    openWindow(
        capabilityId: CapabilityId,
        correlationId: CorrelationId,
        contextId?: string,
        spaceId?: SpaceId  // Phase O: explicit space targeting
    ): string | null {
        const store = getStateStore();
        const eventBus = getEventBus();
        const graph = getCapabilityGraph();
        const state = store.getState();

        const manifest = graph.getManifest(capabilityId);
        if (!manifest) {
            return null;
        }

        // Phase O: Determine target space (explicit or fallback to activeSpaceId)
        const targetSpaceId = spaceId ?? state.activeSpaceId;

        // Phase I: backgroundOnly creates no window
        if (manifest.windowMode === 'backgroundOnly' || !manifest.hasUI) {
            // Mark as active capability but no window
            // (future: activeCapabilities state can be added)
            return null;
        }

        const windowMode = manifest.windowMode;

        // Phase I: multiByContext requires contextId
        if (windowMode === 'multiByContext' && !contextId) {
            console.warn(`[WindowManager] multiByContext capability '${capabilityId}' requires contextId`);
            return null; // Validation fail
        }

        // Phase O: Single instance — focus existing window WITHIN SAME SPACE
        if (windowMode === 'single') {
            const existingWindow = Object.values(state.windows)
                .find(w => w.capabilityId === capabilityId && w.spaceId === targetSpaceId);

            if (existingWindow) {
                this.focusWindow(existingWindow.id, correlationId);
                return existingWindow.id;
            }
        }

        // Phase O: MultiByContext — check for existing window with same context IN SAME SPACE
        if (windowMode === 'multiByContext' && contextId) {
            const existingWindow = Object.values(state.windows)
                .find(w => w.capabilityId === capabilityId && w.contextId === contextId && w.spaceId === targetSpaceId);

            if (existingWindow) {
                this.focusWindow(existingWindow.id, correlationId);
                return existingWindow.id;
            }
        }

        // multi: Always create new window
        // single (no existing in this space): Create new window
        // multiByContext (no existing for context in this space): Create new window

        // Create new window
        const windowId = `window-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newWindow: Window = {
            id: windowId,
            capabilityId,
            state: 'active',
            zIndex: this.getNextZIndex(state),
            title: manifest.title, // From Manifest (Window Identity Contract)
            contextId: contextId ?? null,
            spaceId: targetSpaceId,  // Phase O: Use explicit target space
            createdAt: Date.now(),
        };

        store.dispatch({
            type: 'WINDOW_CREATE',
            window: newWindow,
            correlationId,
        });

        eventBus.emit({
            type: 'WINDOW_CREATED',
            window: newWindow,
            correlationId,
            timestamp: Date.now(),
        });

        return windowId;
    }

    /**
     * Get next z-index for new window
     */
    private getNextZIndex(state: SystemState): number {
        const maxZ = Object.values(state.windows)
            .reduce((max, w) => Math.max(max, w.zIndex), 0);
        return maxZ + 1;
    }

    /**
     * Close a window
     */
    closeWindow(windowId: string, correlationId: CorrelationId): void {
        const store = getStateStore();
        const eventBus = getEventBus();

        store.dispatch({ type: 'WINDOW_CLOSE', windowId, correlationId });
        eventBus.emit({
            type: 'WINDOW_CLOSED',
            windowId,
            correlationId,
            timestamp: Date.now(),
        });
    }

    /**
     * Focus a window
     */
    focusWindow(windowId: string, correlationId: CorrelationId): void {
        const store = getStateStore();
        const eventBus = getEventBus();

        store.dispatch({ type: 'WINDOW_FOCUS', windowId, correlationId });
        eventBus.emit({
            type: 'WINDOW_FOCUSED',
            windowId,
            correlationId,
            timestamp: Date.now(),
        });
    }

    /**
     * Minimize a window
     */
    minimizeWindow(windowId: string, correlationId: CorrelationId): void {
        const store = getStateStore();
        const eventBus = getEventBus();

        store.dispatch({ type: 'WINDOW_MINIMIZE', windowId, correlationId });
        eventBus.emit({
            type: 'WINDOW_MINIMIZED',
            windowId,
            correlationId,
            timestamp: Date.now(),
        });
    }

    /**
     * Restore a minimized window
     */
    restoreWindow(windowId: string, correlationId: CorrelationId): void {
        const store = getStateStore();
        const eventBus = getEventBus();

        store.dispatch({ type: 'WINDOW_RESTORE', windowId, correlationId });
        eventBus.emit({
            type: 'WINDOW_RESTORED',
            windowId,
            correlationId,
            timestamp: Date.now(),
        });
    }

    /**
     * Minimize all windows
     */
    minimizeAll(correlationId: CorrelationId): void {
        const store = getStateStore();
        const eventBus = getEventBus();

        store.dispatch({ type: 'WINDOW_MINIMIZE_ALL', correlationId });
        eventBus.emit({
            type: 'CALM_STATE_ENTERED',
            correlationId,
            timestamp: Date.now(),
        });
    }

    /**
     * Get all windows for a capability
     */
    getWindowsForCapability(capabilityId: CapabilityId): readonly Window[] {
        const state = getStateStore().getState();
        return Object.values(state.windows)
            .filter(w => w.capabilityId === capabilityId);
    }

    /**
     * Check if any window is open for capability
     */
    hasOpenWindow(capabilityId: CapabilityId): boolean {
        return this.getWindowsForCapability(capabilityId).length > 0;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PHASE I: DOCK INTEGRATION METHODS
    // Phase P: Now space-aware (activeSpaceId only)
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Get unique capability IDs that have open windows in ACTIVE SPACE ONLY
     * Used by Dock to show "running" indicators
     * Phase P: Now space-scoped — does not show cross-space windows
     */
    getRunningCapabilityIds(): readonly CapabilityId[] {
        const state = getStateStore().getState();
        const capabilityIds = new Set<CapabilityId>();

        for (const window of Object.values(state.windows)) {
            // Phase P: Only include windows in active space
            if (window.spaceId === state.activeSpaceId) {
                capabilityIds.add(window.capabilityId);
            }
        }

        return Array.from(capabilityIds);
    }

    /**
     * Get the primary window ID for a capability in ACTIVE SPACE (for Dock focus)
     * Returns the most recently focused window (highest zIndex) in active space
     * Phase P: Now space-scoped
     */
    getPrimaryWindowIdForCapability(capabilityId: CapabilityId): string | null {
        const state = getStateStore().getState();
        const windows = this.getWindowsForCapability(capabilityId)
            .filter(w => w.spaceId === state.activeSpaceId);  // Phase P: Space filter

        if (windows.length === 0) {
            return null;
        }

        // Return window with highest zIndex (most recently focused)
        return windows.reduce((highest, w) =>
            w.zIndex > highest.zIndex ? w : highest
        ).id;
    }

    /**
     * Phase P: Get windows visible in active space
     * Used for visibility checks and discovery
     */
    getVisibleWindows(): readonly Window[] {
        const state = getStateStore().getState();
        return Object.values(state.windows)
            .filter(w => w.spaceId === state.activeSpaceId);
    }

    /**
     * Phase P: Check if a window is visible in active space
     */
    isWindowVisible(windowId: string): boolean {
        const state = getStateStore().getState();
        const window = state.windows[windowId];
        if (!window) return false;
        return window.spaceId === state.activeSpaceId;
    }

    /**
     * Phase P: Get discoverable capabilities in active space
     * Returns capability IDs that can be opened in the current space
     * (respects space policy canOpenWindow)
     */
    getDiscoverableCapabilities(): readonly CapabilityId[] {
        const state = getStateStore().getState();
        const policyEngine = getPolicyEngine();
        const graph = getCapabilityGraph();

        const allCapabilities = graph.getAllIds();

        return allCapabilities.filter((capabilityId: CapabilityId) => {
            // Check if capability can be discovered/opened in this space
            return policyEngine.canDiscoverCapabilityInSpace({
                capabilityId,
                spaceId: state.activeSpaceId,
                security: state.security,
            });
        });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PHASE J: WINDOW LIFECYCLE HELPERS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Get the currently focused window ID
     * Returns null if no window has focus
     */
    getFocusedWindowId(): string | null {
        const state = getStateStore().getState();
        if (!state.focusedWindowId) {
            return null;
        }
        // Validate the focused window still exists and is active
        const window = state.windows[state.focusedWindowId];
        if (window && window.state === 'active') {
            return state.focusedWindowId;
        }
        return null;
    }

    /**
     * Get all active (non-minimized, non-hidden) window IDs
     */
    getActiveWindowIds(): readonly string[] {
        const state = getStateStore().getState();
        return Object.values(state.windows)
            .filter(w => w.state === 'active')
            .map(w => w.id);
    }

    /**
     * Get all minimized window IDs
     */
    getMinimizedWindowIds(): readonly string[] {
        const state = getStateStore().getState();
        return Object.values(state.windows)
            .filter(w => w.state === 'minimized')
            .map(w => w.id);
    }

    /**
     * Get window lifecycle state
     */
    getWindowLifecycleState(windowId: string): 'active' | 'focused' | 'minimized' | 'hidden' | null {
        const state = getStateStore().getState();
        const window = state.windows[windowId];
        if (!window) {
            return null;
        }

        if (window.state === 'minimized') {
            return 'minimized';
        }
        if (window.state === 'hidden') {
            return 'hidden';
        }
        // window.state === 'active'
        if (windowId === state.focusedWindowId) {
            return 'focused';
        }
        return 'active';
    }

    /**
     * Get count of windows by lifecycle state
     */
    getWindowCounts(): {
        total: number;
        active: number;
        focused: number;
        minimized: number;
        hidden: number;
    } {
        const state = getStateStore().getState();
        const windows = Object.values(state.windows);

        const active = windows.filter(w => w.state === 'active').length;
        const minimized = windows.filter(w => w.state === 'minimized').length;
        const hidden = windows.filter(w => w.state === 'hidden').length;
        const focused = state.focusedWindowId ? 1 : 0;

        return {
            total: windows.length,
            active,
            focused,
            minimized,
            hidden,
        };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PHASE Q: RESTORE HELPERS (Space-Scoped, Explicit Intent Only)
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Phase Q: Get persisted (minimized) windows in active space
     * These are candidates for restore
     */
    getPersistedWindowsInActiveSpace(): readonly Window[] {
        const state = getStateStore().getState();
        return Object.values(state.windows)
            .filter(w =>
                w.spaceId === state.activeSpaceId &&
                w.state === 'minimized'
            );
    }

    /**
     * Phase Q: Restore a specific window by ID
     * Only works for minimized windows in active space
     * @returns true if restored, false if not eligible
     */
    restoreWindowById(windowId: string, correlationId: CorrelationId): boolean {
        const store = getStateStore();
        const eventBus = getEventBus();
        const state = store.getState();

        const window = state.windows[windowId];

        // Validation: window must exist
        if (!window) {
            return false;
        }

        // Validation: must be in active space (no cross-space restore)
        if (window.spaceId !== state.activeSpaceId) {
            return false;
        }

        // Validation: must be minimized
        if (window.state !== 'minimized') {
            return false;
        }

        const graph = getCapabilityGraph();
        const manifest = graph.getManifest(window.capabilityId);

        // Validation: backgroundOnly → skip (should never have window but be safe)
        if (manifest?.windowMode === 'backgroundOnly') {
            return false;
        }

        // Restore: change state to active
        store.dispatch({
            type: 'WINDOW_RESTORE',
            windowId,
            correlationId,
        });

        // Focus the restored window
        this.focusWindow(windowId, correlationId);

        eventBus.emit({
            type: 'WINDOW_RESTORED',
            windowId,
            correlationId,
            timestamp: Date.now(),
        });

        return true;
    }

    /**
     * Phase Q: Restore all minimized windows in active space
     * @returns count of windows restored
     */
    restoreAllInActiveSpace(correlationId: CorrelationId): number {
        const persisted = this.getPersistedWindowsInActiveSpace();
        let restoredCount = 0;

        for (const window of persisted) {
            if (this.restoreWindowById(window.id, correlationId)) {
                restoredCount++;
            }
        }

        return restoredCount;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PHASE K: FOCUS NAVIGATION + KEYBOARD SHORTCUT HELPERS
    // Phase N: Now space-scoped (activeSpaceId only)
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Get focusable windows in ACTIVE SPACE only (active only, sorted by z-index)
     * Used for next/prev focus cycling
     * Phase N: Now space-scoped
     */
    private getFocusableWindowIds(): readonly string[] {
        const state = getStateStore().getState();
        const windows = Object.values(state.windows)
            .filter(w => w.state === 'active' && w.spaceId === state.activeSpaceId)
            .sort((a, b) => a.zIndex - b.zIndex);
        return windows.map(w => w.id);
    }

    /**
     * Get next focusable window ID in ACTIVE SPACE (cycles)
     * Returns null if no focusable windows in current space
     */
    getNextFocusableWindowId(): string | null {
        const state = getStateStore().getState();
        const focusableIds = this.getFocusableWindowIds();

        if (focusableIds.length === 0) {
            return null;
        }

        if (!state.focusedWindowId) {
            return focusableIds[0];
        }

        const currentIndex = focusableIds.indexOf(state.focusedWindowId);
        if (currentIndex === -1) {
            return focusableIds[0];
        }

        const nextIndex = (currentIndex + 1) % focusableIds.length;
        return focusableIds[nextIndex];
    }

    /**
     * Get previous focusable window ID in ACTIVE SPACE (cycles)
     * Returns null if no focusable windows in current space
     */
    getPreviousFocusableWindowId(): string | null {
        const state = getStateStore().getState();
        const focusableIds = this.getFocusableWindowIds();

        if (focusableIds.length === 0) {
            return null;
        }

        if (!state.focusedWindowId) {
            return focusableIds[focusableIds.length - 1];
        }

        const currentIndex = focusableIds.indexOf(state.focusedWindowId);
        if (currentIndex === -1) {
            return focusableIds[focusableIds.length - 1];
        }

        const prevIndex = (currentIndex - 1 + focusableIds.length) % focusableIds.length;
        return focusableIds[prevIndex];
    }

    /**
     * Get focusable window by index in ACTIVE SPACE
     * Returns null if index out of bounds
     */
    getFocusableWindowIdByIndex(index: number): string | null {
        const focusableIds = this.getFocusableWindowIds();
        if (index < 0 || index >= focusableIds.length) {
            return null;
        }
        return focusableIds[index];
    }

    /**
     * Get the last minimized window ID in ACTIVE SPACE (most recently minimized)
     * Used for restore-last shortcut
     * Phase N: Now space-scoped
     */
    getLastMinimizedWindowId(): string | null {
        const state = getStateStore().getState();
        const minimizedWindows = Object.values(state.windows)
            .filter(w => w.state === 'minimized' && w.spaceId === state.activeSpaceId);

        if (minimizedWindows.length === 0) {
            return null;
        }

        // Return the one with highest zIndex (was most recently active before minimize)
        return minimizedWindows.reduce((latest, w) =>
            w.zIndex > latest.zIndex ? w : latest
        ).id;
    }

    /**
     * Minimize the focused window (must be in ACTIVE SPACE)
     * Returns the windowId that was minimized, or null
     */
    minimizeFocusedWindow(correlationId: CorrelationId): string | null {
        const focusedWindowId = this.getFocusedWindowId();
        if (!focusedWindowId) {
            return null;
        }

        // Verify window is in active space
        const state = getStateStore().getState();
        const window = state.windows[focusedWindowId];
        if (!window || window.spaceId !== state.activeSpaceId) {
            return null;
        }

        this.minimizeWindow(focusedWindowId, correlationId);
        return focusedWindowId;
    }

    /**
     * Close the focused window (must be in ACTIVE SPACE)
     * Returns the windowId that was closed, or null
     */
    closeFocusedWindow(correlationId: CorrelationId): string | null {
        const focusedWindowId = this.getFocusedWindowId();
        if (!focusedWindowId) {
            return null;
        }

        // Verify window is in active space
        const state = getStateStore().getState();
        const window = state.windows[focusedWindowId];
        if (!window || window.spaceId !== state.activeSpaceId) {
            return null;
        }

        this.closeWindow(focusedWindowId, correlationId);
        return focusedWindowId;
    }

    /**
     * Restore the last minimized window in ACTIVE SPACE
     * Returns the windowId that was restored, or null
     * Phase N: Now space-scoped
     */
    restoreLastMinimizedWindow(correlationId: CorrelationId): string | null {
        const lastMinimizedId = this.getLastMinimizedWindowId();
        if (!lastMinimizedId) {
            return null;
        }
        this.restoreWindow(lastMinimizedId, correlationId);
        return lastMinimizedId;
    }

    /**
     * Escape to calm — minimize all windows in ACTIVE SPACE only
     * Phase N: Now space-scoped (does not touch other spaces)
     */
    escapeToCalm(correlationId: CorrelationId): void {
        this.minimizeAllInActiveSpace(correlationId);
    }

    /**
     * Minimize all windows in ACTIVE SPACE only
     * Phase N: Space-scoped version of minimizeAll
     */
    minimizeAllInActiveSpace(correlationId: CorrelationId): void {
        const store = getStateStore();
        const state = store.getState();

        // Only minimize windows in the current active space
        Object.values(state.windows)
            .filter(w => w.state === 'active' && w.spaceId === state.activeSpaceId)
            .forEach(w => {
                store.dispatch({ type: 'WINDOW_MINIMIZE', windowId: w.id, correlationId });
            });

        // Clear focus
        store.dispatch({ type: 'WINDOW_FOCUS', windowId: '', correlationId });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PHASE L: VIRTUAL SPACES / CONTEXTS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Get the active space ID
     */
    getActiveSpaceId(): SpaceId {
        const state = getStateStore().getState();
        return state.activeSpaceId;
    }

    /**
     * Get all windows in a specific space
     */
    getWindowsInSpace(spaceId: SpaceId): readonly Window[] {
        const state = getStateStore().getState();
        return Object.values(state.windows)
            .filter(w => w.spaceId === spaceId);
    }

    /**
     * Get all windows in the active space
     */
    getWindowsInActiveSpace(): readonly Window[] {
        const state = getStateStore().getState();
        return this.getWindowsInSpace(state.activeSpaceId);
    }

    /**
     * Get active (non-minimized) windows in the active space only
     * Used for focus navigation (Phase K) - respects space boundaries
     */
    getActiveWindowsInActiveSpace(): readonly Window[] {
        return this.getWindowsInActiveSpace()
            .filter(w => w.state === 'active');
    }

    /**
     * Move a window to a different space
     */
    moveWindowToSpace(windowId: string, spaceId: SpaceId, correlationId: CorrelationId): boolean {
        const store = getStateStore();
        const state = store.getState();

        const window = state.windows[windowId];
        if (!window) {
            console.warn(`[WindowManager] Cannot move window: ${windowId} not found`);
            return false;
        }

        if (window.spaceId === spaceId) {
            return true;  // Already in target space
        }

        store.dispatch({
            type: 'WINDOW_MOVE_TO_SPACE',
            windowId,
            spaceId,
            correlationId,
        });

        return true;
    }

    /**
     * Switch to a different space
     */
    switchSpace(spaceId: SpaceId, correlationId: CorrelationId): void {
        const store = getStateStore();

        store.dispatch({
            type: 'SPACE_SWITCH',
            spaceId,
            correlationId,
        });
    }

    /**
     * Get all unique space IDs that have windows
     */
    getSpacesWithWindows(): readonly SpaceId[] {
        const state = getStateStore().getState();
        const spaces = new Set<SpaceId>();

        for (const window of Object.values(state.windows)) {
            spaces.add(window.spaceId);
        }

        // Always include default space
        spaces.add(DEFAULT_SPACE_ID);

        return Array.from(spaces);
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON
// ═══════════════════════════════════════════════════════════════════════════

let instance: CoreOSWindowManager | null = null;

export function getWindowManager(): CoreOSWindowManager {
    if (!instance) {
        instance = new CoreOSWindowManager();
    }
    return instance;
}

export function resetWindowManager(): void {
    instance = null;
}
