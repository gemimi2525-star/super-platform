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

import type {
    Intent,
    CapabilityId,
    SecurityContext,
    CognitiveMode,
    CorrelationId,
    UserRole,
    PolicyContext,
    SpaceId,
} from './types';
import { createCorrelationId } from './types';
import { getStateStore } from './state';
import { getEventBus } from './event-bus';
import { getCapabilityGraph } from './capability-graph';
import { getWindowManager } from './window-manager';

// Step-up duration: 15 minutes
const STEP_UP_DURATION_MS = 15 * 60 * 1000;

/**
 * Core OS Kernel - The heart of the system
 */
export class CoreOSKernel {

    /**
     * Public method for Adapter to trigger Step Up
     */
    public initiateStepUp(capabilityId: CapabilityId, challenge: string, correlationId: CorrelationId): void {
        const store = getStateStore();
        const eventBus = getEventBus();

        store.dispatch({
            type: 'STEP_UP_PENDING',
            pending: { capabilityId, challenge, correlationId }
        });

        eventBus.emit({
            type: 'STEP_UP_REQUIRED',
            capabilityId,
            challenge,
            correlationId,
            timestamp: Date.now(),
        });
    }

    /**
     * Bootstrap the kernel with user credentials
     */
    bootstrap(
        userId: string,
        role: UserRole,
        policies: string[]
    ): void {
        const store = getStateStore();
        const eventBus = getEventBus();
        const correlationId = createCorrelationId();

        const security: SecurityContext = {
            authenticated: true,
            userId,
            role,
            stepUpActive: false,
            stepUpExpiry: null,
            policies,
        };

        store.dispatch({ type: 'SECURITY_SET', security, correlationId });
        store.dispatch({ type: 'COGNITIVE_MODE_SET', mode: 'calm', correlationId });

        eventBus.emit({
            type: 'SECURITY_CONTEXT_CHANGED',
            security,
            correlationId,
            timestamp: Date.now(),
        });
    }

