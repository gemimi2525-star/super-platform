"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoreOSKernel = void 0;
exports.getKernel = getKernel;
exports.resetKernel = resetKernel;
const index_js_1 = require("../types/index.js");
const state_js_1 = require("./state.js");
const event_bus_js_1 = require("./event-bus.js");
const capability_graph_js_1 = require("./capability-graph.js");
const index_js_2 = require("../policy-engine/index.js");
const window_manager_js_1 = require("./window-manager.js");
// Step-up duration: 15 minutes
const STEP_UP_DURATION_MS = 15 * 60 * 1000;
/**
 * Core OS Kernel - The heart of the system
 */
class CoreOSKernel {
    /**
     * Bootstrap the kernel with user credentials
     */
    bootstrap(userId, role, policies) {
        const store = (0, state_js_1.getStateStore)();
        const eventBus = (0, event_bus_js_1.getEventBus)();
        const correlationId = (0, index_js_1.createCorrelationId)();
        const security = {
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
    emit(intent) {
        const { type, correlationId } = intent;
        switch (type) {
            case 'OPEN_CAPABILITY':
                this.handleOpenCapability(intent.payload.capabilityId, correlationId, intent.payload.contextId);
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
                this.handleMoveWindowToSpace(intent.payload.windowId, intent.payload.spaceId, correlationId);
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
    handleOpenCapability(capabilityId, correlationId, contextId) {
        const store = (0, state_js_1.getStateStore)();
        const eventBus = (0, event_bus_js_1.getEventBus)();
        const policyEngine = (0, index_js_2.getPolicyEngine)();
        const windowManager = (0, window_manager_js_1.getWindowManager)();
        const graph = (0, capability_graph_js_1.getCapabilityGraph)();
        const state = store.getState();
        // Build policy context
        const policyContext = {
            capabilityId,
            security: state.security,
            targetContextId: contextId ?? null,
        };
        // Evaluate policy
        const decision = policyEngine.evaluate(policyContext, state.cognitiveMode);
        switch (decision.type) {
            case 'allow': {
                // Phase O: Space Policy Gate for opening capability
                const targetSpaceId = state.activeSpaceId;
                const spaceDecision = policyEngine.evaluateOpenCapabilityInSpace({
                    capabilityId,
                    spaceId: targetSpaceId,
                    security: state.security,
                });
                if (spaceDecision.type === 'deny') {
                    // Emit deny event with space + capability info (no state change)
                    eventBus.emit({
                        type: 'SPACE_ACCESS_DENIED',
                        correlationId,
                        timestamp: Date.now(),
                        payload: {
                            spaceId: targetSpaceId,
                            reason: spaceDecision.reason,
                            capabilityId,
                            intentType: 'OPEN_CAPABILITY',
                        },
                    });
                    return; // No state change — preserve cognitive mode
                }
                // Activate capability
                store.dispatch({ type: 'CAPABILITY_ACTIVATE', capabilityId, correlationId });
                eventBus.emit({
                    type: 'CAPABILITY_ACTIVATED',
                    capabilityId,
                    correlationId,
                    timestamp: Date.now(),
                });
                // Open window if capability has UI (pass targetSpaceId for Phase O)
                if (graph.hasUI(capabilityId)) {
                    windowManager.openWindow(capabilityId, correlationId, contextId, targetSpaceId);
                }
                // Update context stack
                store.dispatch({ type: 'CONTEXT_PUSH', capabilityId, correlationId });
                // Update cognitive mode
                this.updateCognitiveMode(correlationId);
                break;
            }
            case 'require_stepup': {
                // Store pending step-up
                store.dispatch({
                    type: 'STEP_UP_PENDING',
                    pending: {
                        capabilityId,
                        challenge: decision.challenge,
                        correlationId,
                    },
                });
                eventBus.emit({
                    type: 'STEP_UP_REQUIRED',
                    capabilityId,
                    challenge: decision.challenge,
                    correlationId,
                    timestamp: Date.now(),
                });
                break;
            }
            case 'deny': {
                // Phase R: Emit decision explanation
                const denyExplanation = policyEngine.explainCapabilityDecision({
                    decision,
                    intentType: 'OPEN_CAPABILITY',
                    correlationId,
                    capabilityId,
                    spaceId: state.activeSpaceId,
                });
                eventBus.emit({
                    type: 'DECISION_EXPLAINED',
                    correlationId,
                    timestamp: Date.now(),
                    payload: denyExplanation,
                });
                eventBus.emit({
                    type: 'POLICY_DENIED',
                    capabilityId,
                    reason: decision.reason,
                    correlationId,
                    timestamp: Date.now(),
                });
                break;
            }
            case 'degrade': {
                // Retry with fallback capability
                this.handleOpenCapability(decision.fallback, correlationId, contextId);
                break;
            }
        }
    }
    handleCloseWindow(windowId, correlationId) {
        const windowManager = (0, window_manager_js_1.getWindowManager)();
        windowManager.closeWindow(windowId, correlationId);
        this.updateCognitiveMode(correlationId);
    }
    handleFocusWindow(windowId, correlationId) {
        const windowManager = (0, window_manager_js_1.getWindowManager)();
        windowManager.focusWindow(windowId, correlationId);
        this.updateCognitiveMode(correlationId);
    }
    handleMinimizeWindow(windowId, correlationId) {
        const windowManager = (0, window_manager_js_1.getWindowManager)();
        windowManager.minimizeWindow(windowId, correlationId);
        this.updateCognitiveMode(correlationId);
    }
    handleRestoreWindow(windowId, correlationId) {
        const windowManager = (0, window_manager_js_1.getWindowManager)();
        windowManager.restoreWindow(windowId, correlationId);
        this.updateCognitiveMode(correlationId);
    }
    handleMinimizeAll(correlationId) {
        const store = (0, state_js_1.getStateStore)();
        const windowManager = (0, window_manager_js_1.getWindowManager)();
        windowManager.minimizeAll(correlationId);
        store.dispatch({ type: 'COGNITIVE_MODE_SET', mode: 'calm', correlationId });
    }
    // ═══════════════════════════════════════════════════════════════════════
    // PHASE K: KEYBOARD SHORTCUT HANDLERS
    // Phase N: Now with policy gate for focus operations
    // ═══════════════════════════════════════════════════════════════════════
    handleFocusNextWindow(correlationId) {
        const store = (0, state_js_1.getStateStore)();
        const state = store.getState();
        const policyEngine = (0, index_js_2.getPolicyEngine)();
        const eventBus = (0, event_bus_js_1.getEventBus)();
        const windowManager = (0, window_manager_js_1.getWindowManager)();
        // Phase N: Policy gate for focus in active space
        const policyDecision = policyEngine.evaluateSpaceAccess({
            spaceId: state.activeSpaceId,
            action: 'focusWindow',
            security: state.security,
        });
        if (policyDecision.type === 'deny') {
            eventBus.emit({
                type: 'SPACE_ACCESS_DENIED',
                correlationId,
                timestamp: Date.now(),
                payload: { spaceId: state.activeSpaceId, reason: policyDecision.reason },
            });
            return;
        }
        const nextWindowId = windowManager.getNextFocusableWindowId();
        if (nextWindowId) {
            windowManager.focusWindow(nextWindowId, correlationId);
            this.updateCognitiveMode(correlationId);
        }
    }
    handleFocusPreviousWindow(correlationId) {
        const store = (0, state_js_1.getStateStore)();
        const state = store.getState();
        const policyEngine = (0, index_js_2.getPolicyEngine)();
        const eventBus = (0, event_bus_js_1.getEventBus)();
        const windowManager = (0, window_manager_js_1.getWindowManager)();
        // Phase N: Policy gate for focus in active space
        const policyDecision = policyEngine.evaluateSpaceAccess({
            spaceId: state.activeSpaceId,
            action: 'focusWindow',
            security: state.security,
        });
        if (policyDecision.type === 'deny') {
            eventBus.emit({
                type: 'SPACE_ACCESS_DENIED',
                correlationId,
                timestamp: Date.now(),
                payload: { spaceId: state.activeSpaceId, reason: policyDecision.reason },
            });
            return;
        }
        const prevWindowId = windowManager.getPreviousFocusableWindowId();
        if (prevWindowId) {
            windowManager.focusWindow(prevWindowId, correlationId);
            this.updateCognitiveMode(correlationId);
        }
    }
    handleFocusWindowByIndex(index, correlationId) {
        const store = (0, state_js_1.getStateStore)();
        const state = store.getState();
        const policyEngine = (0, index_js_2.getPolicyEngine)();
        const eventBus = (0, event_bus_js_1.getEventBus)();
        const windowManager = (0, window_manager_js_1.getWindowManager)();
        // Phase N: Policy gate for focus in active space
        const policyDecision = policyEngine.evaluateSpaceAccess({
            spaceId: state.activeSpaceId,
            action: 'focusWindow',
            security: state.security,
        });
        if (policyDecision.type === 'deny') {
            eventBus.emit({
                type: 'SPACE_ACCESS_DENIED',
                correlationId,
                timestamp: Date.now(),
                payload: { spaceId: state.activeSpaceId, reason: policyDecision.reason },
            });
            return;
        }
        const windowId = windowManager.getFocusableWindowIdByIndex(index);
        if (windowId) {
            windowManager.focusWindow(windowId, correlationId);
            this.updateCognitiveMode(correlationId);
        }
    }
    handleMinimizeFocusedWindow(correlationId) {
        const windowManager = (0, window_manager_js_1.getWindowManager)();
        windowManager.minimizeFocusedWindow(correlationId);
        this.updateCognitiveMode(correlationId);
    }
    handleRestoreLastMinimizedWindow(correlationId) {
        const windowManager = (0, window_manager_js_1.getWindowManager)();
        windowManager.restoreLastMinimizedWindow(correlationId);
        this.updateCognitiveMode(correlationId);
    }
    handleCloseFocusedWindow(correlationId) {
        const windowManager = (0, window_manager_js_1.getWindowManager)();
        windowManager.closeFocusedWindow(correlationId);
        this.updateCognitiveMode(correlationId);
    }
    handleEscapeToCalm(correlationId) {
        const store = (0, state_js_1.getStateStore)();
        const windowManager = (0, window_manager_js_1.getWindowManager)();
        // Phase N: escapeToCalm now only affects active space
        windowManager.escapeToCalm(correlationId);
        store.dispatch({ type: 'COGNITIVE_MODE_SET', mode: 'calm', correlationId });
    }
    // ═══════════════════════════════════════════════════════════════════════
    // PHASE L: VIRTUAL SPACES / CONTEXTS
    // ═══════════════════════════════════════════════════════════════════════
    handleSwitchSpace(spaceId, correlationId) {
        const store = (0, state_js_1.getStateStore)();
        const state = store.getState();
        const policyEngine = (0, index_js_2.getPolicyEngine)();
        const eventBus = (0, event_bus_js_1.getEventBus)();
        // Phase M: Policy Gate for SWITCH_SPACE
        const policyDecision = policyEngine.evaluateSpaceAccess({
            spaceId,
            action: 'access',
            security: state.security,
        });
        if (policyDecision.type === 'deny') {
            // Phase R: Emit decision explanation
            const explanation = policyEngine.explainSpaceAccessDecision({
                decision: policyDecision,
                intentType: 'SWITCH_SPACE',
                correlationId,
                spaceId,
                action: 'access',
            });
            eventBus.emit({
                type: 'DECISION_EXPLAINED',
                correlationId,
                timestamp: Date.now(),
                payload: explanation,
            });
            // Emit deny event with reason (no state change)
            eventBus.emit({
                type: 'SPACE_ACCESS_DENIED',
                correlationId,
                timestamp: Date.now(),
                payload: { spaceId, reason: policyDecision.reason },
            });
            return;
        }
        const windowManager = (0, window_manager_js_1.getWindowManager)();
        windowManager.switchSpace(spaceId, correlationId);
        // Recalculate cognitive mode for new space context
        this.updateCognitiveMode(correlationId);
    }
    handleMoveWindowToSpace(windowId, spaceId, correlationId) {
        const store = (0, state_js_1.getStateStore)();
        const state = store.getState();
        const policyEngine = (0, index_js_2.getPolicyEngine)();
        const eventBus = (0, event_bus_js_1.getEventBus)();
        // Phase M: Policy Gate for MOVE_WINDOW_TO_SPACE
        const policyDecision = policyEngine.evaluateSpaceAccess({
            spaceId,
            action: 'moveWindow',
            security: state.security,
            windowId,
        });
        if (policyDecision.type === 'deny') {
            // Emit deny event with reason (no state change)
            eventBus.emit({
                type: 'SPACE_ACCESS_DENIED',
                correlationId,
                timestamp: Date.now(),
                payload: { spaceId, windowId, reason: policyDecision.reason },
            });
            return;
        }
        const windowManager = (0, window_manager_js_1.getWindowManager)();
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
    handleRestoreActiveSpace(correlationId) {
        const store = (0, state_js_1.getStateStore)();
        const eventBus = (0, event_bus_js_1.getEventBus)();
        const policyEngine = (0, index_js_2.getPolicyEngine)();
        const windowManager = (0, window_manager_js_1.getWindowManager)();
        const state = store.getState();
        // Policy Gate: Check if openWindow + focusWindow are allowed in active space
        const openDecision = policyEngine.evaluateSpaceAccess({
            spaceId: state.activeSpaceId,
            action: 'openWindow',
            security: state.security,
        });
        if (openDecision.type === 'deny') {
            // Phase R: Emit decision explanation
            const explanation = policyEngine.explainSpaceAccessDecision({
                decision: openDecision,
                intentType: 'RESTORE_ACTIVE_SPACE',
                correlationId,
                spaceId: state.activeSpaceId,
                action: 'openWindow',
            });
            eventBus.emit({
                type: 'DECISION_EXPLAINED',
                correlationId,
                timestamp: Date.now(),
                payload: explanation,
            });
            eventBus.emit({
                type: 'SPACE_ACCESS_DENIED',
                correlationId,
                timestamp: Date.now(),
                payload: {
                    spaceId: state.activeSpaceId,
                    reason: openDecision.reason,
                    intentType: 'RESTORE_ACTIVE_SPACE',
                },
            });
            return; // No state change
        }
        const focusDecision = policyEngine.evaluateSpaceAccess({
            spaceId: state.activeSpaceId,
            action: 'focusWindow',
            security: state.security,
        });
        if (focusDecision.type === 'deny') {
            // Phase R: Emit decision explanation for focus deny
            const focusExplanation = policyEngine.explainSpaceAccessDecision({
                decision: focusDecision,
                intentType: 'RESTORE_ACTIVE_SPACE',
                correlationId,
                spaceId: state.activeSpaceId,
                action: 'focusWindow',
            });
            eventBus.emit({
                type: 'DECISION_EXPLAINED',
                correlationId,
                timestamp: Date.now(),
                payload: focusExplanation,
            });
            eventBus.emit({
                type: 'SPACE_ACCESS_DENIED',
                correlationId,
                timestamp: Date.now(),
                payload: {
                    spaceId: state.activeSpaceId,
                    reason: focusDecision.reason,
                    intentType: 'RESTORE_ACTIVE_SPACE',
                },
            });
            return; // No state change
        }
        // Restore all in active space
        const restoredCount = windowManager.restoreAllInActiveSpace(correlationId);
        // Emit event
        eventBus.emit({
            type: 'SPACE_RESTORED',
            correlationId,
            timestamp: Date.now(),
            payload: { spaceId: state.activeSpaceId, windowsRestored: restoredCount },
        }); // Cast since SPACE_RESTORED is new
        // Recalculate cognitive mode
        this.updateCognitiveMode(correlationId);
    }
    /**
     * Phase Q: Handle RESTORE_WINDOW_BY_ID
     * Restores a specific minimized window (must be in active space)
     */
    handleRestoreWindowById(windowId, correlationId) {
        const store = (0, state_js_1.getStateStore)();
        const eventBus = (0, event_bus_js_1.getEventBus)();
        const policyEngine = (0, index_js_2.getPolicyEngine)();
        const windowManager = (0, window_manager_js_1.getWindowManager)();
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
        // Policy Gate: Check openWindow + focusWindow permissions
        const openDecision = policyEngine.evaluateSpaceAccess({
            spaceId: state.activeSpaceId,
            action: 'openWindow',
            security: state.security,
        });
        if (openDecision.type === 'deny') {
            eventBus.emit({
                type: 'SPACE_ACCESS_DENIED',
                correlationId,
                timestamp: Date.now(),
                payload: {
                    spaceId: state.activeSpaceId,
                    reason: openDecision.reason,
                    windowId,
                    intentType: 'RESTORE_WINDOW_BY_ID',
                },
            });
            return;
        }
        const focusDecision = policyEngine.evaluateSpaceAccess({
            spaceId: state.activeSpaceId,
            action: 'focusWindow',
            security: state.security,
        });
        if (focusDecision.type === 'deny') {
            eventBus.emit({
                type: 'SPACE_ACCESS_DENIED',
                correlationId,
                timestamp: Date.now(),
                payload: {
                    spaceId: state.activeSpaceId,
                    reason: focusDecision.reason,
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
    handleStepUpComplete(success, correlationId) {
        const store = (0, state_js_1.getStateStore)();
        const eventBus = (0, event_bus_js_1.getEventBus)();
        const state = store.getState();
        if (!state.pendingStepUp)
            return;
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
        }
        else {
            store.dispatch({ type: 'STEP_UP_CLEAR', correlationId });
        }
    }
    handleStepUpCancel(correlationId) {
        const store = (0, state_js_1.getStateStore)();
        store.dispatch({ type: 'STEP_UP_CLEAR', correlationId });
    }
    handleLogout(correlationId) {
        const store = (0, state_js_1.getStateStore)();
        const eventBus = (0, event_bus_js_1.getEventBus)();
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
    handleLockScreen(correlationId) {
        const store = (0, state_js_1.getStateStore)();
        const eventBus = (0, event_bus_js_1.getEventBus)();
        store.dispatch({ type: 'COGNITIVE_MODE_SET', mode: 'locked', correlationId });
        eventBus.emit({
            type: 'SCREEN_LOCKED',
            correlationId,
            timestamp: Date.now(),
        });
    }
    handleUnlockScreen(correlationId) {
        const store = (0, state_js_1.getStateStore)();
        const eventBus = (0, event_bus_js_1.getEventBus)();
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
    updateCognitiveMode(correlationId) {
        const store = (0, state_js_1.getStateStore)();
        const eventBus = (0, event_bus_js_1.getEventBus)();
        const state = store.getState();
        // Don't change if locked
        if (state.cognitiveMode === 'locked')
            return;
        // Count active windows
        const activeWindows = Object.values(state.windows)
            .filter(w => w.state === 'active');
        let mode;
        if (activeWindows.length === 0) {
            mode = 'calm';
        }
        else if (activeWindows.length === 1) {
            mode = 'focused';
        }
        else {
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
exports.CoreOSKernel = CoreOSKernel;
// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON
// ═══════════════════════════════════════════════════════════════════════════
let instance = null;
function getKernel() {
    if (!instance) {
        instance = new CoreOSKernel();
    }
    return instance;
}
function resetKernel() {
    instance = null;
}
//# sourceMappingURL=index.js.map