/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NEXUS Shell — Keyboard Handler (Phase 7.3)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Shell-level keyboard shortcuts for deterministic interaction.
 * 
 * Shortcuts:
 * - ESC: Defocus all windows
 * - Cmd/Ctrl+W: Close focused window
 * - Cmd/Ctrl+M: Minimize focused window
 * 
 * Rules:
 * - Shortcuts are ignored when focus is on input/textarea/contenteditable
 * - All shortcuts dispatch through ORBIT (WindowManager)
 * - No app-level interception
 * 
 * @module coreos/keyboard-handler
 * @version 1.0.0 (Phase 7.3)
 */

import { getWindowManager } from './window-manager';
import { createCorrelationId } from './types';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface KeyboardConfig {
    enableEsc: boolean;
    enableCmdW: boolean;
    enableCmdM: boolean;
    enableCmdK: boolean; // Phase 18: Brain AI overlay
}

const DEFAULT_CONFIG: KeyboardConfig = {
    enableEsc: true,
    enableCmdW: true,
    enableCmdM: true,
    enableCmdK: true, // Phase 18: Enabled by default
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if the current target is an editable element
 * Shortcuts should not fire when user is typing
 */
function isEditableElement(target: EventTarget | null): boolean {
    if (!target || !(target instanceof HTMLElement)) {
        return false;
    }

    const tagName = target.tagName.toLowerCase();

    // Standard input elements
    if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
        return true;
    }

    // ContentEditable elements
    if (target.isContentEditable) {
        return true;
    }

    // Check for role="textbox" (accessibility pattern)
    if (target.getAttribute('role') === 'textbox') {
        return true;
    }

    return false;
}

/**
 * Check if this is a modifier key combo (Cmd on Mac, Ctrl on others)
 */
function isModifierKey(event: KeyboardEvent): boolean {
    // Mac: metaKey (Cmd), Others: ctrlKey
    return event.metaKey || event.ctrlKey;
}

// ═══════════════════════════════════════════════════════════════════════════
// KEYBOARD HANDLER
// ═══════════════════════════════════════════════════════════════════════════

class ShellKeyboardHandler {
    private config: KeyboardConfig;
    private isActive: boolean = false;
    private boundHandler: ((e: KeyboardEvent) => void) | null = null;

    // Phase 18: Callback for ⌘+K Brain overlay toggle
    private onBrainToggle: (() => void) | null = null;

    constructor(config: Partial<KeyboardConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    /**
     * Phase 18: Register callback for ⌘+K toggle
     */
    setBrainToggleCallback(callback: (() => void) | null): void {
        this.onBrainToggle = callback;
    }

    /**
     * Activate keyboard handler
     * Should be called once when shell mounts
     */
    activate(): void {
        if (this.isActive || typeof window === 'undefined') {
            return;
        }

        this.boundHandler = this.handleKeyDown.bind(this);
        window.addEventListener('keydown', this.boundHandler);
        this.isActive = true;

        console.log('[NEXUS Keyboard] Handler activated');
    }

    /**
     * Deactivate keyboard handler
     * Should be called when shell unmounts
     */
    deactivate(): void {
        if (!this.isActive || !this.boundHandler) {
            return;
        }

        window.removeEventListener('keydown', this.boundHandler);
        this.boundHandler = null;
        this.isActive = false;

        console.log('[NEXUS Keyboard] Handler deactivated');
    }

    /**
     * Main keyboard event handler
     */
    private handleKeyDown(event: KeyboardEvent): void {
        // ─────────────────────────────────────────────────────────────────────
        // Phase 18: Cmd/Ctrl+K → Brain AI Overlay (works even in editable)
        // ─────────────────────────────────────────────────────────────────────
        if (event.key === 'k' && isModifierKey(event) && this.config.enableCmdK) {
            event.preventDefault();
            if (this.onBrainToggle) {
                this.onBrainToggle();
                console.log('[NEXUS Keyboard] Cmd+K → Brain overlay toggle');
            }
            return;
        }

        // Skip if typing in input field (for other shortcuts)
        if (isEditableElement(event.target)) {
            return;
        }

        const windowManager = getWindowManager();
        const focusedWindowId = windowManager.getFocusedWindowId();

        // ─────────────────────────────────────────────────────────────────────
        // ESC: Defocus all windows
        // ─────────────────────────────────────────────────────────────────────
        if (event.key === 'Escape' && this.config.enableEsc) {
            if (focusedWindowId) {
                event.preventDefault();
                windowManager.defocusAll(createCorrelationId());
                console.log('[NEXUS Keyboard] ESC → defocusAll');
            }
            // If already defocused, no-op (per spec)
            return;
        }

        // ─────────────────────────────────────────────────────────────────────
        // Cmd/Ctrl+W: Close focused window
        // ─────────────────────────────────────────────────────────────────────
        if (event.key === 'w' && isModifierKey(event) && this.config.enableCmdW) {
            if (focusedWindowId) {
                event.preventDefault();
                windowManager.closeWindow(focusedWindowId, createCorrelationId());
                console.log('[NEXUS Keyboard] Cmd+W → close window:', focusedWindowId);
            }
            return;
        }

        // ─────────────────────────────────────────────────────────────────────
        // Cmd/Ctrl+M: Minimize focused window
        // ─────────────────────────────────────────────────────────────────────
        if (event.key === 'm' && isModifierKey(event) && this.config.enableCmdM) {
            if (focusedWindowId) {
                event.preventDefault();
                windowManager.minimizeWindow(focusedWindowId, createCorrelationId());
                console.log('[NEXUS Keyboard] Cmd+M → minimize window:', focusedWindowId);
            }
            return;
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON INSTANCE
// ═══════════════════════════════════════════════════════════════════════════

let instance: ShellKeyboardHandler | null = null;

export function getKeyboardHandler(): ShellKeyboardHandler {
    if (!instance) {
        instance = new ShellKeyboardHandler();
    }
    return instance;
}

/**
 * Convenience function to activate keyboard handler
 * Safe to call multiple times
 */
export function activateKeyboardHandler(): void {
    getKeyboardHandler().activate();
}

/**
 * Convenience function to deactivate keyboard handler
 */
export function deactivateKeyboardHandler(): void {
    getKeyboardHandler().deactivate();
}

