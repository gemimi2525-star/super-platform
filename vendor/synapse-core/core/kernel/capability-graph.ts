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
import { CAPABILITY_MANIFESTS, getRegisteredCapabilityIds } from './manifests';

// ═══════════════════════════════════════════════════════════════════════════
// ENFORCEMENT GATE (Phase E2)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Validation error from enforcement gate
 */
export interface ManifestValidationError {
    readonly capabilityId: CapabilityId | string;
    readonly errorType:
    | 'missing_tier'
    | 'missing_stepup_message'
    | 'invalid_window_mode'
    | 'duplicate_id'
    | 'not_registered'
    // Phase G additions
    | 'showInDock_hasUI_mismatch'
    | 'hasUI_windowMode_mismatch'
    | 'title_too_short'
    | 'title_too_long'
    | 'missing_icon'
    | 'blocked_id'
    | 'forbidden_terminology';
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
 * Blocked capability IDs per governance rules
 * @see /docs/specs/MANIFEST_UI_CONSISTENCY_RULES_v1.md
 */
const BLOCKED_IDS: readonly string[] = [
    'core.dashboard',
    'core.chat',
];

const BLOCKED_PATTERNS: readonly string[] = [
    'launcher',
    'widget',
    'sidebar',
    'notification',
];

const FORBIDDEN_TERMS: readonly string[] = [
    'dashboard',
];

/**
 * Validate a single manifest against governance rules
 * 
 * @see /docs/governance/CERTIFICATION_CHECKLIST_PACK_v1.md
 * @see /docs/specs/MANIFEST_UI_CONSISTENCY_RULES_v1.md (Phase G)
 */
function validateManifest(manifest: CapabilityManifest): ManifestValidationError[] {
    const errors: ManifestValidationError[] = [];

    // E3: Certification tier required
    if (!manifest.certificationTier) {
        errors.push({
            capabilityId: manifest.id,
            errorType: 'missing_tier',
            message: `Capability '${manifest.id}' missing certificationTier`,
        });
    }

    // Governance rule: requiresStepUp=true must have stepUpMessage
    if (manifest.requiresStepUp && !manifest.stepUpMessage) {
        errors.push({
            capabilityId: manifest.id,
            errorType: 'missing_stepup_message',
            message: `Capability '${manifest.id}' has requiresStepUp=true but no stepUpMessage`,
        });
    }

    // Window Contract: windowMode:'none' is blocked
    // Note: 'backgroundOnly' is allowed for special cases like Finder
    if ((manifest.windowMode as string) === 'none') {
        errors.push({
            capabilityId: manifest.id,
            errorType: 'invalid_window_mode',
            message: `Capability '${manifest.id}' has windowMode:'none' which is not allowed`,
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // PHASE G: UI Consistency Rules
    // ═══════════════════════════════════════════════════════════════

    // G1: showInDock=true requires hasUI=true
    if (manifest.showInDock && !manifest.hasUI) {
        errors.push({
            capabilityId: manifest.id,
            errorType: 'showInDock_hasUI_mismatch',
            message: `Capability '${manifest.id}' has showInDock=true but hasUI=false`,
        });
    }

    // G2: hasUI/windowMode consistency
    if (manifest.hasUI) {
        const validUIWindowModes = ['single', 'multi', 'multiByContext'];
        if (!validUIWindowModes.includes(manifest.windowMode)) {
            errors.push({
                capabilityId: manifest.id,
                errorType: 'hasUI_windowMode_mismatch',
                message: `Capability '${manifest.id}' has hasUI=true but windowMode='${manifest.windowMode}' (expected single/multi/multiByContext)`,
            });
        }
    } else {
        // hasUI=false means windowMode should be 'backgroundOnly' (but we allow flexibility for now)
        // Just validate it's not a UI mode
        const uiModes = ['single', 'multi', 'multiByContext'];
        if (uiModes.includes(manifest.windowMode)) {
            errors.push({
                capabilityId: manifest.id,
                errorType: 'hasUI_windowMode_mismatch',
                message: `Capability '${manifest.id}' has hasUI=false but windowMode='${manifest.windowMode}' (expected backgroundOnly)`,
            });
        }
    }

    // G3: Title length validation (2-30 chars)
    if (manifest.title.length < 2) {
        errors.push({
            capabilityId: manifest.id,
            errorType: 'title_too_short',
            message: `Capability '${manifest.id}' title '${manifest.title}' is too short (min 2 chars)`,
        });
    }
    if (manifest.title.length > 30) {
        errors.push({
            capabilityId: manifest.id,
            errorType: 'title_too_long',
            message: `Capability '${manifest.id}' title '${manifest.title}' is too long (max 30 chars)`,
        });
    }

    // G4: Icon required
    if (!manifest.icon || manifest.icon.trim() === '') {
        errors.push({
            capabilityId: manifest.id,
            errorType: 'missing_icon',
            message: `Capability '${manifest.id}' is missing icon`,
        });
    }

    // G5: Blocked ID check
    if (BLOCKED_IDS.includes(manifest.id)) {
        errors.push({
            capabilityId: manifest.id,
            errorType: 'blocked_id',
            message: `Capability '${manifest.id}' is a blocked ID`,
        });
    }
    for (const pattern of BLOCKED_PATTERNS) {
        if (manifest.id.includes(pattern)) {
            errors.push({
                capabilityId: manifest.id,
                errorType: 'blocked_id',
                message: `Capability '${manifest.id}' contains blocked pattern '${pattern}'`,
            });
        }
    }

    return errors;
}

/**
 * Validate entire manifest registry
 * This is the E2 Consistency Gate
 * 
 * @see /docs/governance/GOVERNANCE_TRIGGER_MATRIX_v1_1.md
 */
export function validateManifestRegistry(): ManifestValidationResult {
    const errors: ManifestValidationError[] = [];
    const seenIds = new Set<string>();

    for (const [id, manifest] of Object.entries(CAPABILITY_MANIFESTS)) {
        // Check for duplicate IDs
        if (seenIds.has(id)) {
            errors.push({
                capabilityId: id,
                errorType: 'duplicate_id',
                message: `Duplicate capability ID: '${id}'`,
            });
        }
        seenIds.add(id);

        // ID in manifest must match registry key
        if (manifest.id !== id) {
            errors.push({
                capabilityId: id,
                errorType: 'not_registered',
                message: `Manifest ID '${manifest.id}' does not match registry key '${id}'`,
            });
        }

        // Validate individual manifest
        errors.push(...validateManifest(manifest));
    }

    return {
        valid: errors.length === 0,
        errors,
        validatedAt: Date.now(),
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// CAPABILITY GRAPH (Manifest-Driven)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Capability Graph - Manifest-driven capability management
 * All behavior is determined by manifest properties
 * 
 * Phase E: Now imports manifests from /coreos/manifests/
 */
export class CoreOSCapabilityGraph {
    private readonly manifests: ReadonlyMap<CapabilityId, CapabilityManifest>;
    private readonly validationResult: ManifestValidationResult;

    constructor() {
        // Run enforcement gate on construction
        this.validationResult = validateManifestRegistry();

        // Build manifest map
        this.manifests = new Map(
            Object.entries(CAPABILITY_MANIFESTS) as [CapabilityId, CapabilityManifest][]
        );
    }

    /**
     * Get validation result from enforcement gate
     */
    getValidationResult(): ManifestValidationResult {
        return this.validationResult;
    }

    /**
     * Check if registry is valid (E2 enforcement)
     */
    isValid(): boolean {
        return this.validationResult.valid;
    }

    /**
     * Get manifest by capability ID
     */
    getManifest(id: CapabilityId): CapabilityManifest | undefined {
        return this.manifests.get(id);
    }

    /**
     * Check if capability exists
     */
    has(id: CapabilityId): boolean {
        return this.manifests.has(id);
    }

    /**
     * Get all capability IDs
     */
    getAllIds(): readonly CapabilityId[] {
        return Array.from(this.manifests.keys());
    }

    /**
     * Get capabilities that should appear in dock
     */
    getDockCapabilities(): readonly CapabilityManifest[] {
        return Array.from(this.manifests.values())
            .filter(m => m.showInDock);
    }

    /**
     * Get capabilities that have UI windows
     */
    getWindowCapabilities(): readonly CapabilityManifest[] {
        return Array.from(this.manifests.values())
            .filter(m => m.hasUI);
    }

    /**
     * Get capabilities by certification tier (E3)
     */
    getByTier(tier: CertificationTier): readonly CapabilityManifest[] {
        return Array.from(this.manifests.values())
            .filter(m => m.certificationTier === tier);
    }

    /**
     * Get all manifests (Phase G: for consistency checks)
     */
    getAllManifests(): readonly CapabilityManifest[] {
        return Array.from(this.manifests.values());
    }

    // ═══════════════════════════════════════════════════════════════════════
    // MANIFEST-DRIVEN BEHAVIOR QUERIES
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Check if capability requires step-up auth (from manifest)
     */
    requiresStepUp(id: CapabilityId): boolean {
        const manifest = this.manifests.get(id);
        return manifest?.requiresStepUp ?? false;
    }

    /**
     * Get step-up message (from manifest)
     */
    getStepUpMessage(id: CapabilityId): string | undefined {
        return this.manifests.get(id)?.stepUpMessage;
    }

    /**
     * Get required policies for a capability (from manifest)
     */
    getRequiredPolicies(id: CapabilityId): readonly string[] {
        const manifest = this.manifests.get(id);
        return manifest?.requiredPolicies ?? [];
    }

    /**
     * Get window mode (from manifest)
     */
    getWindowMode(id: CapabilityId): WindowMode | undefined {
        return this.manifests.get(id)?.windowMode;
    }

    /**
     * Check if capability has UI window (from manifest)
     */
    hasUI(id: CapabilityId): boolean {
        return this.manifests.get(id)?.hasUI ?? false;
    }

    /**
     * Check if single instance window (from manifest)
     */
    isSingleInstance(id: CapabilityId): boolean {
        return this.manifests.get(id)?.windowMode === 'single';
    }

    /**
     * Check if multiByContext (from manifest)
     */
    isMultiByContext(id: CapabilityId): boolean {
        return this.manifests.get(id)?.windowMode === 'multiByContext';
    }

    /**
     * Get supported contexts (from manifest)
     */
    getSupportedContexts(id: CapabilityId): readonly ContextType[] {
        return this.manifests.get(id)?.contextsSupported ?? [];
    }

    /**
     * Get dependencies (from manifest)
     */
    getDependencies(id: CapabilityId): readonly CapabilityId[] {
        return this.manifests.get(id)?.dependencies ?? [];
    }

    /**
     * Get title (from manifest)
     */
    getTitle(id: CapabilityId): string {
        return this.manifests.get(id)?.title ?? id;
    }

    /**
     * Get icon (from manifest)
     */
    getIcon(id: CapabilityId): string {
        return this.manifests.get(id)?.icon ?? '❓';
    }

    /**
     * Get certification tier (from manifest) - E3
     */
    getCertificationTier(id: CapabilityId): CertificationTier | undefined {
        return this.manifests.get(id)?.certificationTier;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON
// ═══════════════════════════════════════════════════════════════════════════

let instance: CoreOSCapabilityGraph | null = null;

export function getCapabilityGraph(): CoreOSCapabilityGraph {
    if (!instance) {
        instance = new CoreOSCapabilityGraph();
    }
    return instance;
}

export function resetCapabilityGraph(): void {
    instance = null;
}
