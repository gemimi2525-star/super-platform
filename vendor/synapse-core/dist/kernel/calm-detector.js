"use strict";
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CORE OS KERNEL — Calm State Detector (Phase J Refactored)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Phase J: Now uses DERIVED cognitive mode from window states only.
 * No more manual cognitiveMode checking — it's computed.
 *
 * @module coreos/calm-detector
 * @version 3.0.0 (Phase J)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isCalmState = isCalmState;
exports.getCurrentCalmState = getCurrentCalmState;
exports.assertCalmState = assertCalmState;
exports.getCalmStateSummary = getCalmStateSummary;
const state_1 = require("./state");
const cognitive_deriver_1 = require("./cognitive-deriver");
/**
 * Check if system state is truly calm
 *
 * Phase J Rules (Derived):
 * - Derived cognitiveMode === 'calm'
 * - No pending step-up challenge
 *
 * Note: focusedWindowId and active windows are now checked via deriveCognitiveMode()
 */
function isCalmState(state) {
    const reasons = [];
    // Phase J: Derive cognitive mode from window states
    const derivedMode = (0, cognitive_deriver_1.deriveCognitiveMode)(state);
    // Rule 1: Derived mode must be calm
    if (derivedMode !== 'calm') {
        const explanation = (0, cognitive_deriver_1.explainCognitiveMode)(state);
        reasons.push(`Cognitive mode is '${derivedMode}': ${explanation.reason}`);
    }
    // Rule 2: No pending step-up
    if (state.pendingStepUp !== null) {
        reasons.push('Has pending step-up challenge');
    }
    return {
        isCalm: reasons.length === 0,
        reasons,
        derivedMode,
    };
}
/**
 * Get current calm state
 */
function getCurrentCalmState() {
    return isCalmState((0, state_1.getStateStore)().getState());
}
/**
 * Assert system is calm (throws if not)
 */
function assertCalmState() {
    const result = getCurrentCalmState();
    if (!result.isCalm) {
        throw new Error(`System is not calm: ${result.reasons.join(', ')}`);
    }
}
/**
 * Get calm state summary for debugging
 */
function getCalmStateSummary() {
    const state = (0, state_1.getStateStore)().getState();
    const result = isCalmState(state);
    const explanation = (0, cognitive_deriver_1.explainCognitiveMode)(state);
    const lines = [
        '=== CALM STATE SUMMARY (Phase J) ===',
        `Is Calm: ${result.isCalm ? '✅ YES' : '❌ NO'}`,
        `Derived Cognitive Mode: ${result.derivedMode}`,
        `Explanation: ${explanation.reason}`,
        `Focused Window: ${(0, cognitive_deriver_1.getFocusedWindowId)(state) || '(none)'}`,
        `Active Windows: ${(0, cognitive_deriver_1.getActiveWindowIds)(state).length}`,
        `Minimized Windows: ${(0, cognitive_deriver_1.getMinimizedWindowIds)(state).length}`,
        `Pending Step-up: ${state.pendingStepUp ? state.pendingStepUp.capabilityId : '(none)'}`,
    ];
    if (!result.isCalm) {
        lines.push('');
        lines.push('Reasons NOT calm:');
        for (const reason of result.reasons) {
            lines.push(`  - ${reason}`);
        }
    }
    return lines.join('\n');
}
//# sourceMappingURL=calm-detector.js.map