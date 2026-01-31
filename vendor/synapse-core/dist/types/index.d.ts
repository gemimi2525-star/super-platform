/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CORE OS KERNEL — Type Definitions (HARDENED)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * STRICT TYPED CONTRACTS
 * - No `any` types
 * - All payloads strictly typed
 * - Events carry correlationId (intent tracing)
 *
 * @module coreos/types
 * @version 2.0.0 (Hardened)
 */
/**
 * Unique identifier for intent-event correlation
 */
export type CorrelationId = string & {
    readonly __brand: 'CorrelationId';
};
/**
 * Generate a new correlation ID
 */
export declare function createCorrelationId(): CorrelationId;
/**
 * Capability identifier - strictly typed union
 * CORE: 6 capabilities (system-built)
 * EXPERIMENTAL: 1 capability (Phase F)
 */
export type CapabilityId = 'core.finder' | 'core.settings' | 'user.manage' | 'org.manage' | 'audit.view' | 'system.configure' | 'plugin.analytics';
/**
 * Window mode - defines window BEHAVIOR (how many windows allowed)
 * @see /docs/contracts/WINDOW_IDENTITY_CONTRACT_v1.md
 *
 * Phase H: Reconciled with Window Semantics Contract
 * - windowMode = behavior (single/multi/multiByContext/backgroundOnly)
 * - windowDisplay = visual surface type (window/modal)
 */
export type WindowMode = 'single' | 'multi' | 'multiByContext' | 'backgroundOnly';
/**
 * Window display - defines visual SURFACE TYPE
 * @see /docs/contracts/WINDOW_SEMANTICS_CONTRACT_v1.md
 *
 * Phase H: Added to separate behavior from visual presentation
 */
export type WindowDisplay = 'window' | 'modal';
/**
 * Supported contexts for capability
 */
export type ContextType = 'global' | 'organization' | 'user' | 'document';
/**
 * Certification tier for capabilities
 * @see /docs/governance/CAPABILITY_CERTIFICATION_MODEL_v1.md
 */
export type CertificationTier = 'core' | 'certified' | 'experimental';
/**
 * Capability Manifest - Defines capability behavior declaratively
 * @see /docs/specs/CAPABILITY_MANIFEST_v1.md
 *
 * Phase H: Added windowDisplay for visual surface type separation
 */
export interface CapabilityManifest {
    readonly id: CapabilityId;
    readonly title: string;
    readonly icon: string;
    readonly hasUI: boolean;
    readonly windowMode: WindowMode;
    readonly windowDisplay?: WindowDisplay;
    readonly requiredPolicies: readonly string[];
    readonly requiresStepUp: boolean;
    readonly stepUpMessage?: string;
    readonly dependencies: readonly CapabilityId[];
    readonly contextsSupported: readonly ContextType[];
    readonly showInDock: boolean;
    readonly certificationTier: CertificationTier;
    readonly certifiedAt?: string;
    readonly certifiedBy?: string;
}
/**
 * Window state - strictly typed enum
 */
export type WindowState = 'active' | 'minimized' | 'hidden';
/**
 * Space ID - virtual context identifier
 * Format: space:{name} e.g. 'space:default', 'space:org-abc'
 */
export type SpaceId = `space:${string}`;
/**
 * Default space ID
 */
export declare const DEFAULT_SPACE_ID: SpaceId;
/**
 * Window instance in the system
 */
export interface Window {
    readonly id: string;
    readonly capabilityId: CapabilityId;
    readonly state: WindowState;
    readonly zIndex: number;
    readonly title: string;
    readonly contextId: string | null;
    readonly spaceId: SpaceId;
    readonly createdAt: number;
}
/**
 * Policy decision output - strictly typed discriminated union
 */
export type PolicyDecision = {
    readonly type: 'allow';
} | {
    readonly type: 'deny';
    readonly reason: string;
} | {
    readonly type: 'require_stepup';
    readonly challenge: string;
} | {
    readonly type: 'degrade';
    readonly fallback: CapabilityId;
};
/**
 * Policy evaluation context - immutable
 */
export interface PolicyContext {
    readonly capabilityId: CapabilityId;
    readonly security: SecurityContext;
    readonly targetContextId: string | null;
}
/**
 * Permissions for a space
 */
export interface SpacePermissions {
    readonly canAccess: boolean;
    readonly canOpenWindow: boolean;
    readonly canFocusWindow: boolean;
    readonly canMoveWindow: boolean;
}
/**
 * Default permissions (allow all)
 */
export declare const DEFAULT_SPACE_PERMISSIONS: SpacePermissions;
/**
 * Space policy configuration
 */
export interface SpacePolicy {
    readonly spaceId: SpaceId;
    readonly permissions: SpacePermissions;
    readonly requiredRole?: UserRole;
    readonly requiredPolicies?: string[];
}
/**
 * Space access decision - result of space policy evaluation
 */
export type SpaceAccessDecision = {
    readonly type: 'allow';
} | {
    readonly type: 'deny';
    readonly reason: string;
    readonly spaceId: SpaceId;
};
/**
 * Phase R: Decision types for audit trail
 */
