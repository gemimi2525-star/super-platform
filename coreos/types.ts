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

// ═══════════════════════════════════════════════════════════════════════════
// CORE PRIMITIVES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Unique identifier for intent-event correlation
 */
export type CorrelationId = string & { readonly __brand: 'CorrelationId' };

/**
 * Generate a new correlation ID
 */
export function createCorrelationId(): CorrelationId {
    return `cid-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` as CorrelationId;
}

// ═══════════════════════════════════════════════════════════════════════════
// CAPABILITY SYSTEM (Manifest-Driven)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Capability identifier - strictly typed union
 * CORE: 6 capabilities (system-built)
 * EXPERIMENTAL: 1 capability (Phase F)
 */
export type CapabilityId =
    | 'core.finder'
    | 'core.files' // Phase 26.1.x (File Explorer)
    | 'core.settings'
    | 'user.manage'
    | 'org.manage'
    | 'audit.view'
    | 'system.configure'
    | 'core.store' // Phase 24B
    // Phase 5: Operational Visibility
    | 'ops.center'
    // Phase F: EXPERIMENTAL
    | 'plugin.analytics'
    // Phase 18: Utility Tools
    | 'core.tools'
    // Phase 19: Permission System
    | 'core.permissions'
    // Phase 39: AI Governance Brain
    | 'core.admin'
    | 'core.finance'
    | 'brain.assist'
    // Phase 25B: Brain Dashboard (Owner-only)
    | 'brain.dashboard'
    // Phase 16A: VFS App Integration
    | 'core.notes'
    // Phase 15A
    | 'core.files';

/**
 * Window mode - defines window BEHAVIOR (how many windows allowed)
 * @see /docs/contracts/WINDOW_IDENTITY_CONTRACT_v1.md
 * 
 * Phase H: Reconciled with Window Semantics Contract
 * - windowMode = behavior (single/multi/multiByContext/backgroundOnly)
 * - windowDisplay = visual surface type (window/modal)
 */
export type WindowMode =
    | 'single'           // Only one window allowed (e.g., settings)
    | 'multi'            // Multiple windows allowed
    | 'multiByContext'   // Multiple windows, one per context (e.g., audit by org)
    | 'backgroundOnly';  // No window (e.g., finder is the desktop itself)

/**
 * Window display - defines visual SURFACE TYPE
 * @see /docs/contracts/WINDOW_SEMANTICS_CONTRACT_v1.md
 * 
 * Phase H: Added to separate behavior from visual presentation
 */
export type WindowDisplay =
    | 'window'           // Standard desktop window
    | 'modal';           // Blocking overlay (step-up, confirmations)

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
    readonly windowMode: WindowMode;         // Behavior: single/multi/multiByContext/backgroundOnly
    readonly windowDisplay?: WindowDisplay;  // Visual: window/modal (default: 'window')
    readonly requiredPolicies: readonly string[];
    readonly requiresStepUp: boolean;
    readonly stepUpMessage?: string;  // Required if requiresStepUp=true
    readonly dependencies: readonly CapabilityId[];
    readonly contextsSupported: readonly ContextType[];
    readonly showInDock: boolean;

    // Certification (Phase E)
    readonly certificationTier: CertificationTier;
    readonly certifiedAt?: string;    // ISO8601 (for certified tier)
    readonly certifiedBy?: string;    // (for certified tier)

    // Phase 7.3: Persona Gates
    readonly requiredRole?: UserRole;  // Minimum role required to see in Dock
}

// ═══════════════════════════════════════════════════════════════════════════
// WINDOW SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Window state - strictly typed enum
 */
export type WindowState = 'active' | 'minimized' | 'hidden';

// ─────────────────────────────────────────────────────────────────────────────
// PHASE L: Virtual Spaces / Contexts
// ─────────────────────────────────────────────────────────────────────────────

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 19: PERMISSION SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

export type PermissionStatus = 'granted' | 'denied' | 'prompt';

export type PermissionScope =
    | 'session'          // Granted for this session only
    | 'persistent_app'   // Granted for this app persistently
    | 'persistent_org';  // Granted for this organization (future)

export interface PermissionRequest {
    readonly capabilityId: CapabilityId;
    readonly appName?: string;
    readonly scope: PermissionScope;
    readonly correlationId: CorrelationId;
}

/**
 * Space ID - virtual context identifier
 * Format: space:{name} e.g. 'space:default', 'space:org-abc'
 */