    /**
     * Main entry point - Emit an intent
     * All actions MUST go through this method
     */
    emit(intent: Intent): void {
        const { type, correlationId } = intent;

        switch (type) {
            case 'OPEN_CAPABILITY':
                this.handleOpenCapability(
                    intent.payload.capabilityId,
                    correlationId,
                    intent.payload.contextId
                );
                break;

            case 'CLOSE_WINDOW':
                this.handleCloseWindow(intent.payload.windowId, correlationId);
                break;

            case 'FOCUS_WINDOW':
                this.handleFocusWindow(intent.payload.windowId, correlationId);
                break;

            case 'MINIMIZE_WINDOW':
                this.handleMinimizeWindow(intent.payload.windowId, correlationId);
                break;

            case 'RESTORE_WINDOW':
                this.handleRestoreWindow(intent.payload.windowId, correlationId);
                break;

            case 'MINIMIZE_ALL':
                this.handleMinimizeAll(correlationId);
                break;

            // ─────────────────────────────────────────────────────────────────
            // PHASE K: Keyboard Shortcut Intents
            // ─────────────────────────────────────────────────────────────────
            case 'FOCUS_NEXT_WINDOW':
                this.handleFocusNextWindow(correlationId);
                break;

            case 'FOCUS_PREVIOUS_WINDOW':
                this.handleFocusPreviousWindow(correlationId);
                break;

            case 'FOCUS_WINDOW_BY_INDEX':
                this.handleFocusWindowByIndex(intent.payload.index, correlationId);
                break;

            case 'MINIMIZE_FOCUSED_WINDOW':
                this.handleMinimizeFocusedWindow(correlationId);
                break;

            case 'RESTORE_LAST_MINIMIZED_WINDOW':
                this.handleRestoreLastMinimizedWindow(correlationId);
                break;

            case 'CLOSE_FOCUSED_WINDOW':
                this.handleCloseFocusedWindow(correlationId);
                break;

            case 'ESCAPE_TO_CALM':
                this.handleEscapeToCalm(correlationId);
                break;

            // ─────────────────────────────────────────────────────────────────
            // PHASE L: Virtual Spaces / Contexts
            // ─────────────────────────────────────────────────────────────────
            case 'SWITCH_SPACE':
                this.handleSwitchSpace(intent.payload.spaceId, correlationId);
                break;

            case 'MOVE_WINDOW_TO_SPACE':
                this.handleMoveWindowToSpace(
                    intent.payload.windowId,
                    intent.payload.spaceId,
                    correlationId
                );
                break;

            // ─────────────────────────────────────────────────────────────────
            // PHASE Q: Restore Intents (Explicit Only)
            // ─────────────────────────────────────────────────────────────────
            case 'RESTORE_ACTIVE_SPACE':
                this.handleRestoreActiveSpace(correlationId);
                break;

            case 'RESTORE_WINDOW_BY_ID':
                this.handleRestoreWindowById(intent.payload.windowId, correlationId);
                break;

            // ─────────────────────────────────────────────────────────────────

            case 'STEP_UP_COMPLETE':
                this.handleStepUpComplete(intent.payload.success, correlationId);
                break;

            case 'STEP_UP_CANCEL':
                this.handleStepUpCancel(correlationId);
                break;

            case 'LOGOUT':
                this.handleLogout(correlationId);
                break;

            case 'LOCK_SCREEN':
                this.handleLockScreen(correlationId);
                break;

            case 'UNLOCK_SCREEN':
                this.handleUnlockScreen(correlationId);
                break;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // INTENT HANDLERS
    // ═══════════════════════════════════════════════════════════════════════

    private handleOpenCapability(
        capabilityId: CapabilityId,
        correlationId: CorrelationId,
        contextId?: string
    ): void {
        // PERIMETER LOCK: Logic Removed. Assumes Verified by Adapter.
        const store = getStateStore();
        const eventBus = getEventBus();
        const windowManager = getWindowManager();
        const graph = getCapabilityGraph();

        const state = store.getState();
        const targetSpaceId = state.activeSpaceId;

        // Activate capability
        store.dispatch({ type: 'CAPABILITY_ACTIVATE', capabilityId, correlationId });
        eventBus.emit({
            type: 'CAPABILITY_ACTIVATED',
            capabilityId,
            correlationId,
            timestamp: Date.now(),
        });

        // Open window if capability has UI
        if (graph.hasUI(capabilityId)) {
            windowManager.openWindow(capabilityId, correlationId, contextId, targetSpaceId);
        }

        // Update context stack
        store.dispatch({ type: 'CONTEXT_PUSH', capabilityId, correlationId });

        // Update cognitive mode
        this.updateCognitiveMode(correlationId);
    }

    private handleCloseWindow(windowId: string, correlationId: CorrelationId): void {
        const windowManager = getWindowManager();
        windowManager.closeWindow(windowId, correlationId);
        this.updateCognitiveMode(correlationId);
    }

    private handleFocusWindow(windowId: string, correlationId: CorrelationId): void {
        const windowManager = getWindowManager();
        windowManager.focusWindow(windowId, correlationId);
        this.updateCognitiveMode(correlationId);
    }

    private handleMinimizeWindow(windowId: string, correlationId: CorrelationId): void {
        const windowManager = getWindowManager();
        windowManager.minimizeWindow(windowId, correlationId);
        this.updateCognitiveMode(correlationId);
    }

    private handleRestoreWindow(windowId: string, correlationId: CorrelationId): void {
        const windowManager = getWindowManager();
        windowManager.restoreWindow(windowId, correlationId);
        this.updateCognitiveMode(correlationId);
    }

    private handleMinimizeAll(correlationId: CorrelationId): void {
        const store = getStateStore();
        const windowManager = getWindowManager();

        windowManager.minimizeAll(correlationId);
        store.dispatch({ type: 'COGNITIVE_MODE_SET', mode: 'calm', correlationId });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE K: KEYBOARD SHORTCUT HANDLERS
    // Phase N: Now with policy gate for focus operations
    // ═══════════════════════════════════════════════════════════════════════

    private handleFocusNextWindow(correlationId: CorrelationId): void {
        const windowManager = getWindowManager();

        const nextWindowId = windowManager.getNextFocusableWindowId();
        if (nextWindowId) {
            windowManager.focusWindow(nextWindowId, correlationId);
            this.updateCognitiveMode(correlationId);
        }
    }

    private handleFocusPreviousWindow(correlationId: CorrelationId): void {
        const windowManager = getWindowManager();

        const prevWindowId = windowManager.getPreviousFocusableWindowId();
        if (prevWindowId) {
            windowManager.focusWindow(prevWindowId, correlationId);
            this.updateCognitiveMode(correlationId);
        }
    }

    private handleFocusWindowByIndex(index: number, correlationId: CorrelationId): void {
        const windowManager = getWindowManager();

        const windowId = windowManager.getFocusableWindowIdByIndex(index);
        if (windowId) {
            windowManager.focusWindow(windowId, correlationId);
            this.updateCognitiveMode(correlationId);
        }
    }

    private handleMinimizeFocusedWindow(correlationId: CorrelationId): void {
        const windowManager = getWindowManager();
        windowManager.minimizeFocusedWindow(correlationId);
        this.updateCognitiveMode(correlationId);
    }

    private handleRestoreLastMinimizedWindow(correlationId: CorrelationId): void {
        const windowManager = getWindowManager();
        windowManager.restoreLastMinimizedWindow(correlationId);
        this.updateCognitiveMode(correlationId);
    }

    private handleCloseFocusedWindow(correlationId: CorrelationId): void {
        const windowManager = getWindowManager();
        windowManager.closeFocusedWindow(correlationId);
        this.updateCognitiveMode(correlationId);
    }

    private handleEscapeToCalm(correlationId: CorrelationId): void {
        const store = getStateStore();
        const windowManager = getWindowManager();

        // Phase N: escapeToCalm now only affects active space
        windowManager.escapeToCalm(correlationId);
        store.dispatch({ type: 'COGNITIVE_MODE_SET', mode: 'calm', correlationId });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE L: VIRTUAL SPACES / CONTEXTS
    // ═══════════════════════════════════════════════════════════════════════

    private handleSwitchSpace(spaceId: SpaceId, correlationId: CorrelationId): void {
        const windowManager = getWindowManager();
        windowManager.switchSpace(spaceId, correlationId);

        // Recalculate cognitive mode for new space context
        this.updateCognitiveMode(correlationId);
    }

    private handleMoveWindowToSpace(
        windowId: string,
        spaceId: SpaceId,
        correlationId: CorrelationId
    ): void {
        const windowManager = getWindowManager();
        windowManager.moveWindowToSpace(windowId, spaceId, correlationId);

        // Recalculate cognitive mode (window might have left active space)
        this.updateCognitiveMode(correlationId);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE Q: RESTORE INTENT HANDLERS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Phase Q: Handle RESTORE_ACTIVE_SPACE
     * Restores all minimized windows in the active space (explicit intent only)
     */
    /**
     * Phase Q: Handle RESTORE_ACTIVE_SPACE
     * Restores all minimized windows in the active space (explicit intent only)
     */
    private handleRestoreActiveSpace(correlationId: CorrelationId): void {
        const store = getStateStore();
        const eventBus = getEventBus();
        const windowManager = getWindowManager();
        const state = store.getState();

        // Restore all in active space
        const restoredCount = windowManager.restoreAllInActiveSpace(correlationId);

        // Emit event
        eventBus.emit({
            type: 'SPACE_RESTORED',
            correlationId,
            timestamp: Date.now(),
            payload: { spaceId: state.activeSpaceId, windowsRestored: restoredCount },
        } as any);  // Cast since SPACE_RESTORED is new

        // Recalculate cognitive mode
        this.updateCognitiveMode(correlationId);
    }

    /**
     * Phase Q: Handle RESTORE_WINDOW_BY_ID
     * Restores a specific minimized window (must be in active space)
     */
    private handleRestoreWindowById(windowId: string, correlationId: CorrelationId): void {
        const store = getStateStore();
        const eventBus = getEventBus();
        const windowManager = getWindowManager();
        const state = store.getState();

        const window = state.windows[windowId];

        // Validation: window must exist and be in active space
        if (!window || window.spaceId !== state.activeSpaceId) {
            eventBus.emit({
                type: 'SPACE_ACCESS_DENIED',
                correlationId,
                timestamp: Date.now(),
                payload: {
                    spaceId: state.activeSpaceId,
                    reason: 'Window not found or not in active space',
                    windowId,
                    intentType: 'RESTORE_WINDOW_BY_ID',
                },
            });
            return;
        }

        // Restore the window
        const success = windowManager.restoreWindowById(windowId, correlationId);

        if (!success) {
            // Window not eligible (not minimized, etc.)
            return;
        }

        // Recalculate cognitive mode
        this.updateCognitiveMode(correlationId);
    }

    private handleStepUpComplete(success: boolean, correlationId: CorrelationId): void {
        const store = getStateStore();
        const eventBus = getEventBus();
        const state = store.getState();

        if (!state.pendingStepUp) return;

        const { capabilityId, correlationId: originalCorrelationId } = state.pendingStepUp;

        if (success) {
            // Activate step-up
            const expiry = Date.now() + STEP_UP_DURATION_MS;
            store.dispatch({ type: 'STEP_UP_ACTIVATE', expiry, correlationId });

            eventBus.emit({
                type: 'STEP_UP_COMPLETED',
                correlationId,
                timestamp: Date.now(),
            });

            // Retry the original capability open
            this.handleOpenCapability(capabilityId, originalCorrelationId);
        } else {
            store.dispatch({ type: 'STEP_UP_CLEAR', correlationId });
        }
    }

    private handleStepUpCancel(correlationId: CorrelationId): void {
        const store = getStateStore();
        store.dispatch({ type: 'STEP_UP_CLEAR', correlationId });
    }

    private handleLogout(correlationId: CorrelationId): void {
        const store = getStateStore();
        const eventBus = getEventBus();

        store.reset();

        eventBus.emit({
            type: 'SECURITY_CONTEXT_CHANGED',
            security: {
                authenticated: false,
                userId: null,
                role: 'guest',
                stepUpActive: false,
                stepUpExpiry: null,
                policies: [],
            },
            correlationId,
            timestamp: Date.now(),
        });
    }

    private handleLockScreen(correlationId: CorrelationId): void {
        const store = getStateStore();
        const eventBus = getEventBus();

        store.dispatch({ type: 'COGNITIVE_MODE_SET', mode: 'locked', correlationId });

        eventBus.emit({
            type: 'SCREEN_LOCKED',
            correlationId,
            timestamp: Date.now(),
        });
    }

    private handleUnlockScreen(correlationId: CorrelationId): void {
        const store = getStateStore();
        const eventBus = getEventBus();

        store.dispatch({ type: 'COGNITIVE_MODE_SET', mode: 'calm', correlationId });

        eventBus.emit({
            type: 'SCREEN_UNLOCKED',
            correlationId,
            timestamp: Date.now(),
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // COGNITIVE MODE UPDATES
    // ═══════════════════════════════════════════════════════════════════════

    private updateCognitiveMode(correlationId: CorrelationId): void {
        const store = getStateStore();
        const eventBus = getEventBus();
        const state = store.getState();

        // Don't change if locked
        if (state.cognitiveMode === 'locked') return;

        // Count active windows
        const activeWindows = Object.values(state.windows)
            .filter(w => w.state === 'active');

        let mode: CognitiveMode;
        if (activeWindows.length === 0) {
            mode = 'calm';
        } else if (activeWindows.length === 1) {
            mode = 'focused';
        } else {
            mode = 'multitask';
        }

        if (mode !== state.cognitiveMode) {
            store.dispatch({ type: 'COGNITIVE_MODE_SET', mode, correlationId });
            eventBus.emit({
                type: 'COGNITIVE_MODE_CHANGED',
                mode,
                correlationId,
                timestamp: Date.now(),
            });
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON
// ═══════════════════════════════════════════════════════════════════════════

let instance: CoreOSKernel | null = null;

export function getKernel(): CoreOSKernel {
    if (!instance) {
        instance = new CoreOSKernel();
    }
    return instance;
}

export function resetKernel(): void {
    instance = null;
}