export type DecisionType = 'ALLOW' | 'DENY' | 'SKIP';
/**
 * Phase R: Policy domain that made the decision
 */
export type PolicyDomain = 'SpacePolicy' | 'CapabilityPolicy' | 'WindowManager' | 'System';
/**
 * Phase R: DecisionExplanation — Canonical audit-ready explanation
 * Every decision must be explainable, traceable, and replayable
 */
export interface DecisionExplanation {
    readonly decision: DecisionType;
    readonly intentType: string;
    readonly correlationId: CorrelationId;
    readonly spaceId?: SpaceId;
    readonly capabilityId?: CapabilityId;
    readonly windowId?: string;
    readonly policyDomain: PolicyDomain;
    readonly failedRule?: string;
    readonly reasonChain: readonly string[];
    readonly timestamp: number;
}
/**
 * Space action types for policy evaluation
 */
export type SpaceAction = 'access' | 'openWindow' | 'focusWindow' | 'moveWindow';
/**
 * Space policy evaluation context
 */
export interface SpacePolicyContext {
    readonly spaceId: SpaceId;
    readonly action: SpaceAction;
    readonly security: SecurityContext;
    readonly windowId?: string;
}
/**
 * User role - strictly typed
 */
export type UserRole = 'guest' | 'user' | 'admin' | 'owner';
/**
 * Current security context - immutable
 */
export interface SecurityContext {
    readonly authenticated: boolean;
    readonly userId: string | null;
    readonly role: UserRole;
    readonly stepUpActive: boolean;
    readonly stepUpExpiry: number | null;
    readonly policies: readonly string[];
}
/**
 * System cognitive mode - strictly typed
 */
export type CognitiveMode = 'calm' | 'focused' | 'multitask' | 'alert' | 'locked';
/**
 * Process status - strictly typed
 */
export type ProcessStatus = 'running' | 'suspended' | 'terminated';
/**
 * System process
 */
export interface Process {
    readonly id: string;
    readonly capabilityId: CapabilityId;
    readonly status: ProcessStatus;
    readonly windowId: string | null;
}
/**
 * Intent types - ALL actions start as intents
 * Each intent MUST carry a correlationId
 */
export type Intent = {
    readonly type: 'OPEN_CAPABILITY';
    readonly correlationId: CorrelationId;
    readonly payload: {
        readonly capabilityId: CapabilityId;
        readonly contextId?: string;
    };
} | {
    readonly type: 'CLOSE_WINDOW';
    readonly correlationId: CorrelationId;
    readonly payload: {
        readonly windowId: string;
    };
} | {
    readonly type: 'FOCUS_WINDOW';
    readonly correlationId: CorrelationId;
    readonly payload: {
        readonly windowId: string;
    };
} | {
    readonly type: 'MINIMIZE_WINDOW';
    readonly correlationId: CorrelationId;
    readonly payload: {
        readonly windowId: string;
    };
} | {
    readonly type: 'RESTORE_WINDOW';
    readonly correlationId: CorrelationId;
    readonly payload: {
        readonly windowId: string;
    };
} | {
    readonly type: 'MINIMIZE_ALL';
    readonly correlationId: CorrelationId;
} | {
    readonly type: 'FOCUS_NEXT_WINDOW';
    readonly correlationId: CorrelationId;
} | {
    readonly type: 'FOCUS_PREVIOUS_WINDOW';
    readonly correlationId: CorrelationId;
} | {
    readonly type: 'FOCUS_WINDOW_BY_INDEX';
    readonly correlationId: CorrelationId;
    readonly payload: {
        readonly index: number;
    };
} | {
    readonly type: 'MINIMIZE_FOCUSED_WINDOW';
    readonly correlationId: CorrelationId;
} | {
    readonly type: 'RESTORE_LAST_MINIMIZED_WINDOW';
    readonly correlationId: CorrelationId;
} | {
    readonly type: 'CLOSE_FOCUSED_WINDOW';
    readonly correlationId: CorrelationId;
} | {
    readonly type: 'ESCAPE_TO_CALM';
    readonly correlationId: CorrelationId;
} | {
    readonly type: 'SWITCH_SPACE';
    readonly correlationId: CorrelationId;
    readonly payload: {
        readonly spaceId: SpaceId;
    };
} | {
    readonly type: 'MOVE_WINDOW_TO_SPACE';
    readonly correlationId: CorrelationId;
    readonly payload: {
        readonly windowId: string;
        readonly spaceId: SpaceId;
    };
} | {
    readonly type: 'RESTORE_ACTIVE_SPACE';
    readonly correlationId: CorrelationId;
} | {
    readonly type: 'RESTORE_WINDOW_BY_ID';
    readonly correlationId: CorrelationId;
    readonly payload: {
        readonly windowId: string;
    };
} | {
    readonly type: 'STEP_UP_COMPLETE';
    readonly correlationId: CorrelationId;
    readonly payload: {
        readonly success: boolean;
    };
} | {
    readonly type: 'STEP_UP_CANCEL';
    readonly correlationId: CorrelationId;
} | {
    readonly type: 'LOGOUT';
    readonly correlationId: CorrelationId;
} | {
    readonly type: 'LOCK_SCREEN';
    readonly correlationId: CorrelationId;
} | {
    readonly type: 'UNLOCK_SCREEN';
    readonly correlationId: CorrelationId;
};
/**
 * Extract intent type for type guards
 */
