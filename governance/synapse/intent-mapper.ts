/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Intent Mapper — UI Actions → SYNAPSE Intents
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Maps product-layer actions to SYNAPSE intents.
 * This layer exists to:
 * 1. Decouple UI from kernel internals
 * 2. Provide semantic translation
 * 3. Enable future intent versioning
 * 
 * @module governance/synapse
 * @version 1.0.0
 */

import { IntentFactory, type CapabilityId, type SpaceId } from '../../coreos/types';

// ═══════════════════════════════════════════════════════════════════════════
// UI ACTION TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type UIAction =
    | { type: 'CLICK_APP_ICON'; capabilityId: CapabilityId }
    | { type: 'CLICK_DOCK_ITEM'; capabilityId: CapabilityId; isRunning: boolean }
    | { type: 'CLICK_WINDOW_CLOSE'; windowId: string }
    | { type: 'CLICK_WINDOW_MINIMIZE'; windowId: string }
    | { type: 'CLICK_WINDOW'; windowId: string }
    | { type: 'PRESS_CMD_TAB' }
    | { type: 'PRESS_CMD_SHIFT_TAB' }
    | { type: 'PRESS_CMD_NUMBER'; number: number }
    | { type: 'PRESS_CMD_H' }
    | { type: 'PRESS_CMD_W' }
    | { type: 'PRESS_ESCAPE' }
    | { type: 'PRESS_CMD_M' }
    | { type: 'SELECT_SPACE'; spaceId: SpaceId };

// ═══════════════════════════════════════════════════════════════════════════
// MAPPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Map a UI action to a SYNAPSE intent
 */
export function mapActionToIntent(action: UIAction) {
    switch (action.type) {
        case 'CLICK_APP_ICON':
            return IntentFactory.openCapability(action.capabilityId);

        case 'CLICK_DOCK_ITEM':
            // Running → focus, not running → open
            return action.isRunning
                ? IntentFactory.openCapability(action.capabilityId)  // Will focus existing
                : IntentFactory.openCapability(action.capabilityId);

        case 'CLICK_WINDOW_CLOSE':
            return IntentFactory.closeWindow(action.windowId);

        case 'CLICK_WINDOW_MINIMIZE':
            return IntentFactory.minimizeWindow(action.windowId);

        case 'CLICK_WINDOW':
            return IntentFactory.focusWindow(action.windowId);

        case 'PRESS_CMD_TAB':
            return IntentFactory.focusNextWindow();

        case 'PRESS_CMD_SHIFT_TAB':
            return IntentFactory.focusPreviousWindow();

        case 'PRESS_CMD_NUMBER':
            return IntentFactory.focusWindowByIndex(action.number - 1);

        case 'PRESS_CMD_H':
            return IntentFactory.minimizeFocusedWindow();

        case 'PRESS_CMD_W':
            return IntentFactory.closeFocusedWindow();

        case 'PRESS_ESCAPE':
            return IntentFactory.escapeToCalm();

        case 'PRESS_CMD_M':
            return IntentFactory.minimizeFocusedWindow();

        case 'SELECT_SPACE':
            return IntentFactory.switchSpace(action.spaceId);

        default:
            throw new Error(`Unknown UI action: ${(action as UIAction).type}`);
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// DECISION TRANSLATION
// ═══════════════════════════════════════════════════════════════════════════

export type OSBehavior =
    | { type: 'SHOW_WINDOW'; windowId: string }
    | { type: 'SHOW_ERROR'; message: string }
    | { type: 'SHOW_STEP_UP_DIALOG'; challenge: string }
    | { type: 'FOCUS_WINDOW'; windowId: string }
    | { type: 'UPDATE_COGNITIVE_MODE'; mode: string }
    | { type: 'NOOP' };

/**
 * Translate a SYNAPSE decision into OS behavior
 * (This is called by event listeners, not directly)
 */
export function mapDecisionToBehavior(
    eventType: string,
    payload: Record<string, unknown>
): OSBehavior {
    switch (eventType) {
        case 'WINDOW_OPENED':
            return { type: 'SHOW_WINDOW', windowId: payload.windowId as string };

        case 'POLICY_DENIED':
            return { type: 'SHOW_ERROR', message: payload.reason as string };

        case 'STEP_UP_REQUIRED':
            return { type: 'SHOW_STEP_UP_DIALOG', challenge: payload.challenge as string };

        case 'WINDOW_FOCUSED':
            return { type: 'FOCUS_WINDOW', windowId: payload.windowId as string };

        case 'COGNITIVE_MODE_CHANGED':
            return { type: 'UPDATE_COGNITIVE_MODE', mode: payload.mode as string };

        default:
            return { type: 'NOOP' };
    }
}
