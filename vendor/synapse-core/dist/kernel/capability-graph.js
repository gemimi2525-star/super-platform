"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoreOSCapabilityGraph = void 0;
exports.validateManifestRegistry = validateManifestRegistry;
exports.getCapabilityGraph = getCapabilityGraph;
exports.resetCapabilityGraph = resetCapabilityGraph;
const manifests_1 = require("./manifests");
/**
 * Blocked capability IDs per governance rules
 * @see /docs/specs/MANIFEST_UI_CONSISTENCY_RULES_v1.md
 */
const BLOCKED_IDS = [
    'core.dashboard',
    'core.chat',
];
const BLOCKED_PATTERNS = [
    'launcher',
    'widget',
    'sidebar',
    'notification',
];
const FORBIDDEN_TERMS = [
    'dashboard',
];
/**
 * Validate a single manifest against governance rules
 *
 * @see /docs/governance/CERTIFICATION_CHECKLIST_PACK_v1.md
 * @see /docs/specs/MANIFEST_UI_CONSISTENCY_RULES_v1.md (Phase G)
 */
function validateManifest(manifest) {
    const errors = [];
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
    if (manifest.windowMode === 'none') {
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
    }
    else {
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
function validateManifestRegistry() {
    const errors = [];
    const seenIds = new Set();
    for (const [id, manifest] of Object.entries(manifests_1.CAPABILITY_MANIFESTS)) {
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
class CoreOSCapabilityGraph {
    manifests;
    validationResult;
    constructor() {
        // Run enforcement gate on construction
        this.validationResult = validateManifestRegistry();
        // Build manifest map
        this.manifests = new Map(Object.entries(manifests_1.CAPABILITY_MANIFESTS));
    }
    /**
     * Get validation result from enforcement gate
     */
    getValidationResult() {
        return this.validationResult;
    }
    /**
     * Check if registry is valid (E2 enforcement)
     */
    isValid() {
        return this.validationResult.valid;
    }
    /**
     * Get manifest by capability ID
     */
    getManifest(id) {
        return this.manifests.get(id);
    }
    /**
     * Check if capability exists
     */
    has(id) {
        return this.manifests.has(id);
    }
    /**
     * Get all capability IDs
     */
    getAllIds() {
        return Array.from(this.manifests.keys());
    }
    /**
     * Get capabilities that should appear in dock
     */
    getDockCapabilities() {
        return Array.from(this.manifests.values())
            .filter(m => m.showInDock);
    }
    /**
     * Get capabilities that have UI windows
     */
    getWindowCapabilities() {
        return Array.from(this.manifests.values())
            .filter(m => m.hasUI);
    }
    /**
     * Get capabilities by certification tier (E3)
     */
    getByTier(tier) {
        return Array.from(this.manifests.values())
            .filter(m => m.certificationTier === tier);
    }
    /**
     * Get all manifests (Phase G: for consistency checks)
     */
    getAllManifests() {
        return Array.from(this.manifests.values());
    }
    // ═══════════════════════════════════════════════════════════════════════
    // MANIFEST-DRIVEN BEHAVIOR QUERIES
    // ═══════════════════════════════════════════════════════════════════════
    /**
     * Check if capability requires step-up auth (from manifest)
     */
    requiresStepUp(id) {
        const manifest = this.manifests.get(id);
        return manifest?.requiresStepUp ?? false;
    }
    /**
     * Get step-up message (from manifest)
     */
    getStepUpMessage(id) {
        return this.manifests.get(id)?.stepUpMessage;
    }
    /**
     * Get required policies for a capability (from manifest)
     */
    getRequiredPolicies(id) {
        const manifest = this.manifests.get(id);
        return manifest?.requiredPolicies ?? [];
    }
    /**
     * Get window mode (from manifest)
     */
    getWindowMode(id) {
        return this.manifests.get(id)?.windowMode;
    }
    /**
     * Check if capability has UI window (from manifest)
     */
    hasUI(id) {
        return this.manifests.get(id)?.hasUI ?? false;
    }
    /**
     * Check if single instance window (from manifest)
     */
    isSingleInstance(id) {
        return this.manifests.get(id)?.windowMode === 'single';
    }
    /**
     * Check if multiByContext (from manifest)
     */
    isMultiByContext(id) {
        return this.manifests.get(id)?.windowMode === 'multiByContext';
    }
    /**
     * Get supported contexts (from manifest)
     */
    getSupportedContexts(id) {
        return this.manifests.get(id)?.contextsSupported ?? [];
    }
    /**
     * Get dependencies (from manifest)
     */
    getDependencies(id) {
        return this.manifests.get(id)?.dependencies ?? [];
    }
    /**
     * Get title (from manifest)
     */
    getTitle(id) {
        return this.manifests.get(id)?.title ?? id;
    }
    /**
     * Get icon (from manifest)
     */
    getIcon(id) {
        return this.manifests.get(id)?.icon ?? '❓';
    }
    /**
     * Get certification tier (from manifest) - E3
     */
    getCertificationTier(id) {
        return this.manifests.get(id)?.certificationTier;
    }
}
exports.CoreOSCapabilityGraph = CoreOSCapabilityGraph;
// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON
// ═══════════════════════════════════════════════════════════════════════════
let instance = null;
function getCapabilityGraph() {
    if (!instance) {
        instance = new CoreOSCapabilityGraph();
    }
    return instance;
}
function resetCapabilityGraph() {
    instance = null;
}
//# sourceMappingURL=capability-graph.js.map