export type IntentType = Intent['type'];
/**
 * Pending step-up challenge
 */
export interface PendingStepUp {
    readonly capabilityId: CapabilityId;
    readonly challenge: string;
    readonly correlationId: CorrelationId;
}
/**
 * Complete system state - single source of truth
 */
export interface SystemState {
    readonly windows: Readonly<Record<string, Window>>;
    readonly windowOrder: readonly string[];
    readonly focusedWindowId: string | null;
    readonly activeSpaceId: SpaceId;
    readonly processes: Readonly<Record<string, Process>>;
    readonly activeCapabilities: readonly CapabilityId[];
    readonly contextStack: readonly CapabilityId[];
    readonly cognitiveMode: CognitiveMode;
    readonly security: SecurityContext;
    readonly pendingStepUp: PendingStepUp | null;
}
/**
 * Base event properties - ALL events have these
 */
interface BaseEvent {
    readonly correlationId: CorrelationId;
    readonly timestamp: number;
}
/**
 * System event - result of intent processing
 * Every event carries correlationId for tracing
 */
export type SystemEvent = BaseEvent & {
    readonly type: 'WINDOW_CREATED';
    readonly window: Window;
} | BaseEvent & {
    readonly type: 'WINDOW_CLOSED';
    readonly windowId: string;
} | BaseEvent & {
    readonly type: 'WINDOW_FOCUSED';
    readonly windowId: string;
} | BaseEvent & {
    readonly type: 'WINDOW_MINIMIZED';
    readonly windowId: string;
} | BaseEvent & {
    readonly type: 'WINDOW_RESTORED';
    readonly windowId: string;
} | BaseEvent & {
    readonly type: 'CAPABILITY_ACTIVATED';
    readonly capabilityId: CapabilityId;
} | BaseEvent & {
    readonly type: 'CAPABILITY_DEACTIVATED';
    readonly capabilityId: CapabilityId;
} | BaseEvent & {
    readonly type: 'COGNITIVE_MODE_CHANGED';
    readonly mode: CognitiveMode;
} | BaseEvent & {
    readonly type: 'STEP_UP_REQUIRED';
    readonly capabilityId: CapabilityId;
    readonly challenge: string;
} | BaseEvent & {
    readonly type: 'STEP_UP_COMPLETED';
} | BaseEvent & {
    readonly type: 'POLICY_DENIED';
    readonly capabilityId: CapabilityId;
    readonly reason: string;
} | BaseEvent & {
    readonly type: 'CALM_STATE_ENTERED';
} | BaseEvent & {
    readonly type: 'SECURITY_CONTEXT_CHANGED';
    readonly security: SecurityContext;
} | BaseEvent & {
    readonly type: 'SCREEN_LOCKED';
} | BaseEvent & {
    readonly type: 'SCREEN_UNLOCKED';
} | BaseEvent & {
    readonly type: 'SPACE_ACCESS_DENIED';
    readonly payload: {
        readonly spaceId: SpaceId;
        readonly reason: string;
        readonly windowId?: string;
        readonly capabilityId?: CapabilityId;
        readonly intentType?: string;
    };
} | BaseEvent & {
    readonly type: 'DECISION_EXPLAINED';
    readonly payload: DecisionExplanation;
};
/**
 * Extract event type for type guards
 */
export type SystemEventType = SystemEvent['type'];
/**
 * Event listener type
 */
export type EventListener = (event: SystemEvent) => void;
/**
 * Type-safe intent factory
 * Ensures all intents have correlationId
 */
export declare const IntentFactory: {
    readonly openCapability: (capabilityId: CapabilityId, contextId?: string) => Intent;
    readonly closeWindow: (windowId: string) => Intent;
    readonly focusWindow: (windowId: string) => Intent;
    readonly minimizeWindow: (windowId: string) => Intent;
    readonly restoreWindow: (windowId: string) => Intent;
    readonly minimizeAll: () => Intent;
    readonly stepUpComplete: (success: boolean) => Intent;
    readonly stepUpCancel: () => Intent;
    readonly logout: () => Intent;
    readonly lockScreen: () => Intent;
    readonly unlockScreen: () => Intent;
    readonly focusNextWindow: () => Intent;
    readonly focusPreviousWindow: () => Intent;
    readonly focusWindowByIndex: (index: number) => Intent;
    readonly minimizeFocusedWindow: () => Intent;
    readonly restoreLastMinimizedWindow: () => Intent;
    readonly closeFocusedWindow: () => Intent;
    readonly escapeToCalm: () => Intent;
    readonly switchSpace: (spaceId: SpaceId) => Intent;
    readonly moveWindowToSpace: (windowId: string, spaceId: SpaceId) => Intent;
    readonly restoreActiveSpace: () => Intent;
    readonly restoreWindowById: (windowId: string) => Intent;
};
export {};
//# sourceMappingURL=index.d.ts.map