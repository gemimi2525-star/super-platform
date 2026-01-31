/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CORE OS KERNEL — Capability Graph (HARDENED + Phase E Enforcement)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * MANIFEST-DRIVEN CAPABILITY SYSTEM
 * - All capability behavior defined by manifest
 * - No hardcoded logic in kernel
 * - Policy and manifest drive everything
 *
 * PHASE E ENFORCEMENT:
 * - Manifests imported from /coreos/manifests/
 * - Consistency Gate validates on initialization
 * - Certification tier enforced
 *
 * @see /docs/specs/CAPABILITY_MANIFEST_v1.md
 * @see /docs/governance/CAPABILITY_REGISTRY_v1.md
 * @module coreos/capability-graph
 * @version 3.0.0 (Phase E)
 */
import type { CapabilityId, CapabilityManifest, WindowMode, ContextType, CertificationTier } from '../types/index.js';
/**
 * Validation error from enforcement gate
 */
export interface ManifestValidationError {
    readonly capabilityId: CapabilityId | string;
    readonly errorType: 'missing_tier' | 'missing_stepup_message' | 'invalid_window_mode' | 'duplicate_id' | 'not_registered' | 'showInDock_hasUI_mismatch' | 'hasUI_windowMode_mismatch' | 'title_too_short' | 'title_too_long' | 'missing_icon' | 'blocked_id' | 'forbidden_terminology';
    readonly message: string;
}
/**
 * Validation result from enforcement gate
 */
export interface ManifestValidationResult {
    readonly valid: boolean;
    readonly errors: readonly ManifestValidationError[];
    readonly validatedAt: number;
}
/**
 * Validate entire manifest registry
 * This is the E2 Consistency Gate
 *
 * @see /docs/governance/GOVERNANCE_TRIGGER_MATRIX_v1_1.md
 */
export declare function validateManifestRegistry(): ManifestValidationResult;
/**
 * Capability Graph - Manifest-driven capability management
 * All behavior is determined by manifest properties
 *
 * Phase E: Now imports manifests from /coreos/manifests/
 */
export declare class CoreOSCapabilityGraph {
    private readonly manifests;
    private readonly validationResult;
    constructor();
    /**
     * Get validation result from enforcement gate
     */
    getValidationResult(): ManifestValidationResult;
    /**
     * Check if registry is valid (E2 enforcement)
     */
    isValid(): boolean;
    /**
     * Get manifest by capability ID
     */
    getManifest(id: CapabilityId): CapabilityManifest | undefined;
    /**
     * Check if capability exists
     */
    has(id: CapabilityId): boolean;
    /**
     * Get all capability IDs
     */
    getAllIds(): readonly CapabilityId[];
    /**
     * Get capabilities that should appear in dock
     */
    getDockCapabilities(): readonly CapabilityManifest[];
    /**
     * Get capabilities that have UI windows
     */
    getWindowCapabilities(): readonly CapabilityManifest[];
    /**
     * Get capabilities by certification tier (E3)
     */
    getByTier(tier: CertificationTier): readonly CapabilityManifest[];
    /**
     * Get all manifests (Phase G: for consistency checks)
     */
    getAllManifests(): readonly CapabilityManifest[];
    /**
     * Check if capability requires step-up auth (from manifest)
     */
    requiresStepUp(id: CapabilityId): boolean;
    /**
     * Get step-up message (from manifest)
     */
    getStepUpMessage(id: CapabilityId): string | undefined;
    /**
     * Get required policies for a capability (from manifest)
     */
    getRequiredPolicies(id: CapabilityId): readonly string[];
    /**
     * Get window mode (from manifest)
     */
    getWindowMode(id: CapabilityId): WindowMode | undefined;
    /**
     * Check if capability has UI window (from manifest)
     */
    hasUI(id: CapabilityId): boolean;
    /**
     * Check if single instance window (from manifest)
     */
    isSingleInstance(id: CapabilityId): boolean;
    /**
     * Check if multiByContext (from manifest)
     */
    isMultiByContext(id: CapabilityId): boolean;
    /**
     * Get supported contexts (from manifest)
     */
    getSupportedContexts(id: CapabilityId): readonly ContextType[];
    /**
     * Get dependencies (from manifest)
     */
    getDependencies(id: CapabilityId): readonly CapabilityId[];
    /**
     * Get title (from manifest)
     */
    getTitle(id: CapabilityId): string;
    /**
     * Get icon (from manifest)
     */
    getIcon(id: CapabilityId): string;
    /**
     * Get certification tier (from manifest) - E3
     */
    getCertificationTier(id: CapabilityId): CertificationTier | undefined;
}
export declare function getCapabilityGraph(): CoreOSCapabilityGraph;
export declare function resetCapabilityGraph(): void;
//# sourceMappingURL=capability-graph.d.ts.map