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

import type { SystemState } from './types';
import { getStateStore } from './state';
import {
    deriveCognitiveMode,
    explainCognitiveMode,
    getActiveWindowIds,
    getMinimizedWindowIds,
    getFocusedWindowId,
} from './cognitive-deriver';

/**
 * Calm state validation result
 */
export interface CalmStateResult {
    readonly isCalm: boolean;
    readonly reasons: readonly string[];
    readonly derivedMode: 'calm' | 'focused' | 'multitask' | 'alert' | 'locked';
}

/**
 * Check if system state is truly calm
 * 
 * Phase J Rules (Derived):
 * - Derived cognitiveMode === 'calm'
 * - No pending step-up challenge
 * 
 * Note: focusedWindowId and active windows are now checked via deriveCognitiveMode()
 */
export function isCalmState(state: SystemState): CalmStateResult {
    const reasons: string[] = [];

    // Phase J: Derive cognitive mode from window states
    const derivedMode = deriveCognitiveMode(state);

    // Rule 1: Derived mode must be calm
    if (derivedMode !== 'calm') {
        const explanation = explainCognitiveMode(state);
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
export function getCurrentCalmState(): CalmStateResult {
    return isCalmState(getStateStore().getState());
}

/**
 * Assert system is calm (throws if not)
 */
export function assertCalmState(): void {
    const result = getCurrentCalmState();
    if (!result.isCalm) {
        throw new Error(`System is not calm: ${result.reasons.join(', ')}`);
    }
}

/**
 * Get calm state summary for debugging
 */
export function getCalmStateSummary(): string {
    const state = getStateStore().getState();
    const result = isCalmState(state);
    const explanation = explainCognitiveMode(state);

    const lines = [
        '=== CALM STATE SUMMARY (Phase J) ===',
        `Is Calm: ${result.isCalm ? '✅ YES' : '❌ NO'}`,
        `Derived Cognitive Mode: ${result.derivedMode}`,
        `Explanation: ${explanation.reason}`,
        `Focused Window: ${getFocusedWindowId(state) || '(none)'}`,
        `Active Windows: ${getActiveWindowIds(state).length}`,
        `Minimized Windows: ${getMinimizedWindowIds(state).length}`,
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

// Phase 40C.1 guard verification Thu Feb 19 21:42:04 +07 2026
// Phase 40C.1 round 2 Thu Feb 19 22:14:11 +07 2026