export type SpaceId = `space:${string}`;

/**
 * Default space ID
 */
export const DEFAULT_SPACE_ID: SpaceId = 'space:default';

import type { WindowRole, WindowCapability } from '../lib/runtime/window-types';
import type { AppPackage } from './manifests/spec'; // Phase 24A.1

/**
 * Window instance in the system
 * Phase 7.1: Extended with position, size, and constraints
 * Phase 18: Extended with Role & Capability Model
 */
export interface Window {
    readonly id: string;
    readonly capabilityId: CapabilityId;
    readonly state: WindowState;
    readonly zIndex: number;
    readonly title: string;
    readonly contextId?: string; // Optional context identifier
    readonly spaceId: SpaceId;   // Phase L: Virtual Space ownership

    // Phase 19: Extended Window Properties
    readonly metadata?: Record<string, any>; // Flexible metadata for modal contexts
    readonly correlationId?: CorrelationId;  // Trace ID for window lifecycle/intent
    readonly role: WindowRole;          // Phase 18: Window Role (APP, UTILITY, etc.)
    readonly capabilities: WindowCapability; // Phase 18: Enforceable capabilities
    readonly createdAt: number;

    // ─────────────────────────────────────────────────────────────────────────
    // Phase 7.1: Position, Size & Constraints
    // ─────────────────────────────────────────────────────────────────────────
    readonly x: number;                  // Window left position (px)
    readonly y: number;                  // Window top position (px)
    readonly width: number;              // Window width (px)
    readonly height: number;             // Window height (px)
    readonly isMaximized: boolean;       // Maximize toggle state

    // Size constraints (enforced during resize)
    readonly minWidth: number;           // Minimum width (mandatory)
    readonly minHeight: number;          // Minimum height (mandatory)
    readonly maxWidth?: number;          // Maximum width (optional)
    readonly maxHeight?: number;         // Maximum height (optional)

