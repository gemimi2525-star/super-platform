/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CORE OS KERNEL — Main Export (HARDENED + Phase J)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * @module coreos
 * @version 3.0.0 (Hardened + Phase J)
 */

// ═══════════════════════════════════════════════════════════════════════════
// TYPE EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export type {
    // Core Primitives
    CorrelationId,

    // Capability System
    CapabilityId,
    CapabilityManifest,
    WindowMode,
    ContextType,

    // Window System
    WindowState,
    Window,

    // Phase L: Virtual Spaces
    SpaceId,

    // Policy System
    PolicyDecision,
    PolicyContext,

    // Phase M: Space Policies
    SpacePermissions,
    SpacePolicy,
    SpaceAccessDecision,
    SpaceAction,
    SpacePolicyContext,

    // Security
    SecurityContext,
    UserRole,

    // Cognitive
    CognitiveMode,

    // Process
    Process,
    ProcessStatus,

    // Intent & Event
    Intent,
    IntentType,
    SystemEvent,
    SystemEventType,
    EventListener,
    PendingStepUp,

    // State
    SystemState,
} from './types';

export { createCorrelationId, IntentFactory, DEFAULT_SPACE_ID, DEFAULT_SPACE_PERMISSIONS, roleHasAccess } from './types';

// ═══════════════════════════════════════════════════════════════════════════
// KERNEL CORE
// ═══════════════════════════════════════════════════════════════════════════

export { CoreOSKernel, getKernel, resetKernel } from './kernel';

// ═══════════════════════════════════════════════════════════════════════════
// STATE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

export {
    CoreOSStateStore,
    getStateStore,
    resetStateStore,
    systemReducer,
    INITIAL_STATE,
    INITIAL_SECURITY_CONTEXT,
    type StateAction,
} from './state';

// ═══════════════════════════════════════════════════════════════════════════
// EVENT BUS
// ═══════════════════════════════════════════════════════════════════════════

export { CoreOSEventBus, getEventBus, resetEventBus } from './event-bus';

// ═══════════════════════════════════════════════════════════════════════════
// CAPABILITY GRAPH
// ═══════════════════════════════════════════════════════════════════════════

export { CoreOSCapabilityGraph, getCapabilityGraph, resetCapabilityGraph } from './capability-graph';

// ═══════════════════════════════════════════════════════════════════════════
// POLICY ENGINE
// ═══════════════════════════════════════════════════════════════════════════



// ═══════════════════════════════════════════════════════════════════════════
// WINDOW MANAGER
// ═══════════════════════════════════════════════════════════════════════════

export { CoreOSWindowManager, getWindowManager, resetWindowManager } from './window-manager';

// ═══════════════════════════════════════════════════════════════════════════
// CALM STATE DETECTOR
// ═══════════════════════════════════════════════════════════════════════════

export {
    isCalmState,
    getCurrentCalmState,
    assertCalmState,
    getCalmStateSummary,
    type CalmStateResult,
} from './calm-detector';

// ═══════════════════════════════════════════════════════════════════════════
// HYDRATION SAFETY (Phase 9.2)
// ═══════════════════════════════════════════════════════════════════════════

export { useMounted } from './useMounted';

// ═══════════════════════════════════════════════════════════════════════════
// COGNITIVE STATE DERIVATION (Phase J)
// ═══════════════════════════════════════════════════════════════════════════

export {
    deriveCognitiveMode,
    explainCognitiveMode,
    getActiveWindowIds,
    getMinimizedWindowIds,
    getFocusedWindowId,
    isSystemCalm,
    isSystemFocused,
    isSystemMultitask,
    type WindowLifecycleState,
} from './cognitive-deriver';

// ═══════════════════════════════════════════════════════════════════════════
// RESET ALL (For testing)
// ═══════════════════════════════════════════════════════════════════════════

import { resetKernel } from './kernel';
import { resetStateStore } from './state';
import { resetEventBus } from './event-bus';
import { resetCapabilityGraph } from './capability-graph';

import { resetWindowManager } from './window-manager';

/**
 * Reset all kernel components (for testing only)
 */
export function resetAll(): void {
    resetKernel();
    resetStateStore();
    resetEventBus();
    resetCapabilityGraph();

    resetWindowManager();
}
