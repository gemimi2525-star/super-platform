/**
 * ═══════════════════════════════════════════════════════════════════════════
 * OS SHELL — Manifest Validation & SSOT Enforcement
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Phase 9.1: Ensures manifest and registry are in sync.
 * 
 * Guards:
 * - Apps in manifest must have registry component (or show "App Unavailable")
 * - Apps in registry must have manifest (or hidden from Dock/Finder)
 * 
 * @module components/os-shell/apps/manifest-validation
 * @version 1.0.0 (Phase 9.1)
 */

import { APP_MANIFESTS, type ShellAppManifest } from './manifest';
import { appRegistry, hasAppComponent } from './registry';

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface ManifestValidationResult {
    valid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
}

export interface ValidationError {
    type: 'missing_component' | 'missing_manifest';
    appId: string;
    message: string;
}

export interface ValidationWarning {
    type: 'hidden_app' | 'orphan_component';
    appId: string;
    message: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// ALLOWLIST FOR ORPHAN COMPONENTS (internal/special apps)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Apps in registry that intentionally don't have a manifest.
 * These are internal-only apps not shown in Dock/Finder.
 */
const ORPHAN_COMPONENT_ALLOWLIST: readonly string[] = [
    // Add any internal-only apps here
] as const;

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Validate that manifest and registry are in sync.
 * 
 * Rules:
 * 1. Every app in manifest with showInDock/showInFinder must have registry component
 * 2. Every component in registry (not in allowlist) should have manifest
 */
export function validateManifestRegistry(): ManifestValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check 1: Manifests must have components
    for (const [appId, manifest] of Object.entries(APP_MANIFESTS)) {
        if (manifest.showInDock || manifest.showInFinder) {
            if (!hasAppComponent(appId)) {
                errors.push({
                    type: 'missing_component',
                    appId,
                    message: `App "${manifest.name}" (${appId}) is in manifest but has no registry component`,
                });
            }
        }
    }

    // Check 2: Registry components should have manifests (except allowlist)
    for (const appId of Object.keys(appRegistry)) {
        if (ORPHAN_COMPONENT_ALLOWLIST.includes(appId)) {
            continue; // Intentionally orphan
        }

        if (!APP_MANIFESTS[appId]) {
            warnings.push({
                type: 'orphan_component',
                appId,
                message: `Registry has "${appId}" but no manifest — app will be hidden from Dock/Finder`,
            });
        }
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
}

/**
 * Run validation at startup and log results.
 * Call this in OSShell initialization.
 */
export function runStartupValidation(): void {
    const result = validateManifestRegistry();

    if (!result.valid) {
        console.warn(
            '[NEXUS Manifest Validation] ⚠️ Manifest/Registry mismatch detected:',
            result.errors.map(e => `\n  - ${e.message}`)
        );
    }

    if (result.warnings.length > 0) {
        console.info(
            '[NEXUS Manifest Validation] ℹ️ Warnings:',
            result.warnings.map(w => `\n  - ${w.message}`)
        );
    }

    if (result.valid && result.warnings.length === 0) {
        console.log('[NEXUS Manifest Validation] ✓ All apps validated');
    }
}

/**
 * Check if a specific app has a valid component.
 * Used by window manager to decide whether to show "App Unavailable".
 */
export function isAppAvailable(appId: string): boolean {
    return hasAppComponent(appId);
}

/**
 * Get the manifest for an app, or null if not found.
 */
export function getManifestForApp(appId: string): ShellAppManifest | null {
    return APP_MANIFESTS[appId] ?? null;
}

/**
 * Check if an app should be visible in dock/finder.
 * Returns false if:
 * - No manifest exists
 * - Manifest has disabled flag
 */
export function isAppVisible(appId: string): boolean {
    const manifest = APP_MANIFESTS[appId];
    if (!manifest) return false;
    if (manifest.disabled) return false;
    return true;
}
