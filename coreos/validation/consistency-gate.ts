/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CONSISTENCY GATE — Manifest ↔ Registry Validation
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Validates consistency between capability manifests and app registry.
 * Prevents capabilityId mismatch bugs.
 * 
 * Checks:
 * 1. All showInDock manifests have registry entry
 * 2. All registry entries reference valid manifests
 * 3. Reports "Coming Soon" capabilities
 * 
 * @module coreos/validation/consistency-gate
 * @version 1.0.0
 */

import { CAPABILITY_MANIFESTS } from '../manifests';
import { appRegistry } from '@/components/os-shell/apps/registry';
import type { CapabilityId } from '../types';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface ValidationError {
    type: 'registry_missing_manifest' | 'invalid_reference';
    capabilityId: string;
    message: string;
}

interface ValidationWarning {
    type: 'dock_missing_registry' | 'registry_duplicate';
    capabilityId: string;
    message: string;
}

interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
    comingSoon: string[];
    registeredApps: string[];
}

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION LOGIC
// ═══════════════════════════════════════════════════════════════════════════

export function validateConsistency(): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const comingSoon: string[] = [];
    const registeredApps: string[] = [];

    // Get all manifest IDs
    const manifestIds = new Set(Object.keys(CAPABILITY_MANIFESTS));

    // Get all registry IDs
    const registryIds = new Set(Object.keys(appRegistry));

    // ═══════════════════════════════════════════════════════════════════════
    // Check 1: Registry entries must reference valid manifests
    // ═══════════════════════════════════════════════════════════════════════
    for (const registryId of registryIds) {
        if (!manifestIds.has(registryId)) {
            errors.push({
                type: 'registry_missing_manifest',
                capabilityId: registryId,
                message: `Registry has '${registryId}' but no manifest exists`,
            });
        } else {
            registeredApps.push(registryId);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Check 2: showInDock manifests should have registry entry
    // ═══════════════════════════════════════════════════════════════════════
    for (const [id, manifest] of Object.entries(CAPABILITY_MANIFESTS)) {
        if (manifest.showInDock) {
            if (!registryIds.has(id)) {
                warnings.push({
                    type: 'dock_missing_registry',
                    capabilityId: id,
                    message: `Manifest '${id}' has showInDock=true but no registry entry`,
                });
                comingSoon.push(id);
            }
        }
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings,
        comingSoon,
        registeredApps,
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// REPORTING
// ═══════════════════════════════════════════════════════════════════════════

function formatResult(result: ValidationResult): string {
    const lines: string[] = [];

    lines.push('━'.repeat(70));
    lines.push('CONSISTENCY GATE — Manifest ↔ Registry Validation');
    lines.push('━'.repeat(70));
    lines.push('');

    // Registered Apps
    if (result.registeredApps.length > 0) {
        lines.push('✅ Registered Apps');
        for (const id of result.registeredApps) {
            const manifest = CAPABILITY_MANIFESTS[id as CapabilityId];
            lines.push(`   - ${id} → ${manifest?.title || 'Unknown'} (OK)`);
        }
        lines.push('');
    }

    // Errors
    if (result.errors.length > 0) {
        lines.push('❌ ERRORS');
        for (const error of result.errors) {
            lines.push(`   - ${error.capabilityId}: ${error.message}`);
        }
        lines.push('');
    }

    // Warnings
    if (result.warnings.length > 0) {
        lines.push('⚠️  Dock Capabilities Missing Registry');
        for (const warning of result.warnings) {
            const manifest = CAPABILITY_MANIFESTS[warning.capabilityId as CapabilityId];
            lines.push(`   - ${warning.capabilityId} (${manifest?.title || 'Unknown'})`);
        }
        lines.push('');
    }

    // Coming Soon
    if (result.comingSoon.length > 0) {
        lines.push(`🚧 Coming Soon Capabilities (${result.comingSoon.length})`);
        for (const id of result.comingSoon) {
            const manifest = CAPABILITY_MANIFESTS[id as CapabilityId];
            lines.push(`   - ${id} (${manifest?.title || 'Unknown'})`);
        }
        lines.push('');
    }

    lines.push('━'.repeat(70));
    const status = result.valid ? 'PASS' : 'FAIL';
    const errorCount = result.errors.length;
    const warningCount = result.warnings.length;
    lines.push(`Result: ${status} (${errorCount} errors, ${warningCount} warnings)`);
    lines.push('━'.repeat(70));

    return lines.join('\n');
}

// ═══════════════════════════════════════════════════════════════════════════
// CLI RUNNER
// ═══════════════════════════════════════════════════════════════════════════

export function runConsistencyGate(): boolean {
    const result = validateConsistency();
    console.log(formatResult(result));
    return result.valid;
}

// Run if called directly
if (require.main === module) {
    const passed = runConsistencyGate();
    process.exit(passed ? 0 : 1);
}
