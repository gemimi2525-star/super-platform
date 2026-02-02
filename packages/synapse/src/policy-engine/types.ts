/**
 * SYNAPSE POLICY ENGINE — Types
 * 
 * Isolated definitions for Policy Evaluation.
 * Decoupled from Core OS types to ensure Governance Sovereignty.
 */

export type CapabilityId = string;
export type WindowMode = 'single' | 'multi' | 'multiByContext' | 'backgroundOnly';
export type WindowDisplay = 'window' | 'modal';
export type ContextType = 'global' | 'organization' | 'user' | 'document';
export type CertificationTier = 'core' | 'certified' | 'experimental';
export type UserRole = 'guest' | 'user' | 'admin' | 'owner';

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
}

export type SpaceId = `space:${string}`;
export const DEFAULT_SPACE_ID: SpaceId = 'space:default';

export interface SpacePermissions {
    readonly canAccess: boolean;
    readonly canOpenWindow: boolean;
    readonly canFocusWindow: boolean;
    readonly canMoveWindow: boolean;
}

export const DEFAULT_SPACE_PERMISSIONS: SpacePermissions = {
    canAccess: true,
    canOpenWindow: true,
    canFocusWindow: true,
    canMoveWindow: true,
};

export interface SpacePolicy {
    readonly spaceId: SpaceId;
    readonly permissions: SpacePermissions;
    readonly requiredRole?: UserRole;
    readonly requiredPolicies?: string[];
}

export type SpaceAccessDecision =
    | { readonly type: 'allow' }
    | { readonly type: 'deny'; readonly reason: string; readonly spaceId: SpaceId };

export interface SpacePolicyContext {
    readonly spaceId: SpaceId;
    readonly action: 'access' | 'openWindow' | 'focusWindow' | 'moveWindow';
    readonly security: SecurityContext;
    readonly windowId?: string;
}

export interface SecurityContext {
    readonly authenticated: boolean;
    readonly userId: string | null;
    readonly role: UserRole;
    readonly stepUpActive: boolean;
    readonly stepUpExpiry: number | null;
    readonly policies: readonly string[];
}
