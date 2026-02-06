/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SYNAPSE — UI Components Index (Phase H + I)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Contract-faithful UI components:
 * - FinderMVP: Intent Origin Surface
 * - DockMVP: Calm Presence Surface
 * - UserPreferences: User-owned storage
 * 
 * Phase I additions:
 * - createFinderIntent: Full intent with correlationId
 * - getDockClickActionLegacy: Capability-level focus
 * 
 * @module coreos/ui
 * @version 2.0.0 (Phase H + I)
 */

// Finder MVP
export {
    type FinderState,
    createFinderState,
    getFinderVisibleCapabilities,
    getFinderSearchableCapabilities,
    searchFinderCapabilities,
    isAlphabeticallySorted,
    createFinderOpenIntent,
    createFinderIntent,         // Phase I: Full intent
    type FinderContractValidation,
    validateFinderContract,
} from './FinderMVP';

// Dock MVP
export {
    type DockItem,
    type DockState,
    createDockState,
    getDockItems,
    pinToDock,
    unpinFromDock,
    updateRunningCapabilities,
    type DockClickAction,
    getDockClickAction,
    getDockClickActionLegacy,   // Phase I: Legacy compat
    type DockContractValidation,
    validateDockContract,
} from './DockMVP';

// User Preferences
export {
    type UserPreferences,
    DEFAULT_USER_PREFERENCES,
    loadUserPreferences,
    saveUserPreferences,
    pinCapability,
    unpinCapability,
    isCapabilityPinned,
} from './UserPreferences';

// Window Manager (Phase 17.1)
export {
    type WindowState,
    type WindowManagerState,
    type WindowAction,
    ZIndexManager,
    PositionManager,
    windowManagerReducer,
    canLaunchNewWindow,
    getActiveWindowCount,
    getMinimizedWindows,
    getVisibleWindows,
    getFocusedWindow,
    createInitialWindowManagerState,
    WINDOW_CONSTANTS,
} from './WindowManager';

// App Launcher (Phase 17.1)
export { AppLauncher } from './AppLauncher';
