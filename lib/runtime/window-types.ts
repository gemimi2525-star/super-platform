/**
 * ═══════════════════════════════════════════════════════════════════════════
 * WINDOW ROLE & CAPABILITY MODEL (OS-GRADE)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Defines the Taxonomy of Window Roles and their enforceable Capabilities.
 * This replaces hardcoded behavior checks with a deterministic matrix.
 * 
 * @module lib/runtime/window-types
 */

// ═══════════════════════════════════════════════════════════════════════════
// 1. WINDOW ROLE TAXONOMY
// ═══════════════════════════════════════════════════════════════════════════

export type WindowRole =
    | 'APP'       // Standard application window (Chrome, Finder)
    | 'UTILITY'   // Floating tool window (Calculator, Toolbars)
    | 'PANEL'     // System panel (Control Center, Notifications)
    | 'MODAL'     // Blocking dialog (Alerts, Confirmations)
    | 'OVERLAY'   // Transient overlay (Spotlight, Quick Look)
    | 'SYSTEM';   // System-critical surface (Desktop, Lock Screen)

// ═══════════════════════════════════════════════════════════════════════════
// 2. CAPABILITY DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

export interface WindowCapability {
    readonly movable: boolean;      // Can be moved by user
    readonly resizable: boolean;    // Can be resized by user
    readonly maximizable: boolean;  // Can be maximized
    readonly minimizable: boolean;  // Can be minimized to Dock
    readonly focusable: boolean;    // Can receive input focus
    readonly alwaysOnTop: boolean;  // Z-index priority
    readonly closable: boolean;     // Has close button
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. CAPABILITY MATRIX (Source of Truth)
// ═══════════════════════════════════════════════════════════════════════════

export const WINDOW_ROLE_CAPABILITIES: Record<WindowRole, WindowCapability> = {
    'APP': {
        movable: true,
        resizable: true,
        maximizable: true,
        minimizable: true,
        focusable: true,
        alwaysOnTop: false,
        closable: true,
    },
    'UTILITY': {
        movable: true,       // Floating tools MUST be movable
        resizable: false,    // Often fixed size
        maximizable: false,  // No maximize
        minimizable: true,   // Can minimize
        focusable: true,
        alwaysOnTop: true,   // Floats above apps
        closable: true,
    },
    'PANEL': {
        movable: false,      // Fixed position (usually)
        resizable: false,
        maximizable: false,
        minimizable: false,
        focusable: true,
        alwaysOnTop: true,
        closable: true,      // Can be dismissed
    },
    'MODAL': {
        movable: false,      // Centered and fixed
        resizable: false,
        maximizable: false,
        minimizable: false,
        focusable: true,
        alwaysOnTop: true,
        closable: false,     // Must complete action
    },
    'OVERLAY': {
        movable: false,
        resizable: false,
        maximizable: false,
        minimizable: false,
        focusable: true,
        alwaysOnTop: true,
        closable: true,      // Click background to close
    },
    'SYSTEM': {
        movable: false,
        resizable: false,
        maximizable: false,
        minimizable: false,
        focusable: false,    // Often passive
        alwaysOnTop: false,  // Background layer
        closable: false,     // Persistent
    },
};

// ═══════════════════════════════════════════════════════════════════════════
// 4. HELPER: GET CAPABILITIES
// ═══════════════════════════════════════════════════════════════════════════

export function getCapabilitiesForRole(role: WindowRole): WindowCapability {
    return WINDOW_ROLE_CAPABILITIES[role] || WINDOW_ROLE_CAPABILITIES['APP'];
}
