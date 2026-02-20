/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CORE OS — Desktop Shortcut Apply Layer (Phase 19.5)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * The ONLY layer that writes to localStorage for shortcuts.
 * Called after API success. UI never writes directly.
 *
 * Flow: UI → API → success → applyShortcutCreated() → storage.upsert()
 *
 * @module coreos/desktop/shortcuts/apply
 */

import type { DesktopShortcut } from './types';
import { upsertShortcut, removeShortcutById } from './storage';

/**
 * Apply a shortcut creation after API audit success.
 * Writes to localStorage via storage adapter.
 */
export function applyShortcutCreated(shortcut: DesktopShortcut): void {
    upsertShortcut(shortcut);
}

/**
 * Apply a shortcut removal after API audit success.
 * Removes from localStorage via storage adapter.
 */
export function applyShortcutRemoved(id: string): void {
    removeShortcutById(id);
}
