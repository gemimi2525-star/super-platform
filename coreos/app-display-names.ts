/**
 * ═══════════════════════════════════════════════════════════════════════════
 * APP_DISPLAY_NAMES — Single Source of Truth for App Titles (Phase 39F)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Canonical display names for all core applications.
 * All user-facing surfaces (Dock, Window Title, App Header) must read from here.
 *
 * @module coreos/app-display-names
 */

export const APP_DISPLAY_NAMES = {
    'ops.center': 'Ops Center',
    'system.hub': 'System Hub',
    'brain.assist': 'Brain Assistant',
    'core.notes': 'Notes',
} as const;

export type AppDisplayKey = keyof typeof APP_DISPLAY_NAMES;
