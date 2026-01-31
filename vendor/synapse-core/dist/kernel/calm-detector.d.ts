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
import type { SystemState } from '../types/index.js';
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
export declare function isCalmState(state: SystemState): CalmStateResult;
/**
 * Get current calm state
 */
export declare function getCurrentCalmState(): CalmStateResult;
/**
 * Assert system is calm (throws if not)
 */
export declare function assertCalmState(): void;
/**
 * Get calm state summary for debugging
 */
export declare function getCalmStateSummary(): string;
//# sourceMappingURL=calm-detector.d.ts.map