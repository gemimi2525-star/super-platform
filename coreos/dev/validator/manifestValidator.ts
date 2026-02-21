/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Manifest Validator Engine — Deep Validation (Phase 24)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Validates all ShellAppManifests against:
 * - Required fields (appId, name, version, requiredRole, category)
 * - Registry component existence
 * - Semver format
 * - Audit binding coverage (informational)
 *
 * Returns structured { status, warnings, errors } per app.
 */

import { APP_MANIFESTS, validateManifest } from '@/components/os-shell/apps/manifest';
import { appRegistry } from '@/components/os-shell/apps/registry';

export interface ValidationResult {
    appId: string;
    name: string;
    status: 'OK' | 'WARN' | 'ERROR';
    warnings: string[];
    errors: string[];
}

export interface ValidatorReport {
    total: number;
    passed: number;
    warned: number;
    failed: number;
    results: ValidationResult[];
}

/**
 * Deep-validate a single manifest
 */
export function validateManifestDeep(appId: string): ValidationResult {
    const manifest = APP_MANIFESTS[appId];
    const warnings: string[] = [];
    const errors: string[] = [];

    if (!manifest) {
        return { appId, name: '(unknown)', status: 'ERROR', warnings, errors: ['Manifest not found'] };
    }

    // Basic field validation (reuse existing)
    const basicErrors = validateManifest(manifest);
    errors.push(...basicErrors);

    // Registry component check
    if (!appRegistry[appId]) {
        warnings.push('No component registered in appRegistry — will show AppUnavailable fallback');
    }

    // Capability array check
    if (manifest.capabilities.length === 0 && manifest.category !== 'utility') {
        warnings.push('No capabilities declared (informational)');
    }

    // singleInstance + showInDock check
    if (manifest.showInDock && !manifest.singleInstance) {
        warnings.push('Dock-visible app without singleInstance — multiple windows possible');
    }

    const status = errors.length > 0 ? 'ERROR' : warnings.length > 0 ? 'WARN' : 'OK';
    return { appId, name: manifest.name, status, warnings, errors };
}

/**
 * Validate ALL manifests
 */
export function validateAllDeep(): ValidatorReport {
    const results: ValidationResult[] = [];

    for (const appId of Object.keys(APP_MANIFESTS)) {
        results.push(validateManifestDeep(appId));
    }

    // Also check registry entries without manifests
    for (const regId of Object.keys(appRegistry)) {
        if (!APP_MANIFESTS[regId]) {
            results.push({
                appId: regId,
                name: '(orphan)',
                status: 'WARN',
                warnings: ['Component registered but no manifest — not visible in shell'],
                errors: [],
            });
        }
    }

    return {
        total: results.length,
        passed: results.filter(r => r.status === 'OK').length,
        warned: results.filter(r => r.status === 'WARN').length,
        failed: results.filter(r => r.status === 'ERROR').length,
        results,
    };
}
