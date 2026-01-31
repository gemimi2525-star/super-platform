/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CORE OS KERNEL — Main Kernel (HARDENED)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * THE HEART OF THE SYSTEM
 * - All actions flow through emit(Intent)
 * - Pipeline: Intent → Policy → Capability → Window
 * - Manifest + Policy drive all behavior
 *
 * @module coreos/kernel
 * @version 2.0.0 (Hardened)
 */
import type { Intent, UserRole } from '../types/index.js';
/**
 * Core OS Kernel - The heart of the system
 */
export declare class CoreOSKernel {
    /**
     * Bootstrap the kernel with user credentials
     */
    bootstrap(userId: string, role: UserRole, policies: string[]): void;
    /**
     * Main entry point - Emit an intent
     * All actions MUST go through this method
     */
    emit(intent: Intent): void;
    private handleOpenCapability;
    private handleCloseWindow;
    private handleFocusWindow;
    private handleMinimizeWindow;
    private handleRestoreWindow;
    private handleMinimizeAll;
    private handleFocusNextWindow;
    private handleFocusPreviousWindow;
    private handleFocusWindowByIndex;
    private handleMinimizeFocusedWindow;
    private handleRestoreLastMinimizedWindow;
    private handleCloseFocusedWindow;
    private handleEscapeToCalm;
    private handleSwitchSpace;
    private handleMoveWindowToSpace;
    /**
     * Phase Q: Handle RESTORE_ACTIVE_SPACE
     * Restores all minimized windows in the active space (explicit intent only)
     */
    private handleRestoreActiveSpace;
    /**
     * Phase Q: Handle RESTORE_WINDOW_BY_ID
     * Restores a specific minimized window (must be in active space)
     */
    private handleRestoreWindowById;
    private handleStepUpComplete;
    private handleStepUpCancel;
    private handleLogout;
    private handleLockScreen;
    private handleUnlockScreen;
    private updateCognitiveMode;
}
export declare function getKernel(): CoreOSKernel;
export declare function resetKernel(): void;
//# sourceMappingURL=index.d.ts.map