    // Stored position/size before maximize (for restore)
    readonly preMaximizeBounds?: {
        readonly x: number;
        readonly y: number;
        readonly width: number;
        readonly height: number;
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// POLICY SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Policy decision output - strictly typed discriminated union
 */
export type PolicyDecision =
    | { readonly type: 'allow' }
    | { readonly type: 'deny'; readonly reason: string }
    | { readonly type: 'require_stepup'; readonly challenge: string }
    | { readonly type: 'degrade'; readonly fallback: CapabilityId };

/**
 * Policy evaluation context - immutable
 */
export interface PolicyContext {
    readonly capabilityId: CapabilityId;
    readonly security: SecurityContext;
    readonly targetContextId: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE M: Space Policy Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Permissions for a space
 */
export interface SpacePermissions {
    readonly canAccess: boolean;      // Can user access/switch to this space
    readonly canOpenWindow: boolean;  // Can user open windows in this space
    readonly canFocusWindow: boolean; // Can user focus windows in this space
    readonly canMoveWindow: boolean;  // Can user move windows to/from this space
}

/**
 * Default permissions (allow all)
 */
export const DEFAULT_SPACE_PERMISSIONS: SpacePermissions = {
    canAccess: true,
    canOpenWindow: true,
    canFocusWindow: true,
    canMoveWindow: true,
};

/**
 * Space policy configuration
 */
export interface SpacePolicy {
    readonly spaceId: SpaceId;
    readonly permissions: SpacePermissions;
    readonly requiredRole?: UserRole;       // Minimum role required
    readonly requiredPolicies?: string[];   // Required policy strings
}

/**
 * Space access decision - result of space policy evaluation
 */
export type SpaceAccessDecision =
    | { readonly type: 'allow' }
    | { readonly type: 'deny'; readonly reason: string; readonly spaceId: SpaceId };

// ─────────────────────────────────────────────────────────────────────────────
// PHASE R: Decision Explanation Types (Auditability & Explainability)
// ─────────────────────────────────────────────────────────────────────────────

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
export type SpaceAction =
    | 'access'       // Switch to space
    | 'openWindow'   // Open window in space
    | 'focusWindow'  // Focus window in space
    | 'moveWindow';  // Move window to space

/**
 * Space policy evaluation context
 */
export interface SpacePolicyContext {
    readonly spaceId: SpaceId;
    readonly action: SpaceAction;
    readonly security: SecurityContext;
    readonly windowId?: string;  // For window-specific actions
}

// ═══════════════════════════════════════════════════════════════════════════
// SECURITY CONTEXT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * User role - strictly typed
 */
export type UserRole = 'guest' | 'user' | 'admin' | 'owner';

/**
 * Phase 7.3: Role hierarchy for persona gates
 * Higher index = higher privilege
 */
const ROLE_HIERARCHY: readonly UserRole[] = ['guest', 'user', 'admin', 'owner'];

/**
 * Phase 7.3: Check if userRole meets or exceeds requiredRole
 * @param userRole - Current user's role
 * @param requiredRole - Minimum role required
 * @returns true if access granted
 */
export function roleHasAccess(userRole: UserRole, requiredRole: UserRole): boolean {
    const userIndex = ROLE_HIERARCHY.indexOf(userRole);
    const requiredIndex = ROLE_HIERARCHY.indexOf(requiredRole);
    return userIndex >= requiredIndex;
}

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

// ═══════════════════════════════════════════════════════════════════════════
// COGNITIVE MODE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * System cognitive mode - strictly typed
 */
export type CognitiveMode =
    | 'calm'        // Desktop idle, no focus
    | 'focused'     // Single task focus
    | 'multitask'   // Multiple windows active
    | 'alert'       // System notification active
    | 'locked';     // Screen locked

// ═══════════════════════════════════════════════════════════════════════════
// PROCESS SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════════════
// INTENT SYSTEM (Strictly Typed)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Intent types - ALL actions start as intents
 * Each intent MUST carry a correlationId
 */
export type Intent =
    | {
        readonly type: 'OPEN_CAPABILITY';
        readonly correlationId: CorrelationId;
        readonly payload: {
            readonly capabilityId: CapabilityId;
            readonly contextId?: string;
        };
    }
    | {
        readonly type: 'CLOSE_WINDOW';
        readonly correlationId: CorrelationId;
        readonly payload: { readonly windowId: string };
    }
    | {
        readonly type: 'FOCUS_WINDOW';
        readonly correlationId: CorrelationId;
        readonly payload: { readonly windowId: string };
    }
    | {
        readonly type: 'MINIMIZE_WINDOW';
        readonly correlationId: CorrelationId;
        readonly payload: { readonly windowId: string };
    }
    | {
        readonly type: 'RESTORE_WINDOW';
        readonly correlationId: CorrelationId;
        readonly payload: { readonly windowId: string };
    }
    | {
        readonly type: 'MINIMIZE_ALL';
        readonly correlationId: CorrelationId;
    }
    // ─────────────────────────────────────────────────────────────────────────
    // PHASE K: Keyboard Shortcut Intents
    // ─────────────────────────────────────────────────────────────────────────
    | {
        readonly type: 'FOCUS_NEXT_WINDOW';
        readonly correlationId: CorrelationId;
    }
    | {
        readonly type: 'FOCUS_PREVIOUS_WINDOW';
        readonly correlationId: CorrelationId;
    }
    | {
        readonly type: 'FOCUS_WINDOW_BY_INDEX';
        readonly correlationId: CorrelationId;
        readonly payload: { readonly index: number };
    }
    | {
        readonly type: 'MINIMIZE_FOCUSED_WINDOW';
        readonly correlationId: CorrelationId;
    }
    | {
        readonly type: 'RESTORE_LAST_MINIMIZED_WINDOW';
        readonly correlationId: CorrelationId;
    }
    | {
        readonly type: 'CLOSE_FOCUSED_WINDOW';
        readonly correlationId: CorrelationId;
    }
    | {
        readonly type: 'ESCAPE_TO_CALM';
        readonly correlationId: CorrelationId;
    }
    // ─────────────────────────────────────────────────────────────────────────
    // PHASE L: Virtual Spaces / Contexts
    // ─────────────────────────────────────────────────────────────────────────
    | {
        readonly type: 'SWITCH_SPACE';
        readonly correlationId: CorrelationId;
        readonly payload: { readonly spaceId: SpaceId };
    }
    | {
        readonly type: 'MOVE_WINDOW_TO_SPACE';
        readonly correlationId: CorrelationId;
        readonly payload: {
            readonly windowId: string;
            readonly spaceId: SpaceId;
        };
    }
    // ─────────────────────────────────────────────────────────────────────────
    // PHASE Q: Restore Intents (Explicit Only)
    // ─────────────────────────────────────────────────────────────────────────
    | {
        readonly type: 'RESTORE_ACTIVE_SPACE';
        readonly correlationId: CorrelationId;
    }
    | {
        readonly type: 'RESTORE_WINDOW_BY_ID';
        readonly correlationId: CorrelationId;
        readonly payload: { readonly windowId: string };
    }
    // ─────────────────────────────────────────────────────────────────────────
    | {
        readonly type: 'STEP_UP_COMPLETE';
        readonly correlationId: CorrelationId;
        readonly payload: { readonly success: boolean };
    }
    | {
        readonly type: 'STEP_UP_CANCEL';
        readonly correlationId: CorrelationId;
    }
    | {
        readonly type: 'LOGOUT';
        readonly correlationId: CorrelationId;
    }
    | {
        readonly type: 'LOCK_SCREEN';
        readonly correlationId: CorrelationId;
    }
    | {
        readonly type: 'UNLOCK_SCREEN';
        readonly correlationId: CorrelationId;
    }
    // ─────────────────────────────────────────────────────────────────────────
    // PHASE 19: Permission Intents
    // ─────────────────────────────────────────────────────────────────────────
    | {
        readonly type: 'REQUEST_PERMISSION';
        readonly correlationId: CorrelationId;
        readonly payload: PermissionRequest;
    }
    | {
        readonly type: 'GRANT_PERMISSION';
        readonly correlationId: CorrelationId;
        readonly payload: {
            readonly requestId: string;
            readonly scope: PermissionScope;
            readonly capabilityId: CapabilityId; // Phase 20: Required for persistence
            readonly appName?: string;
        };
    }
    | {
        readonly type: 'DENY_PERMISSION';
        readonly correlationId: CorrelationId;
        readonly payload: {
            readonly requestId: string;
        };
    }
    | {
        readonly type: 'REVOKE_PERMISSION';
        readonly correlationId: CorrelationId;
        readonly payload: {
            readonly appName: string;
            readonly capabilityId: CapabilityId;
        };
    }
    // ─────────────────────────────────────────────────────────────────────────
    // PHASE 24A.1: App Lifecycle Intents
    // ─────────────────────────────────────────────────────────────────────────
    | {
        readonly type: 'INSTALL_APP';
        readonly correlationId: CorrelationId;
        readonly payload: {
            readonly package: AppPackage; // AppPackage (lazy typed for now to avoid circular deps if needed, or import)
        };
    }
    | {
        readonly type: 'UNINSTALL_APP';
        readonly correlationId: CorrelationId;
        readonly payload: {
            readonly appId: string;
        };
    }
    | {
        readonly type: 'UPDATE_APP';
        readonly correlationId: CorrelationId;
        readonly payload: {
            readonly package: AppPackage;
        };
    }
    // ─────────────────────────────────────────────────────────────────────────
    // PHASE 26.2A: AI Assist Intents (Propose & Approval)
    // ─────────────────────────────────────────────────────────────────────────
    | {
        readonly type: 'PROPOSE_FILE_ACTION';
        readonly correlationId: CorrelationId;
        readonly payload: {
            readonly action: 'move' | 'rename' | 'delete';
            readonly sourcePath: string;
            readonly destinationPath?: string; // For move/rename
            readonly reason: string;
        };
    }
    | {
        readonly type: 'PROPOSE_SETTING_CHANGE';
        readonly correlationId: CorrelationId;
        readonly payload: {
            readonly settingKey: string;
            readonly oldValue: any;
            readonly newValue: any;
            readonly reason: string;
        };
    }
    | {
        readonly type: 'RESOLVE_PROPOSAL';
        readonly correlationId: CorrelationId;
        readonly payload: {
            readonly proposalId: string; // Refers to the correlationId of the PROPOSE_ intent
            readonly decision: 'approved' | 'rejected';
        };
    }
    // ─────────────────────────────────────────────────────────────────────────
    // PHASE 15A: VFS Intents (Governance-Bound)
    // ─────────────────────────────────────────────────────────────────────────
    | {
        readonly type: 'fs.read';
        readonly correlationId: CorrelationId;
        readonly payload: { readonly path: string };
    }
    | {
        readonly type: 'fs.write';
        readonly correlationId: CorrelationId;
        readonly payload: { readonly path: string; readonly size?: number };
    }
    | {
        readonly type: 'fs.list';
        readonly correlationId: CorrelationId;
        readonly payload: { readonly path: string };
    }
    | {
        readonly type: 'fs.delete';
        readonly correlationId: CorrelationId;
        readonly payload: { readonly path: string };
    }
    | {
        readonly type: 'fs.move';
        readonly correlationId: CorrelationId;
        readonly payload: { readonly source: string; readonly destination: string };
    }
    | {
        readonly type: 'fs.mkdir';
        readonly correlationId: CorrelationId;
        readonly payload: { readonly path: string };
    }
    | {
        readonly type: 'fs.trash';
        readonly correlationId: CorrelationId;
        readonly payload: { readonly path: string };
    }
    | {
        readonly type: 'fs.restore';
        readonly correlationId: CorrelationId;
        readonly payload: { readonly path: string };
    };

/**
 * Extract intent type for type guards
 */
export type IntentType = Intent['type'];

// ═══════════════════════════════════════════════════════════════════════════
// SYSTEM STATE
// ═══════════════════════════════════════════════════════════════════════════

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
    // Window Management
    readonly windows: Readonly<Record<string, Window>>;
    readonly windowOrder: readonly string[];
    readonly focusedWindowId: string | null;

    // Phase L: Virtual Spaces
    readonly activeSpaceId: SpaceId;

    // Process Management
    readonly processes: Readonly<Record<string, Process>>;

    // Capability State
    readonly activeCapabilities: readonly CapabilityId[];

    // Context Stack
    readonly contextStack: readonly CapabilityId[];

    // Cognitive State
    readonly cognitiveMode: CognitiveMode;

    // Security State
    readonly security: SecurityContext;

    // Step-up Challenge (if pending)
    readonly pendingStepUp: PendingStepUp | null;
}

// ═══════════════════════════════════════════════════════════════════════════
// EVENT SYSTEM (Strictly Typed with Correlation)
// ═══════════════════════════════════════════════════════════════════════════

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
export type SystemEvent =
    | BaseEvent & { readonly type: 'WINDOW_CREATED'; readonly window: Window }
    | BaseEvent & { readonly type: 'WINDOW_CLOSED'; readonly windowId: string }
    | BaseEvent & { readonly type: 'WINDOW_FOCUSED'; readonly windowId: string }
    | BaseEvent & { readonly type: 'WINDOW_MINIMIZED'; readonly windowId: string }
    | BaseEvent & { readonly type: 'WINDOW_RESTORED'; readonly windowId: string }
    | BaseEvent & { readonly type: 'CAPABILITY_ACTIVATED'; readonly capabilityId: CapabilityId }
    | BaseEvent & { readonly type: 'CAPABILITY_DEACTIVATED'; readonly capabilityId: CapabilityId }
    | BaseEvent & { readonly type: 'COGNITIVE_MODE_CHANGED'; readonly mode: CognitiveMode }
    | BaseEvent & { readonly type: 'STEP_UP_REQUIRED'; readonly capabilityId: CapabilityId; readonly challenge: string }
    | BaseEvent & { readonly type: 'STEP_UP_COMPLETED' }
    | BaseEvent & { readonly type: 'POLICY_DENIED'; readonly capabilityId: CapabilityId; readonly reason: string }
    | BaseEvent & { readonly type: 'CALM_STATE_ENTERED' }
    | BaseEvent & { readonly type: 'SECURITY_CONTEXT_CHANGED'; readonly security: SecurityContext }
    | BaseEvent & { readonly type: 'SCREEN_LOCKED' }
    | BaseEvent & { readonly type: 'SCREEN_UNLOCKED' }
    // Phase M: Space Policy Events
    // Phase O: Extended with capabilityId and intentType
    | BaseEvent & {
        readonly type: 'SPACE_ACCESS_DENIED'; readonly payload: {
            readonly spaceId: SpaceId;
            readonly reason: string;
            readonly windowId?: string;
            readonly capabilityId?: CapabilityId;
            readonly intentType?: string;
        }
    }
    // Phase 19: Permission Events
    | BaseEvent & {
        readonly type: 'PERMISSION_REQUESTED';
        readonly payload: PermissionRequest;
    }
    | BaseEvent & {
        readonly type: 'PERMISSION_DECIDED';
        readonly payload: {
            readonly capabilityId: CapabilityId;
            readonly status: PermissionStatus;
            readonly scope?: PermissionScope;
            readonly requestId: string;
        };
    }
    | BaseEvent & {
        readonly type: 'PERMISSION_REVOKED';
        readonly payload: {
            readonly appName: string;
            readonly capabilityId: CapabilityId;
        };
    }
    // Phase R: Decision Explanation Events (Auditability)
    | BaseEvent & {
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

// ═══════════════════════════════════════════════════════════════════════════
// INTENT FACTORY (Type-safe intent creation)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Type-safe intent factory
 * Ensures all intents have correlationId
 */
export const IntentFactory = {
    openCapability: (capabilityId: CapabilityId, contextId?: string): Intent => ({
        type: 'OPEN_CAPABILITY',
        correlationId: createCorrelationId(),
        payload: { capabilityId, contextId },
    }),

    closeWindow: (windowId: string): Intent => ({
        type: 'CLOSE_WINDOW',
        correlationId: createCorrelationId(),
        payload: { windowId },
    }),

    focusWindow: (windowId: string): Intent => ({
        type: 'FOCUS_WINDOW',
        correlationId: createCorrelationId(),
        payload: { windowId },
    }),

    minimizeWindow: (windowId: string): Intent => ({
        type: 'MINIMIZE_WINDOW',
        correlationId: createCorrelationId(),
        payload: { windowId },
    }),

    restoreWindow: (windowId: string): Intent => ({
        type: 'RESTORE_WINDOW',
        correlationId: createCorrelationId(),
        payload: { windowId },
    }),

    minimizeAll: (): Intent => ({
        type: 'MINIMIZE_ALL',
        correlationId: createCorrelationId(),
    }),

    stepUpComplete: (success: boolean): Intent => ({
        type: 'STEP_UP_COMPLETE',
        correlationId: createCorrelationId(),
        payload: { success },
    }),

    stepUpCancel: (): Intent => ({
        type: 'STEP_UP_CANCEL',
        correlationId: createCorrelationId(),
    }),

    logout: (): Intent => ({
        type: 'LOGOUT',
        correlationId: createCorrelationId(),
    }),

    lockScreen: (): Intent => ({
        type: 'LOCK_SCREEN',
        correlationId: createCorrelationId(),
    }),

    unlockScreen: (): Intent => ({
        type: 'UNLOCK_SCREEN',
        correlationId: createCorrelationId(),
    }),

    // ─────────────────────────────────────────────────────────────────────────
    // PHASE K: Keyboard Shortcut Intent Factories
    // ─────────────────────────────────────────────────────────────────────────

    focusNextWindow: (): Intent => ({
        type: 'FOCUS_NEXT_WINDOW',
        correlationId: createCorrelationId(),
    }),

    focusPreviousWindow: (): Intent => ({
        type: 'FOCUS_PREVIOUS_WINDOW',
        correlationId: createCorrelationId(),
    }),

    focusWindowByIndex: (index: number): Intent => ({
        type: 'FOCUS_WINDOW_BY_INDEX',
        correlationId: createCorrelationId(),
        payload: { index },
    }),

    minimizeFocusedWindow: (): Intent => ({
        type: 'MINIMIZE_FOCUSED_WINDOW',
        correlationId: createCorrelationId(),
    }),

    restoreLastMinimizedWindow: (): Intent => ({
        type: 'RESTORE_LAST_MINIMIZED_WINDOW',
        correlationId: createCorrelationId(),
    }),

    closeFocusedWindow: (): Intent => ({
        type: 'CLOSE_FOCUSED_WINDOW',
        correlationId: createCorrelationId(),
    }),

    escapeToCalm: (): Intent => ({
        type: 'ESCAPE_TO_CALM',
        correlationId: createCorrelationId(),
    }),

    // ─────────────────────────────────────────────────────────────────────────
    // PHASE L: Virtual Spaces / Contexts
    // ─────────────────────────────────────────────────────────────────────────

    switchSpace: (spaceId: SpaceId): Intent => ({
        type: 'SWITCH_SPACE',
        correlationId: createCorrelationId(),
        payload: { spaceId },
    }),

    moveWindowToSpace: (windowId: string, spaceId: SpaceId): Intent => ({
        type: 'MOVE_WINDOW_TO_SPACE',
        correlationId: createCorrelationId(),
        payload: { windowId, spaceId },
    }),

    // ─────────────────────────────────────────────────────────────────────────
    // PHASE Q: Restore Intents
    // ─────────────────────────────────────────────────────────────────────────

    restoreActiveSpace: (): Intent => ({
        type: 'RESTORE_ACTIVE_SPACE',
        correlationId: createCorrelationId(),
    }),

    restoreWindowById: (windowId: string): Intent => ({
        type: 'RESTORE_WINDOW_BY_ID',
        correlationId: createCorrelationId(),
        payload: { windowId },
    }),
} as const;
